from .test_lifecycle import (
    APPEAL_EVIDENCE,
    APPEAL_URL,
    BASE_TIME,
    CLIENT_ISSUE,
    CLIENT_URL,
    ESCROW,
    accept_and_fund,
    agreement_record,
    create_case,
    digest,
    dispute_and_respond,
    iso,
    mock_evidence,
    mock_scores,
    ready_for_judgment,
    submit,
)


def test_worker_never_accepts_client_can_close_after_deadline(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-timeout-accept"
    dock, client, _, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    direct_vm.warp(iso(BASE_TIME + 3601))
    direct_vm.sender = client
    dock.settle_timeout(agreement_id)
    agreement = agreement_record(dock, agreement_id)
    assert agreement["status"] == "CANCELLED"
    assert agreement["settlement_action"] == "UNACCEPTED_OR_UNFUNDED_TIMEOUT"


def test_client_never_funds_after_acceptance_can_close(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-timeout-funding"
    dock, client, worker, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    agreement = agreement_record(dock, agreement_id)
    direct_vm.sender = worker
    dock.accept_agreement(agreement_id, agreement["agreement_hash"])
    direct_vm.warp(iso(BASE_TIME + 3601))
    dock.settle_timeout(agreement_id)
    assert agreement_record(dock, agreement_id)["status"] == "CANCELLED"


def test_no_submission_refunds_client(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-timeout-submit"
    dock, client, worker, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    accept_and_fund(direct_vm, dock, client, worker, agreement_id)
    direct_vm.warp(iso(BASE_TIME + 86_401))
    direct_vm.sender = client
    dock.settle_timeout(agreement_id)
    agreement = agreement_record(dock, agreement_id)
    assert agreement["client_refunded_wei"] == str(ESCROW)
    assert agreement["worker_paid_wei"] == "0"
    assert agreement["settlement_action"] == "NO_SUBMISSION_REFUND_CLIENT"


def test_client_silence_releases_escrow_to_worker(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-timeout-review"
    dock, client, worker, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    accept_and_fund(direct_vm, dock, client, worker, agreement_id)
    submit(direct_vm, dock, worker, agreement_id)
    review_deadline = agreement_record(dock, agreement_id)["review_deadline_unix"]
    direct_vm.warp(iso(review_deadline + 1))
    direct_vm.sender = worker
    dock.settle_timeout(agreement_id)
    agreement = agreement_record(dock, agreement_id)
    assert agreement["worker_paid_wei"] == str(ESCROW)
    assert agreement["settlement_action"] == "CLIENT_SILENCE_RELEASE_WORKER"


def test_missing_worker_response_refunds_client(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-timeout-response"
    dock, client, worker, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    accept_and_fund(direct_vm, dock, client, worker, agreement_id)
    submit(direct_vm, dock, worker, agreement_id)
    direct_vm.sender = client
    dock.open_dispute(
        agreement_id,
        "ISSUE_LOG|" + CLIENT_URL + "|" + digest(CLIENT_ISSUE),
        "The authorized client records a dispute and the worker never answers it.",
    )
    deadline = agreement_record(dock, agreement_id)["evidence_deadline_unix"]
    direct_vm.warp(iso(deadline + 1))
    dock.settle_timeout(agreement_id)
    agreement = agreement_record(dock, agreement_id)
    assert agreement["client_refunded_wei"] == str(ESCROW)
    assert agreement["settlement_action"] == "NO_WORKER_RESPONSE_REFUND_CLIENT"


def test_unrequested_judgment_window_refunds_client(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-timeout-judgment"
    dock, client, worker, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    accept_and_fund(direct_vm, dock, client, worker, agreement_id)
    submit(direct_vm, dock, worker, agreement_id)
    dispute_and_respond(direct_vm, dock, client, worker, agreement_id)
    deadline = agreement_record(dock, agreement_id)["judgment_deadline_unix"]
    direct_vm.warp(iso(deadline + 1))
    direct_vm.sender = client
    dock.settle_timeout(agreement_id)
    assert agreement_record(dock, agreement_id)["settlement_action"] == "UNRESOLVED_EVIDENCE_REFUND_CLIENT"


def test_judged_case_settles_consensus_split_after_appeal_window(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-timeout-verdict"
    dock, client, _, _ = ready_for_judgment(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    mock_evidence(direct_vm)
    mock_scores(direct_vm, [100, 100, 0, 100])
    direct_vm.sender = client
    dock.request_judgment(agreement_id)
    deadline = agreement_record(dock, agreement_id)["appeal_deadline_unix"]
    direct_vm.warp(iso(deadline + 1))
    dock.settle_judgment(agreement_id)
    agreement = agreement_record(dock, agreement_id)
    assert agreement["worker_paid_wei"] == str(ESCROW * 8 // 10)
    assert agreement["client_refunded_wei"] == str(ESCROW * 2 // 10)
    assert agreement["settlement_action"] == "FINAL_CONSENSUS_SPLIT"


def test_unprosecuted_appeal_falls_back_to_prior_verified_verdict(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-timeout-appeal"
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
        "appeal-timeout-001",
        "New evidence is committed, but the appellant never requests the consensus recheck.",
        "TEST_REPORT|" + APPEAL_URL + "|" + digest(APPEAL_EVIDENCE),
    )
    deadline = agreement_record(dock, agreement_id)["judgment_deadline_unix"]
    direct_vm.warp(iso(deadline + 1))
    dock.settle_timeout(agreement_id)
    agreement = agreement_record(dock, agreement_id)
    assert agreement["worker_paid_wei"] == str(ESCROW * 8 // 10)
    assert agreement["settlement_action"] == "APPEAL_NOT_PROSECUTED_PRIOR_FINAL"


def test_mutual_resolution_requires_counterparty_and_settles_exact_split(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-mutual-001"
    dock, client, worker, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    accept_and_fund(direct_vm, dock, client, worker, agreement_id)
    direct_vm.sender = client
    dock.propose_mutual_resolution(
        agreement_id,
        "mutual-split-001",
        7500,
        "Both parties may voluntarily settle the active agreement at a seventy-five percent worker split.",
    )
    with direct_vm.expect_revert("other party"):
        dock.accept_mutual_resolution(agreement_id, "mutual-split-001")
    direct_vm.sender = worker
    dock.accept_mutual_resolution(agreement_id, "mutual-split-001")
    agreement = agreement_record(dock, agreement_id)
    assert agreement["worker_paid_wei"] == str(ESCROW * 75 // 100)
    assert agreement["client_refunded_wei"] == str(ESCROW * 25 // 100)
    assert agreement["settlement_action"] == "MUTUAL_RESOLUTION"


def test_expired_mutual_proposal_resumes_prior_state(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-mutual-expire"
    dock, client, worker, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    accept_and_fund(direct_vm, dock, client, worker, agreement_id)
    direct_vm.sender = client
    dock.propose_mutual_resolution(
        agreement_id,
        "mutual-expired-001",
        5000,
        "This proposal intentionally expires so the original agreement state can resume safely.",
    )
    direct_vm.warp(iso(BASE_TIME + 3601))
    direct_vm.sender = worker
    dock.expire_mutual_resolution(agreement_id)
    assert agreement_record(dock, agreement_id)["status"] == "ACTIVE"


def test_hard_final_timeout_always_unlocks_funds(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-hard-timeout"
    dock, client, worker, _ = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    accept_and_fund(direct_vm, dock, client, worker, agreement_id)
    hard_timeout = agreement_record(dock, agreement_id)["hard_timeout_unix"]
    direct_vm.warp(iso(hard_timeout + 1))
    direct_vm.sender = client
    dock.settle_final_timeout(agreement_id)
    agreement = agreement_record(dock, agreement_id)
    assert agreement["status"] == "SETTLED"
    assert agreement["escrow_remaining_wei"] == "0"
    assert agreement["settlement_action"] == "HARD_TIMEOUT_SAFE_REFUND_CLIENT"
