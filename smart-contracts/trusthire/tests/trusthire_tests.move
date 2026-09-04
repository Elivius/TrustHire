/// Unit tests for `trusthire::escrow` and `trusthire::reputation`.
///
/// Covers:
///   - Happy path: create escrow → submit → approve all milestones → completed
///   - Amount validation: milestone total != deposited amount aborts
///   - Auth guards: non-client cannot approve, non-freelancer cannot submit
///   - Reputation: record created, counters increment on completion
///   - Multi-milestone: each milestone releases independently
///
/// Note on abort codes:
///   Move constants cannot be public; `#[error]` constants get sequential u64
///   codes in declaration order.  We mirror them here as u64 constants.
///
/// Note on expected_failure tests:
///   To avoid "unused value without drop" errors in aborting tests we never
///   assign Clock to a local variable inside the aborting scope — we pass
///   `clock::create_for_testing` results by reference inline or use a shared
///   Clock object approach.  Where an intermediate clock binding is needed,
///   we consume it with `clock::destroy_for_testing` on an unreachable line
///   so the borrow checker is satisfied on every path.
#[test_only]
module trusthire::trusthire_tests;

use std::unit_test::assert_eq;
use sui::clock::{Self, Clock};
use sui::coin;
use sui::sui::SUI;
use sui::test_scenario;
use sui::test_utils;
use trusthire::escrow::{Self, EscrowContract};
use trusthire::reputation::{Self, ReputationRecord, ReputationRegistry};

// ---------------------------------------------------------------------------
// Test addresses
// ---------------------------------------------------------------------------

const CLIENT: address = @0xC;
const FREELANCER: address = @0xF;
const ATTACKER: address = @0xE;

// ---------------------------------------------------------------------------
// Mirrored abort codes for expected_failure
// (#[error] constants get sequential codes in declaration order)
//
// escrow.move:   0=ENotClient  1=ENotFreelancer  2=EInvalidMilestoneStatus
//                3=EMilestoneNotFound  4=EAmountMismatch  5=ENoMilestones
//                6=EEscrowNotActive  7=EZeroAmount
//
// reputation.move:  0=ERecordAlreadyExists  1=EInvalidRating
// ---------------------------------------------------------------------------

const E_NOT_CLIENT: u64 = 0;
const E_NOT_FREELANCER: u64 = 1;
const E_AMOUNT_MISMATCH: u64 = 4;
const E_NO_MILESTONES: u64 = 5;
const E_RECORD_ALREADY_EXISTS: u64 = 0;
const E_INVALID_RATING: u64 = 1;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fun mk_clock(ctx: &mut TxContext): Clock {
    clock::create_for_testing(ctx)
}

fun single_milestone_params(): (
    vector<u64>,
    vector<std::string::String>,
    vector<std::string::String>,
    vector<u64>,
    vector<u64>,
) {
    (
        vector[0u64],
        vector[b"Design mockup".to_string()],
        vector[b"Figma file with all screens".to_string()],
        vector[1000u64],
        vector[0u64],
    )
}

fun two_milestone_params(): (
    vector<u64>,
    vector<std::string::String>,
    vector<std::string::String>,
    vector<u64>,
    vector<u64>,
) {
    (
        vector[0u64, 1u64],
        vector[b"Milestone 1".to_string(), b"Milestone 2".to_string()],
        vector[b"Deliverable 1".to_string(), b"Deliverable 2".to_string()],
        vector[600u64, 400u64],
        vector[0u64, 0u64],
    )
}

// ---------------------------------------------------------------------------
// Reputation — happy path
// ---------------------------------------------------------------------------

#[test]
fun create_reputation_record_succeeds() {
    let mut scenario = test_scenario::begin(CLIENT);

    {
        reputation::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(CLIENT);
    {
        let mut registry = scenario.take_shared<ReputationRegistry>();
        let clock = mk_clock(scenario.ctx());

        reputation::create_record(&mut registry, FREELANCER, &clock, scenario.ctx());

        assert!(reputation::has_record(&registry, FREELANCER));
        assert!(!reputation::has_record(&registry, ATTACKER));

        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = E_RECORD_ALREADY_EXISTS, location = reputation)]
fun duplicate_reputation_record_aborts() {
    let mut scenario = test_scenario::begin(CLIENT);

    {
        reputation::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(CLIENT);
    {
        let mut registry = scenario.take_shared<ReputationRegistry>();
        let clock = mk_clock(scenario.ctx());

        reputation::create_record(&mut registry, FREELANCER, &clock, scenario.ctx());
        // Second call — aborts with ERecordAlreadyExists
        reputation::create_record(&mut registry, FREELANCER, &clock, scenario.ctx());

        // Unreachable — compiler requires these to satisfy linear type rules
        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };
    test_utils::destroy(scenario);
}

#[test]
fun update_trust_score_stores_request_id() {
    let mut scenario = test_scenario::begin(CLIENT);

    {
        reputation::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(CLIENT);
    {
        let mut registry = scenario.take_shared<ReputationRegistry>();
        let clock = mk_clock(scenario.ctx());
        reputation::create_record(&mut registry, FREELANCER, &clock, scenario.ctx());
        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    scenario.next_tx(FREELANCER);
    {
        let mut record = scenario.take_shared<ReputationRecord>();
        let clock = mk_clock(scenario.ctx());

        reputation::update_trust_score(
            &mut record,
            85,
            b"gonka-req-abc123".to_string(),
            &clock,
            scenario.ctx(),
        );

        assert_eq!(reputation::gonka_trust_score(&record), 85);
        assert_eq!(
            reputation::gonka_trust_request_id(&record),
            b"gonka-req-abc123".to_string(),
        );

        test_scenario::return_shared(record);
        clock::destroy_for_testing(clock);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = E_INVALID_RATING, location = reputation)]
fun invalid_rating_aborts() {
    let mut scenario = test_scenario::begin(CLIENT);

    {
        reputation::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(CLIENT);
    {
        let mut registry = scenario.take_shared<ReputationRegistry>();
        let clock = mk_clock(scenario.ctx());
        reputation::create_record(&mut registry, FREELANCER, &clock, scenario.ctx());
        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    scenario.next_tx(CLIENT);
    {
        let mut record = scenario.take_shared<ReputationRecord>();
        let clock = mk_clock(scenario.ctx());
        // Rating 6 — aborts with EInvalidRating
        reputation::submit_rating(&mut record, 6, &clock, scenario.ctx());

        // Unreachable — required for linear type rules
        test_scenario::return_shared(record);
        clock::destroy_for_testing(clock);
    };
    test_utils::destroy(scenario);
}

// ---------------------------------------------------------------------------
// Escrow — full happy path (single milestone)
// ---------------------------------------------------------------------------

#[test]
fun full_single_milestone_happy_path() {
    let mut scenario = test_scenario::begin(CLIENT);

    {
        escrow::init_for_testing(scenario.ctx());
        reputation::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(CLIENT);
    {
        let mut registry = scenario.take_shared<ReputationRegistry>();
        let clock = mk_clock(scenario.ctx());
        reputation::create_record(&mut registry, FREELANCER, &clock, scenario.ctx());
        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    // Client creates escrow
    scenario.next_tx(CLIENT);
    {
        let clock = mk_clock(scenario.ctx());
        let payment = coin::mint_for_testing<SUI>(1000, scenario.ctx());
        let (ids, titles, deliverables, amounts, deadlines) = single_milestone_params();

        escrow::create_escrow<SUI>(
            b"proj-uuid-001".to_string(),
            FREELANCER,
            payment,
            ids,
            titles,
            deliverables,
            amounts,
            deadlines,
            b"gonka-match-req-001".to_string(),
            &clock,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clock);
    };

    // Freelancer submits milestone 0
    scenario.next_tx(FREELANCER);
    {
        let mut escrow = scenario.take_shared<EscrowContract<SUI>>();
        let clock = mk_clock(scenario.ctx());

        escrow::submit_milestone(&mut escrow, 0, &clock, scenario.ctx());
        assert_eq!(escrow::milestone_status(&escrow, 0), 1);

        test_scenario::return_shared(escrow);
        clock::destroy_for_testing(clock);
    };

    // Client approves milestone 0 — auto-releases payment
    scenario.next_tx(CLIENT);
    {
        let mut escrow = scenario.take_shared<EscrowContract<SUI>>();
        let mut record = scenario.take_shared<ReputationRecord>();
        let clock = mk_clock(scenario.ctx());

        assert_eq!(escrow::balance_value(&escrow), 1000);

        escrow::approve_milestone<SUI>(
            &mut escrow,
            &mut record,
            0,
            b"gonka-verify-req-001".to_string(),
            &clock,
            scenario.ctx(),
        );

        assert_eq!(escrow::balance_value(&escrow), 0);
        assert_eq!(escrow::escrow_status(&escrow), 1); // completed
        assert_eq!(reputation::completed_projects(&record), 1);
        assert_eq!(reputation::total_earned(&record), 1000);

        test_scenario::return_shared(escrow);
        test_scenario::return_shared(record);
        clock::destroy_for_testing(clock);
    };

    scenario.end();
}

// ---------------------------------------------------------------------------
// Escrow — multi-milestone: partial then full release
// ---------------------------------------------------------------------------

#[test]
fun two_milestones_release_independently() {
    let mut scenario = test_scenario::begin(CLIENT);

    {
        escrow::init_for_testing(scenario.ctx());
        reputation::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(CLIENT);
    {
        let mut registry = scenario.take_shared<ReputationRegistry>();
        let clock = mk_clock(scenario.ctx());
        reputation::create_record(&mut registry, FREELANCER, &clock, scenario.ctx());
        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    scenario.next_tx(CLIENT);
    {
        let clock = mk_clock(scenario.ctx());
        let payment = coin::mint_for_testing<SUI>(1000, scenario.ctx());
        let (ids, titles, deliverables, amounts, deadlines) = two_milestone_params();

        escrow::create_escrow<SUI>(
            b"proj-uuid-002".to_string(),
            FREELANCER,
            payment,
            ids,
            titles,
            deliverables,
            amounts,
            deadlines,
            b"gonka-match-req-002".to_string(),
            &clock,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clock);
    };

    // Submit + approve milestone 0 (600 units)
    scenario.next_tx(FREELANCER);
    {
        let mut escrow = scenario.take_shared<EscrowContract<SUI>>();
        let clock = mk_clock(scenario.ctx());
        escrow::submit_milestone(&mut escrow, 0, &clock, scenario.ctx());
        test_scenario::return_shared(escrow);
        clock::destroy_for_testing(clock);
    };

    scenario.next_tx(CLIENT);
    {
        let mut escrow = scenario.take_shared<EscrowContract<SUI>>();
        let mut record = scenario.take_shared<ReputationRecord>();
        let clock = mk_clock(scenario.ctx());

        escrow::approve_milestone<SUI>(&mut escrow, &mut record, 0, b"".to_string(), &clock, scenario.ctx());

        assert_eq!(escrow::balance_value(&escrow), 400);
        assert_eq!(escrow::escrow_status(&escrow), 0); // still active
        assert_eq!(reputation::completed_projects(&record), 0); // not done yet

        test_scenario::return_shared(escrow);
        test_scenario::return_shared(record);
        clock::destroy_for_testing(clock);
    };

    // Submit + approve milestone 1 (400 units) — triggers completion
    scenario.next_tx(FREELANCER);
    {
        let mut escrow = scenario.take_shared<EscrowContract<SUI>>();
        let clock = mk_clock(scenario.ctx());
        escrow::submit_milestone(&mut escrow, 1, &clock, scenario.ctx());
        test_scenario::return_shared(escrow);
        clock::destroy_for_testing(clock);
    };

    scenario.next_tx(CLIENT);
    {
        let mut escrow = scenario.take_shared<EscrowContract<SUI>>();
        let mut record = scenario.take_shared<ReputationRecord>();
        let clock = mk_clock(scenario.ctx());

        escrow::approve_milestone<SUI>(&mut escrow, &mut record, 1, b"".to_string(), &clock, scenario.ctx());

        assert_eq!(escrow::balance_value(&escrow), 0);
        assert_eq!(escrow::escrow_status(&escrow), 1); // completed
        assert_eq!(reputation::completed_projects(&record), 1);

        test_scenario::return_shared(escrow);
        test_scenario::return_shared(record);
        clock::destroy_for_testing(clock);
    };

    scenario.end();
}

// ---------------------------------------------------------------------------
// Auth guard tests
// ---------------------------------------------------------------------------

#[test, expected_failure(abort_code = E_NOT_CLIENT, location = escrow)]
fun non_client_cannot_approve_milestone() {
    let mut scenario = test_scenario::begin(CLIENT);

    {
        escrow::init_for_testing(scenario.ctx());
        reputation::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(CLIENT);
    {
        let mut registry = scenario.take_shared<ReputationRegistry>();
        let clock = mk_clock(scenario.ctx());
        reputation::create_record(&mut registry, FREELANCER, &clock, scenario.ctx());
        test_scenario::return_shared(registry);
        clock::destroy_for_testing(clock);
    };

    scenario.next_tx(CLIENT);
    {
        let clock = mk_clock(scenario.ctx());
        let payment = coin::mint_for_testing<SUI>(1000, scenario.ctx());
        let (ids, titles, deliverables, amounts, deadlines) = single_milestone_params();
        escrow::create_escrow<SUI>(b"proj-uuid-003".to_string(), FREELANCER, payment, ids, titles, deliverables, amounts, deadlines, b"".to_string(), &clock, scenario.ctx());
        clock::destroy_for_testing(clock);
    };

    scenario.next_tx(FREELANCER);
    {
        let mut escrow = scenario.take_shared<EscrowContract<SUI>>();
        let clock = mk_clock(scenario.ctx());
        escrow::submit_milestone(&mut escrow, 0, &clock, scenario.ctx());
        test_scenario::return_shared(escrow);
        clock::destroy_for_testing(clock);
    };

    // ATTACKER tries to approve — aborts with ENotClient
    scenario.next_tx(ATTACKER);
    {
        let mut escrow = scenario.take_shared<EscrowContract<SUI>>();
        let mut record = scenario.take_shared<ReputationRecord>();
        let clock = mk_clock(scenario.ctx());
        escrow::approve_milestone<SUI>(&mut escrow, &mut record, 0, b"".to_string(), &clock, scenario.ctx());

        // Unreachable — required for linear type rules
        test_scenario::return_shared(escrow);
        test_scenario::return_shared(record);
        clock::destroy_for_testing(clock);
    };
    test_utils::destroy(scenario);
}

#[test, expected_failure(abort_code = E_NOT_FREELANCER, location = escrow)]
fun non_freelancer_cannot_submit_milestone() {
    let mut scenario = test_scenario::begin(CLIENT);

    {
        escrow::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(CLIENT);
    {
        let clock = mk_clock(scenario.ctx());
        let payment = coin::mint_for_testing<SUI>(1000, scenario.ctx());
        let (ids, titles, deliverables, amounts, deadlines) = single_milestone_params();
        escrow::create_escrow<SUI>(b"proj-uuid-004".to_string(), FREELANCER, payment, ids, titles, deliverables, amounts, deadlines, b"".to_string(), &clock, scenario.ctx());
        clock::destroy_for_testing(clock);
    };

    // ATTACKER tries to submit — aborts with ENotFreelancer
    scenario.next_tx(ATTACKER);
    {
        let mut escrow = scenario.take_shared<EscrowContract<SUI>>();
        let clock = mk_clock(scenario.ctx());
        escrow::submit_milestone(&mut escrow, 0, &clock, scenario.ctx());

        // Unreachable — required for linear type rules
        test_scenario::return_shared(escrow);
        clock::destroy_for_testing(clock);
    };
    test_utils::destroy(scenario);
}

// ---------------------------------------------------------------------------
// Amount validation
// ---------------------------------------------------------------------------

#[test, expected_failure(abort_code = E_AMOUNT_MISMATCH, location = escrow)]
fun milestone_sum_mismatch_aborts() {
    let mut scenario = test_scenario::begin(CLIENT);

    {
        escrow::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(CLIENT);
    {
        let clock = mk_clock(scenario.ctx());
        // Deposit 1000 but milestone amounts sum to 800
        let payment = coin::mint_for_testing<SUI>(1000, scenario.ctx());
        escrow::create_escrow<SUI>(
            b"proj-uuid-005".to_string(),
            FREELANCER,
            payment,
            vector[0u64],
            vector[b"Title".to_string()],
            vector[b"Deliverable".to_string()],
            vector[800u64], // mismatch — aborts with EAmountMismatch
            vector[0u64],
            b"".to_string(),
            &clock,
            scenario.ctx(),
        );

        // Unreachable — required for linear type rules
        clock::destroy_for_testing(clock);
    };
    test_utils::destroy(scenario);
}

#[test, expected_failure(abort_code = E_NO_MILESTONES, location = escrow)]
fun zero_milestones_aborts() {
    let mut scenario = test_scenario::begin(CLIENT);

    {
        escrow::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(CLIENT);
    {
        let clock = mk_clock(scenario.ctx());
        let payment = coin::mint_for_testing<SUI>(1000, scenario.ctx());
        escrow::create_escrow<SUI>(
            b"proj-uuid-006".to_string(),
            FREELANCER,
            payment,
            vector[], // no milestones — aborts with ENoMilestones
            vector[],
            vector[],
            vector[],
            vector[],
            b"".to_string(),
            &clock,
            scenario.ctx(),
        );

        // Unreachable — required for linear type rules
        clock::destroy_for_testing(clock);
    };
    test_utils::destroy(scenario);
}
