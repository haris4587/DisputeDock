import json
import re

from .test_lifecycle import (
    APPEAL_EVIDENCE,
    APPEAL_URL,
    CLIENT_ISSUE,
    CLIENT_URL,
    CRITERIA,
    DELIVERABLE,
    DELIVERABLE_URL,
    ESCROW,
    RESPONSE_URL,
    TERMS,
    TERMS_URL,
    WORKER_REPORT,
    WORKER_RESPONSE,
    WORKER_URL,
    accept_and_fund,
    address,
    agreement_record,
    create_case,
    digest,
    dispute_and_respond,
    latest_verdict,
    mock_evidence,
    mock_scores,
    ready_for_judgment,
    submit,
)


def test_wallet_authorization_is_enforced_across_lifecycle(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-auth-001"
    dock, client, worker, outsider = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    agreement_hash = agreement_record(dock, agreement_id)["agreement_hash"]

    direct_vm.sender = outsider
    with direct_vm.expect_revert("Only the assigned worker"):
        dock.accept_agreement(agreement_id, agreement_hash)

    direct_vm.sender = worker
    dock.accept_agreement(agreement_id, agreement_hash)
    direct_vm.sender = outsider
    direct_vm.value = ESCROW
    with direct_vm.expect_revert("Only the client"):
        dock.fund_agreement(agreement_id)
    direct_vm.value = 0

    direct_vm.sender = client
    direct_vm.value = ESCROW
    dock.fund_agreement(agreement_id)
    direct_vm.value = 0
    direct_vm.sender = outsider
    with direct_vm.expect_revert("Only the assigned worker"):
        dock.submit_milestone(
            agreement_id,
            DELIVERABLE_URL,
            digest(DELIVERABLE),
            "TEST_REPORT|" + WORKER_URL + "|" + digest(WORKER_REPORT),
            "An unauthorized submission must never change the agreement lifecycle state.",
        )

    submit(direct_vm, dock, worker, agreement_id)
    direct_vm.sender = outsider
    with direct_vm.expect_revert("Only the client"):
        dock.approve_milestone(agreement_id)
    with direct_vm.expect_revert("Only the client"):
        dock.open_dispute(
            agreement_id,
            "ISSUE_LOG|" + CLIENT_URL + "|" + digest(CLIENT_ISSUE),
            "An unauthorized caller must not be permitted to open a client dispute.",
        )

    direct_vm.sender = client
    dock.open_dispute(
        agreement_id,
        "ISSUE_LOG|" + CLIENT_URL + "|" + digest(CLIENT_ISSUE),
        "The authorized client records the reproducible wallet integration defect.",
    )
    direct_vm.sender = outsider
    with direct_vm.expect_revert("Only the assigned worker"):
        dock.respond_to_dispute(
            agreement_id,
            "COMMUNICATION|" + RESPONSE_URL + "|" + digest(WORKER_RESPONSE),
            "An outsider must not be allowed to impersonate the assigned worker response.",
        )
    with direct_vm.expect_revert("Only the client or worker"):
        dock.request_judgment(agreement_id)


def test_exact_hash_acceptance_and_exact_escrow_value(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-hash-001"
    dock, client, worker, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    direct_vm.sender = worker
    with direct_vm.expect_revert("exact committed agreement hash"):
        dock.accept_agreement(agreement_id, "f" * 64)
    dock.accept_agreement(agreement_id, agreement_record(dock, agreement_id)["agreement_hash"])

    direct_vm.sender = client
    direct_vm.value = ESCROW - 1
    with direct_vm.expect_revert("exactly equal"):
        dock.fund_agreement(agreement_id)
    direct_vm.value = 0
    assert agreement_record(dock, agreement_id)["status"] == "AWAITING_FUNDING"


def test_rejects_invalid_weights_malformed_hash_duplicate_id_and_same_party(
    direct_vm, direct_deploy, direct_accounts
):
    dock, client, worker, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, "dock-input-001"
    )
    direct_vm.sender = client
    with direct_vm.expect_revert("total exactly 10000"):
        dock.create_agreement(
            "dock-input-bad-weights",
            "Invalid weighted project",
            "This input intentionally uses criterion weights that do not total ten thousand.",
            address(worker),
            TERMS_URL,
            digest(TERMS),
            "First criterion|4000\nSecond criterion|4000",
            ESCROW,
            2_000_003_600,
            2_000_086_400,
            3600,
            3600,
            3600,
        )
    with direct_vm.expect_revert("lowercase 64-character"):
        dock.create_agreement(
            "dock-input-bad-digest",
            "Invalid evidence digest",
            "This input intentionally contains a malformed terms commitment for validation.",
            address(worker),
            TERMS_URL,
            "not-a-hash",
            CRITERIA,
            ESCROW,
            2_000_003_600,
            2_000_086_400,
            3600,
            3600,
            3600,
        )
    with direct_vm.expect_revert("different wallets"):
        dock.create_agreement(
            "dock-input-same-party",
            "Invalid role separation",
            "This input intentionally assigns the same wallet to both protected agreement roles.",
            address(client),
            TERMS_URL,
            digest(TERMS),
            CRITERIA,
            ESCROW,
            2_000_003_600,
            2_000_086_400,
            3600,
            3600,
            3600,
        )
    with direct_vm.expect_revert("already been used"):
        dock.create_agreement(
            "dock-input-001",
            "Duplicate identifier project",
            "This duplicate agreement identifier must be rejected before any state is changed.",
            address(worker),
            TERMS_URL,
            digest(TERMS),
            CRITERIA,
            ESCROW,
            2_000_003_600,
            2_000_086_400,
            3600,
            3600,
            3600,
        )


def test_duplicate_evidence_and_invalid_mutual_percentage_are_rejected(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-replay-001"
    dock, client, worker, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    accept_and_fund(direct_vm, dock, client, worker, agreement_id)
    duplicate_line = "TEST_REPORT|" + WORKER_URL + "|" + digest(WORKER_REPORT)
    direct_vm.sender = worker
    with direct_vm.expect_revert("Duplicate worker evidence"):
        dock.submit_milestone(
            agreement_id,
            DELIVERABLE_URL,
            digest(DELIVERABLE),
            duplicate_line + "\n" + duplicate_line,
            "The same evidence entry must not be replayed in a single manifest submission.",
        )
    direct_vm.sender = client
    with direct_vm.expect_revert("between 0 and 10000"):
        dock.propose_mutual_resolution(
            agreement_id,
            "mutual-invalid-001",
            10_001,
            "This invalid percentage must be rejected without moving or locking any funds.",
        )


def test_wrong_state_and_double_settlement_are_rejected(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-state-001"
    dock, client, worker, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    direct_vm.sender = client
    with direct_vm.expect_revert("not in client review"):
        dock.approve_milestone(agreement_id)
    with direct_vm.expect_revert("not ready"):
        dock.request_judgment(agreement_id)

    accept_and_fund(direct_vm, dock, client, worker, agreement_id)
    submit(direct_vm, dock, worker, agreement_id)
    direct_vm.sender = client
    dock.approve_milestone(agreement_id)
    assert agreement_record(dock, agreement_id)["status"] == "SETTLED"
    with direct_vm.expect_revert("already closed"):
        dock.settle_timeout(agreement_id)
    with direct_vm.expect_revert("does not have a settleable judgment"):
        dock.settle_judgment(agreement_id)


def test_hash_mismatch_fails_closed_without_authoritative_payout(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-mismatch-001"
    dock, client, _, _ = ready_for_judgment(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    direct_vm.mock_web(re.escape(TERMS_URL), {"status": 200, "body": b"changed terms"})
    direct_vm.sender = client
    dock.request_judgment(agreement_id)
    verdict = latest_verdict(dock, agreement_id)
    assert verdict["status"] == "INSUFFICIENT_EVIDENCE"
    assert verdict["evidence_status"] == "HASH_MISMATCH"
    assert verdict["worker_payout_bps"] == 0
    assert agreement_record(dock, agreement_id)["status"] == "EVIDENCE_REVIEW"


def test_validator_disagreement_rejects_leader_result(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-validator-001"
    dock, client, _, _ = ready_for_judgment(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    mock_evidence(direct_vm)
    mock_scores(direct_vm, [100, 100, 0, 100])
    direct_vm.sender = client
    dock.request_judgment(agreement_id)
    assert latest_verdict(dock, agreement_id)["overall_score"] == 80

    direct_vm.clear_mocks()
    mock_evidence(direct_vm)
    mock_scores(direct_vm, [0, 0, 0, 0], "Validator evidence interpretation materially disagrees.")
    assert direct_vm.run_validator() is False


def test_appeal_identifier_and_evidence_fingerprint_cannot_be_replayed(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-appeal-replay-001"
    dock, client, worker, _ = ready_for_judgment(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    mock_evidence(direct_vm)
    mock_scores(direct_vm, [100, 100, 0, 100])
    direct_vm.sender = client
    dock.request_judgment(agreement_id)
    direct_vm.sender = worker
    dock.appeal_judgment(
        agreement_id,
        "appeal-replay-001",
        "A first appeal with genuinely new evidence is valid and consumes the bounded appeal.",
        "TEST_REPORT|" + APPEAL_URL + "|" + digest(APPEAL_EVIDENCE),
    )
    record = json.loads(dock.get_latest_appeal(agreement_id))
    assert record["appeal_id"] == "appeal-replay-001"
    with direct_vm.expect_revert("Only a verified judgment can be appealed"):
        dock.appeal_judgment(
            agreement_id,
            "appeal-replay-001",
            "The same appeal identifier and digest cannot be submitted a second time.",
            "TEST_REPORT|" + APPEAL_URL + "|" + digest(APPEAL_EVIDENCE),
        )
