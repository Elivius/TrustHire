/// Reputation module for TrustHire.
///
/// Maintains a per-freelancer `ReputationRecord` shared object that tracks
/// completed projects, total earnings, on-time delivery rate, average client
/// rating, and the latest cached Gonka AI trust score.
///
/// `record_completion` is `public(package)` — only `trusthire::escrow` may
/// call it, preventing external score inflation.
#[allow(deprecated_usage)]
module trusthire::reputation;

use std::string::String;
use sui::clock::Clock;
use sui::dynamic_field;
use sui::event;

// ---------------------------------------------------------------------------
// Error constants
// ---------------------------------------------------------------------------

const ERecordAlreadyExists: u64 = 0;
const EInvalidRating: u64 = 1;


// ---------------------------------------------------------------------------
// Dynamic-field key types
// ---------------------------------------------------------------------------

/// Key used on `ReputationRegistry` to track which freelancer addresses
/// already have a record, preventing duplicates.
public struct FreelancerKey(address) has copy, drop, store;

// ---------------------------------------------------------------------------
// Objects
// ---------------------------------------------------------------------------

/// Singleton shared registry created during `init`.
/// Holds a mapping of freelancer address → record ID to enforce uniqueness.
public struct ReputationRegistry has key {
    id: UID,
}

/// Per-freelancer shared object.  Created once per address via
/// `create_record` and then shared permanently.
public struct ReputationRecord has key {
    id: UID,
    /// The freelancer's Sui address.
    freelancer: address,
    /// Total number of projects completed (all milestones released).
    completed_projects: u64,
    /// Cumulative earnings in base coin units (MIST for SUI, micro-USDC, etc.)
    total_earned: u64,
    /// Projects delivered on or before the final milestone deadline.
    on_time_count: u64,
    /// Rolling average rating * 10 (so 45 == 4.5 stars).
    /// Updated incrementally: new_avg = (old_avg * n + new_rating * 10) / (n + 1)
    avg_rating_x10: u64,
    /// Number of ratings received (used for rolling average).
    rating_count: u64,
    /// Last cached Gonka AI trust score (0–100).
    gonka_trust_score: u64,
    /// Gonka request_id for the last trust-score computation — on-chain AI audit trail.
    gonka_trust_request_id: String,
    /// Timestamp (ms) of the last update.
    last_updated_ms: u64,
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

public struct ReputationRecordCreated has copy, drop {
    record_id: ID,
    freelancer: address,
    created_at_ms: u64,
}

public struct ReputationUpdated has copy, drop {
    record_id: ID,
    freelancer: address,
    completed_projects: u64,
    total_earned: u64,
    gonka_trust_score: u64,
    updated_at_ms: u64,
}

public struct TrustScoreUpdated has copy, drop {
    record_id: ID,
    freelancer: address,
    new_trust_score: u64,
    gonka_request_id: String,
    updated_at_ms: u64,
}

public struct RatingSubmitted has copy, drop {
    record_id: ID,
    freelancer: address,
    rating: u64,
    new_avg_rating_x10: u64,
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

fun init(ctx: &mut TxContext) {
    let registry = ReputationRegistry {
        id: object::new(ctx),
    };
    transfer::share_object(registry);
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/// Create a new `ReputationRecord` for `freelancer_addr` and share it.
/// Returns the new record's object ID so the caller can store it off-chain.
/// Aborts if a record for this address already exists.
public fun create_record(
    registry: &mut ReputationRegistry,
    freelancer_addr: address,
    clock: &Clock,
    ctx: &mut TxContext,
): ID {
    let key = FreelancerKey(freelancer_addr);
    assert!(!dynamic_field::exists_(&registry.id, key), ERecordAlreadyExists);

    let record = ReputationRecord {
        id: object::new(ctx),
        freelancer: freelancer_addr,
        completed_projects: 0,
        total_earned: 0,
        on_time_count: 0,
        avg_rating_x10: 0,
        rating_count: 0,
        gonka_trust_score: 0,
        gonka_trust_request_id: b"".to_string(),
        last_updated_ms: clock.timestamp_ms(),
    };

    let record_id = object::id(&record);

    // Mark this address as having a record in the registry.
    dynamic_field::add(&mut registry.id, key, record_id);

    event::emit(ReputationRecordCreated {
        record_id,
        freelancer: freelancer_addr,
        created_at_ms: clock.timestamp_ms(),
    });

    transfer::share_object(record);
    record_id
}

/// Record a completed project.  Called exclusively by `trusthire::escrow`
/// when all milestones are released.
/// `public(package)` — not callable from outside this Move package.
public(package) fun record_completion(
    record: &mut ReputationRecord,
    amount_earned: u64,
    on_time: bool,
    clock: &Clock,
) {
    record.completed_projects = record.completed_projects + 1;
    record.total_earned = record.total_earned + amount_earned;
    if (on_time) {
        record.on_time_count = record.on_time_count + 1;
    };
    record.last_updated_ms = clock.timestamp_ms();

    event::emit(ReputationUpdated {
        record_id: object::id(record),
        freelancer: record.freelancer,
        completed_projects: record.completed_projects,
        total_earned: record.total_earned,
        gonka_trust_score: record.gonka_trust_score,
        updated_at_ms: record.last_updated_ms,
    });
}

/// Update the cached Gonka trust score.
/// Callable by anyone who holds a reference to the record — the frontend API
/// route is responsible for rate-limiting and authentication.
public fun update_trust_score(
    record: &mut ReputationRecord,
    trust_score: u64,
    gonka_request_id: String,
    clock: &Clock,
    _ctx: &mut TxContext,
) {
    record.gonka_trust_score = trust_score;
    record.gonka_trust_request_id = gonka_request_id;
    record.last_updated_ms = clock.timestamp_ms();

    event::emit(TrustScoreUpdated {
        record_id: object::id(record),
        freelancer: record.freelancer,
        new_trust_score: trust_score,
        gonka_request_id: record.gonka_trust_request_id,
        updated_at_ms: record.last_updated_ms,
    });
}

/// Submit a client rating (1–5) for a freelancer after project completion.
/// Updates the rolling average stored as `avg_rating_x10`.
public fun submit_rating(
    record: &mut ReputationRecord,
    rating: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(rating >= 1 && rating <= 5, EInvalidRating);
    let _ = ctx; // ctx reserved for future auth checks

    let new_count = record.rating_count + 1;
    let new_avg = (record.avg_rating_x10 * record.rating_count + rating * 10) / new_count;
    record.avg_rating_x10 = new_avg;
    record.rating_count = new_count;
    record.last_updated_ms = clock.timestamp_ms();

    event::emit(RatingSubmitted {
        record_id: object::id(record),
        freelancer: record.freelancer,
        rating,
        new_avg_rating_x10: new_avg,
    });
}

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

public fun freelancer(record: &ReputationRecord): address { record.freelancer }
public fun completed_projects(record: &ReputationRecord): u64 { record.completed_projects }
public fun total_earned(record: &ReputationRecord): u64 { record.total_earned }
public fun on_time_count(record: &ReputationRecord): u64 { record.on_time_count }
public fun avg_rating_x10(record: &ReputationRecord): u64 { record.avg_rating_x10 }
public fun rating_count(record: &ReputationRecord): u64 { record.rating_count }
public fun gonka_trust_score(record: &ReputationRecord): u64 { record.gonka_trust_score }
public fun gonka_trust_request_id(record: &ReputationRecord): String {
    record.gonka_trust_request_id
}
public fun last_updated_ms(record: &ReputationRecord): u64 { record.last_updated_ms }

/// Check whether a reputation record exists for a given address.
public fun has_record(registry: &ReputationRegistry, freelancer_addr: address): bool {
    dynamic_field::exists_(&registry.id, FreelancerKey(freelancer_addr))
}

// ---------------------------------------------------------------------------
// Test-only helpers
// ---------------------------------------------------------------------------

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
