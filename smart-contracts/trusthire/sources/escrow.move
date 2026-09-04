/// Escrow module for TrustHire.
///
/// Manages trustless USDC escrow between a client and a freelancer,
/// structured around a milestone payment schedule.
///
/// Flow:
///   1. Client calls `create_escrow` → deposits Coin<T>, milestone list stored
///      on-chain, EscrowContract shared.
///   2. Freelancer calls `submit_milestone` → marks a milestone as submitted.
///   3. Client calls `approve_milestone` → auto-releases payment to freelancer
///      in the same transaction; records Gonka verification request_id for
///      the AI audit trail.
///   4. When the final milestone is released the escrow is marked completed
///      and `reputation::record_completion` is called.
///
/// Design choices:
///   - EscrowContract is a shared object — no ownership transfer needed.
///   - Milestones live in a vector inside the contract (v1; v2 may use
///     child objects for independent granularity).
///   - Generic over coin type `T` so it works with Sui testnet USDC or any
///     other stablecoin without code changes.
module trusthire::escrow;

use std::string::String;
use sui::balance::Balance;
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::event;
use trusthire::reputation::{Self, ReputationRecord};

// ---------------------------------------------------------------------------
// Constants — milestone status codes
// ---------------------------------------------------------------------------

const STATUS_PENDING: u8 = 0;
const STATUS_SUBMITTED: u8 = 1;
const STATUS_RELEASED: u8 = 2;

// ---------------------------------------------------------------------------
// Constants — escrow status codes
// ---------------------------------------------------------------------------

const ESCROW_ACTIVE: u8 = 0;
const ESCROW_COMPLETED: u8 = 1;

// ---------------------------------------------------------------------------
// Error constants
// ---------------------------------------------------------------------------

const ENotClient: u64 = 0;
const ENotFreelancer: u64 = 1;
const EInvalidMilestoneStatus: u64 = 2;
const EMilestoneNotFound: u64 = 3;
const EAmountMismatch: u64 = 4;
const ENoMilestones: u64 = 5;
const EEscrowNotActive: u64 = 6;
const EZeroAmount: u64 = 7;

// ---------------------------------------------------------------------------
// Structs
// ---------------------------------------------------------------------------

/// Platform capability issued to the deployer in `init`.
/// Reserved for future governance / dispute-resolution features.
public struct AdminCap has key, store {
    id: UID,
}

/// A single milestone within a contract.
/// Stored as a vector element inside `EscrowContract` (v1).
public struct Milestone has store {
    /// Caller-supplied identifier (0-indexed, must be unique within the contract).
    milestone_id: u64,
    /// Short title shown in the UI.
    title: String,
    /// Detailed description of the deliverable.
    deliverable: String,
    /// Amount locked for this milestone, in base coin units.
    amount: u64,
    /// UNIX timestamp (ms) deadline; 0 means no deadline enforced on-chain.
    deadline_ts_ms: u64,
    /// Current milestone status: 0=pending, 1=submitted, 2=released.
    status: u8,
}

/// The central escrow object.  Shared on creation so both parties can call it.
public struct EscrowContract<phantom T> has key {
    id: UID,
    /// Supabase project UUID — links the on-chain object back to off-chain data.
    project_id: String,
    /// The client who funded the escrow and may approve milestones.
    client: address,
    /// The freelancer who will receive milestone payments.
    freelancer: address,
    /// Locked funds.  Released incrementally as milestones are approved.
    balance: Balance<T>,
    /// All milestones for this contract.
    milestones: vector<Milestone>,
    /// Gonka Router request_id used when the match was made — AI audit trail.
    gonka_match_request_id: String,
    /// Escrow status: 0=active, 1=completed.
    status: u8,
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

public struct EscrowCreated has copy, drop {
    escrow_id: ID,
    project_id: String,
    client: address,
    freelancer: address,
    total_amount: u64,
    milestone_count: u64,
    gonka_match_request_id: String,
    created_at_ms: u64,
}

public struct MilestoneSubmitted has copy, drop {
    escrow_id: ID,
    milestone_id: u64,
    freelancer: address,
    submitted_at_ms: u64,
}

public struct MilestoneReleased has copy, drop {
    escrow_id: ID,
    project_id: String,
    milestone_id: u64,
    amount: u64,
    freelancer: address,
    /// Gonka request_id for the AI submission-verification call (may be empty
    /// string if Workflow E was not invoked for this milestone).
    gonka_verify_request_id: String,
    released_at_ms: u64,
}

public struct EscrowCompleted has copy, drop {
    escrow_id: ID,
    project_id: String,
    freelancer: address,
    total_released: u64,
    completed_at_ms: u64,
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

fun init(ctx: &mut TxContext) {
    let cap = AdminCap { id: object::new(ctx) };
    transfer::transfer(cap, ctx.sender());
}

// ---------------------------------------------------------------------------
// Public functions — escrow lifecycle
// ---------------------------------------------------------------------------

/// Create a new escrow and share it on-chain.
///
/// Parameters:
///   - `project_id`            — Supabase UUID string for cross-reference
///   - `freelancer_addr`       — freelancer's Sui address
///   - `coin`                  — full payment coin (must match sum of milestone amounts)
///   - `milestone_ids`         — ordered list of caller-supplied milestone IDs
///   - `milestone_titles`      — one title per milestone
///   - `milestone_deliverables`— one deliverable description per milestone
///   - `milestone_amounts`     — one amount (base units) per milestone
///   - `milestone_deadlines`   — one deadline timestamp (ms, 0 = no deadline) per milestone
///   - `gonka_match_request_id`— Gonka request_id for the AI match that led to this hire
///
/// Returns the new EscrowContract's object ID.
public fun create_escrow<T>(
    project_id: String,
    freelancer_addr: address,
    coin: Coin<T>,
    milestone_ids: vector<u64>,
    milestone_titles: vector<String>,
    milestone_deliverables: vector<String>,
    milestone_amounts: vector<u64>,
    milestone_deadlines: vector<u64>,
    gonka_match_request_id: String,
    clock: &Clock,
    ctx: &mut TxContext,
): ID {
    let count = milestone_ids.length();
    assert!(count > 0, ENoMilestones);
    assert!(milestone_titles.length() == count, EAmountMismatch);
    assert!(milestone_deliverables.length() == count, EAmountMismatch);
    assert!(milestone_amounts.length() == count, EAmountMismatch);
    assert!(milestone_deadlines.length() == count, EAmountMismatch);

    // Validate total amounts equal deposited value.
    let total_coin_value = coin.value();
    let mut sum: u64 = 0;
    milestone_amounts.do_ref!(|amt| {
        assert!(*amt > 0, EZeroAmount);
        sum = sum + *amt;
    });
    assert!(sum == total_coin_value, EAmountMismatch);

    // Build milestone vector.
    let mut milestones: vector<Milestone> = vector[];
    let mut i = 0;
    while (i < count) {
        milestones.push_back(Milestone {
            milestone_id: milestone_ids[i],
            title: milestone_titles[i],
            deliverable: milestone_deliverables[i],
            amount: milestone_amounts[i],
            deadline_ts_ms: milestone_deadlines[i],
            status: STATUS_PENDING,
        });
        i = i + 1;
    };

    let escrow = EscrowContract<T> {
        id: object::new(ctx),
        project_id,
        client: ctx.sender(),
        freelancer: freelancer_addr,
        balance: coin.into_balance(),
        milestones,
        gonka_match_request_id,
        status: ESCROW_ACTIVE,
    };

    let escrow_id = object::id(&escrow);

    event::emit(EscrowCreated {
        escrow_id,
        project_id: escrow.project_id,
        client: escrow.client,
        freelancer: escrow.freelancer,
        total_amount: total_coin_value,
        milestone_count: (count as u64),
        gonka_match_request_id: escrow.gonka_match_request_id,
        created_at_ms: clock.timestamp_ms(),
    });

    transfer::share_object(escrow);
    escrow_id
}

/// Freelancer marks a milestone as submitted.
/// Validates: caller == freelancer, milestone must be in `pending` status.
public fun submit_milestone<T>(
    escrow: &mut EscrowContract<T>,
    milestone_id: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(ctx.sender() == escrow.freelancer, ENotFreelancer);
    assert!(escrow.status == ESCROW_ACTIVE, EEscrowNotActive);

    let milestone = find_milestone_mut(&mut escrow.milestones, milestone_id);
    assert!(milestone.status == STATUS_PENDING, EInvalidMilestoneStatus);

    milestone.status = STATUS_SUBMITTED;

    event::emit(MilestoneSubmitted {
        escrow_id: object::id(escrow),
        milestone_id,
        freelancer: escrow.freelancer,
        submitted_at_ms: clock.timestamp_ms(),
    });
}

/// Client approves a submitted milestone and auto-releases the payment.
///
/// `gonka_verify_request_id` — the Gonka request_id from Workflow E (AI
/// submission verification).  Pass an empty string if Workflow E was skipped.
///
/// `reputation_record` — the freelancer's `ReputationRecord` shared object.
/// Required so we can call `reputation::record_completion` in the same
/// transaction when the final milestone is released.
public fun approve_milestone<T>(
    escrow: &mut EscrowContract<T>,
    reputation_record: &mut ReputationRecord,
    milestone_id: u64,
    gonka_verify_request_id: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(ctx.sender() == escrow.client, ENotClient);
    assert!(escrow.status == ESCROW_ACTIVE, EEscrowNotActive);

    let milestone = find_milestone_mut(&mut escrow.milestones, milestone_id);
    assert!(milestone.status == STATUS_SUBMITTED, EInvalidMilestoneStatus);

    let release_amount = milestone.amount;
    let is_on_time = milestone.deadline_ts_ms == 0
        || clock.timestamp_ms() <= milestone.deadline_ts_ms;

    milestone.status = STATUS_RELEASED;

    // Extract the milestone amount from escrow balance and send to freelancer.
    let released_coin = coin::from_balance(
        escrow.balance.split(release_amount),
        ctx,
    );
    transfer::public_transfer(released_coin, escrow.freelancer);

    let escrow_id = object::id(escrow);

    event::emit(MilestoneReleased {
        escrow_id,
        project_id: escrow.project_id,
        milestone_id,
        amount: release_amount,
        freelancer: escrow.freelancer,
        gonka_verify_request_id,
        released_at_ms: clock.timestamp_ms(),
    });

    // Check if all milestones are released.
    let all_released = all_milestones_released(&escrow.milestones);
    if (all_released) {
        escrow.status = ESCROW_COMPLETED;

        let total_released = compute_total_released(&escrow.milestones);

        event::emit(EscrowCompleted {
            escrow_id,
            project_id: escrow.project_id,
            freelancer: escrow.freelancer,
            total_released,
            completed_at_ms: clock.timestamp_ms(),
        });

        // Update reputation record — on_time reflects the last milestone.
        reputation::record_completion(
            reputation_record,
            release_amount,
            is_on_time,
            clock,
        );
    };
}

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

public fun project_id<T>(escrow: &EscrowContract<T>): String { escrow.project_id }
public fun client<T>(escrow: &EscrowContract<T>): address { escrow.client }
public fun freelancer<T>(escrow: &EscrowContract<T>): address { escrow.freelancer }
public fun balance_value<T>(escrow: &EscrowContract<T>): u64 { escrow.balance.value() }
public fun escrow_status<T>(escrow: &EscrowContract<T>): u8 { escrow.status }
public fun gonka_match_request_id<T>(escrow: &EscrowContract<T>): String {
    escrow.gonka_match_request_id
}
public fun milestone_count<T>(escrow: &EscrowContract<T>): u64 {
    escrow.milestones.length()
}

// ---------------------------------------------------------------------------
// Milestone getters (by milestone_id)
// ---------------------------------------------------------------------------

public fun milestone_status<T>(escrow: &EscrowContract<T>, milestone_id: u64): u8 {
    find_milestone(&escrow.milestones, milestone_id).status
}

public fun milestone_amount<T>(escrow: &EscrowContract<T>, milestone_id: u64): u64 {
    find_milestone(&escrow.milestones, milestone_id).amount
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

fun find_milestone_mut(milestones: &mut vector<Milestone>, milestone_id: u64): &mut Milestone {
    let mut i = 0;
    let len = milestones.length();
    while (i < len) {
        if (milestones[i].milestone_id == milestone_id) {
            return &mut milestones[i]
        };
        i = i + 1;
    };
    abort EMilestoneNotFound
}

fun find_milestone(milestones: &vector<Milestone>, milestone_id: u64): &Milestone {
    let mut i = 0;
    let len = milestones.length();
    while (i < len) {
        if (milestones[i].milestone_id == milestone_id) {
            return &milestones[i]
        };
        i = i + 1;
    };
    abort EMilestoneNotFound
}

fun all_milestones_released(milestones: &vector<Milestone>): bool {
    let mut i = 0;
    let len = milestones.length();
    while (i < len) {
        if (milestones[i].status != STATUS_RELEASED) {
            return false
        };
        i = i + 1;
    };
    true
}

fun compute_total_released(milestones: &vector<Milestone>): u64 {
    let mut total: u64 = 0;
    milestones.do_ref!(|m| { total = total + m.amount });
    total
}

// ---------------------------------------------------------------------------
// Test-only helpers
// ---------------------------------------------------------------------------

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
