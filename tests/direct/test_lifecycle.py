import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import pytest


CONTRACT = Path(__file__).parents[2] / "contracts" / "dispute_dock.py"
BASE_TIME = 2_000_000_000
ESCROW = 5 * 10**18

TERMS_URL = "https://evidence.example/project/terms.md"
DELIVERABLE_URL = "https://evidence.example/project/deliverable.md"
WORKER_URL = "https://evidence.example/project/worker-report.md"
CLIENT_URL = "https://evidence.example/project/client-issue.md"
RESPONSE_URL = "https://evidence.example/project/worker-response.md"
APPEAL_URL = "https://evidence.example/project/appeal-evidence.md"

TERMS = b"""DisputeDock demo agreement
Requirements:
1. Responsive design.
2. Five complete pages.
3. Working wallet integration.
4. Delivery by the deadline.
"""
DELIVERABLE = b"""Delivery record
Responsive layout: complete.
Pages: Home, Agreement, Evidence, Dispute, History.
Wallet integration: connection control is present but the provider request currently fails.
Deadline: delivered before the agreed timestamp.
"""
WORKER_REPORT = b"""Worker test report
Responsive checks pass. Five routes render. Deadline is satisfied.
Wallet connection test fails because the provider call was not wired to the button.
"""
CLIENT_ISSUE = b"""Client reproduction
Clicking Connect Wallet does not call eth_requestAccounts. The other reviewed scope is present.
"""
WORKER_RESPONSE = b"""Worker response
The client report is accurate for wallet connection. Responsive design, five pages, and deadline are supported.
"""
APPEAL_EVIDENCE = b"""New appeal evidence
After the original judgment, a commit-pinned integration test now proves eth_requestAccounts is called successfully.
"""

CRITERIA = (
    "Responsive design|2000\n"
    "Five complete pages|2000\n"
    "Working wallet integration|2000\n"
    "Delivery by deadline|4000"
)


def iso(timestamp: int) -> str:
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def address(value) -> str:
    return "0x" + bytes(value).hex()


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def agreement_record(dock, agreement_id: str) -> dict:
    return json.loads(dock.get_agreement(agreement_id))


def latest_verdict(dock, agreement_id: str) -> dict:
    return json.loads(dock.get_latest_verdict(agreement_id))


def transfer_hook(_vm, request):
    if "PostMessage" in request or "CallContract" in request:
        return {"ok": None}
    return None


def create_case(direct_vm, direct_deploy, direct_accounts, agreement_id="dock-case-001"):
    client, worker, outsider = direct_accounts[:3]
    direct_vm.warp(iso(BASE_TIME))
    direct_vm.sender = client
    direct_vm._gl_call_hook = transfer_hook
    dock = direct_deploy(str(CONTRACT))
    dock.create_agreement(
        agreement_id,
        "Five-page wallet website",
        "Build a responsive five-page website with a working wallet connection and deliver it before the committed deadline.",
        address(worker),
        TERMS_URL,
        digest(TERMS),
        CRITERIA,
        ESCROW,
        BASE_TIME + 3600,
        BASE_TIME + 86_400,
        3600,
        3600,
        3600,
    )
    return dock, client, worker, outsider


def accept_and_fund(direct_vm, dock, client, worker, agreement_id):
    agreement = agreement_record(dock, agreement_id)
    direct_vm.sender = worker
    dock.accept_agreement(agreement_id, agreement["agreement_hash"])
    direct_vm.sender = client
    direct_vm.value = ESCROW
    dock.fund_agreement(agreement_id)
    direct_vm.value = 0


def submit(direct_vm, dock, worker, agreement_id):
    direct_vm.sender = worker
    dock.submit_milestone(
        agreement_id,
        DELIVERABLE_URL,
        digest(DELIVERABLE),
        "TEST_REPORT|" + WORKER_URL + "|" + digest(WORKER_REPORT),
        "The milestone and test report are committed for review under the exact agreement.",
    )


def dispute_and_respond(direct_vm, dock, client, worker, agreement_id):
    direct_vm.sender = client
    dock.open_dispute(
        agreement_id,
        "ISSUE_LOG|" + CLIENT_URL + "|" + digest(CLIENT_ISSUE),
        "The wallet connection does not invoke the provider even though the remaining scope appears delivered.",
    )
    direct_vm.sender = worker
    dock.respond_to_dispute(
        agreement_id,
        "COMMUNICATION|" + RESPONSE_URL + "|" + digest(WORKER_RESPONSE),
        "The wallet issue is acknowledged; the response evidence supports the other delivered criteria.",
    )


def mock_evidence(direct_vm, include_appeal=False):
    values = [
        (TERMS_URL, TERMS),
        (DELIVERABLE_URL, DELIVERABLE),
        (WORKER_URL, WORKER_REPORT),
        (CLIENT_URL, CLIENT_ISSUE),
        (RESPONSE_URL, WORKER_RESPONSE),
    ]
    if include_appeal:
        values.append((APPEAL_URL, APPEAL_EVIDENCE))
    for url, body in values:
        direct_vm.mock_web(re.escape(url), {"status": 200, "body": body})


def mock_scores(direct_vm, scores, summary="Evidence supports the weighted result."):
    result = {
        "criteria": [
            {"name": name, "score": score, "finding": "Finding for " + name + "."}
            for name, score in zip(
                [
                    "Responsive design",
                    "Five complete pages",
                    "Working wallet integration",
                    "Delivery by deadline",
                ],
                scores,
            )
        ],
        "confidence": "HIGH",
        "summary": summary,
        "risk_flags": [] if min(scores) == 100 else ["One criterion has a documented defect."],
        "citations": [DELIVERABLE_URL, WORKER_URL, CLIENT_URL, RESPONSE_URL],
    }
    direct_vm.mock_llm("neutral GenLayer freelance milestone adjudicator", json.dumps(result))


def ready_for_judgment(direct_vm, direct_deploy, direct_accounts, agreement_id):
    dock, client, worker, outsider = create_case(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    accept_and_fund(direct_vm, dock, client, worker, agreement_id)
    submit(direct_vm, dock, worker, agreement_id)
    dispute_and_respond(direct_vm, dock, client, worker, agreement_id)
    return dock, client, worker, outsider


def test_accept_fund_submit_and_client_approval(direct_vm, direct_deploy, direct_accounts):
    agreement_id = "dock-approve-001"
    dock, client, worker, _ = create_case(direct_vm, direct_deploy, direct_accounts, agreement_id)
    accept_and_fund(direct_vm, dock, client, worker, agreement_id)
    assert agreement_record(dock, agreement_id)["status"] == "ACTIVE"
    submit(direct_vm, dock, worker, agreement_id)
    assert agreement_record(dock, agreement_id)["status"] == "IN_REVIEW"
    direct_vm.sender = client
    dock.approve_milestone(agreement_id)
    agreement = agreement_record(dock, agreement_id)
    verdict = latest_verdict(dock, agreement_id)
    assert agreement["status"] == "SETTLED"
    assert agreement["worker_paid_wei"] == str(ESCROW)
    assert verdict["status"] == "DELIVERED"
    assert verdict["worker_payout_bps"] == 10_000


@pytest.mark.parametrize(
    ("scores", "expected_score", "expected_status"),
    [
        ([100, 100, 0, 100], 80, "PARTIALLY_DELIVERED"),
        ([100, 100, 100, 100], 100, "DELIVERED"),
        ([0, 0, 0, 0], 0, "NOT_DELIVERED"),
    ],
)
def test_consensus_verdict_shapes_and_deterministic_payout(
    direct_vm,
    direct_deploy,
    direct_accounts,
    scores,
    expected_score,
    expected_status,
):
    agreement_id = "dock-verdict-" + str(expected_score).zfill(3)
    dock, client, _, _ = ready_for_judgment(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    mock_evidence(direct_vm)
    mock_scores(direct_vm, scores)
    direct_vm.sender = client
    dock.request_judgment(agreement_id)
    verdict = latest_verdict(dock, agreement_id)
    assert verdict["overall_score"] == expected_score
    assert verdict["status"] == expected_status
    assert verdict["worker_payout_bps"] == expected_score * 100
    assert verdict["client_refund_bps"] == 10_000 - expected_score * 100
    assert verdict["agreement_hash"] == agreement_record(dock, agreement_id)["agreement_hash"]
    assert len(verdict["evidence_hashes"]) == 5
    assert direct_vm.run_validator() is True


def test_failed_evidence_retrieval_records_insufficient_and_allows_retry_revision(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-missing-001"
    dock, client, _, _ = ready_for_judgment(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    direct_vm.mock_web(re.escape(TERMS_URL), {"status": 503, "body": b""})
    direct_vm.sender = client
    dock.request_judgment(agreement_id)
    first = latest_verdict(dock, agreement_id)
    assert first["revision"] == 0
    assert first["status"] == "INSUFFICIENT_EVIDENCE"
    assert first["worker_payout_bps"] == 0
    assert agreement_record(dock, agreement_id)["status"] == "EVIDENCE_REVIEW"

    direct_vm.clear_mocks()
    mock_evidence(direct_vm)
    mock_scores(direct_vm, [100, 100, 0, 100])
    dock.request_judgment(agreement_id)
    second = latest_verdict(dock, agreement_id)
    assert second["revision"] == 1
    assert second["supersedes"] == agreement_id + ":v0"
    assert second["overall_score"] == 80
    assert agreement_record(dock, agreement_id)["status"] == "JUDGED"


def test_one_appeal_requires_new_evidence_and_preserves_original_verdict(
    direct_vm, direct_deploy, direct_accounts
):
    agreement_id = "dock-appeal-001"
    dock, client, worker, _ = ready_for_judgment(
        direct_vm, direct_deploy, direct_accounts, agreement_id
    )
    mock_evidence(direct_vm)
    mock_scores(direct_vm, [100, 100, 0, 100])
    direct_vm.sender = client
    dock.request_judgment(agreement_id)
    original = latest_verdict(dock, agreement_id)
    assert original["overall_score"] == 80

    with direct_vm.expect_revert("at least one new evidence digest"):
        dock.appeal_judgment(
            agreement_id,
            "appeal-old-001",
            "This attempted appeal improperly reuses evidence from the original record.",
            "ISSUE_LOG|" + CLIENT_URL + "|" + digest(CLIENT_ISSUE),
        )

    direct_vm.sender = worker
    dock.appeal_judgment(
        agreement_id,
        "appeal-new-001",
        "New integration evidence proves the previously failed wallet requirement now works.",
        "TEST_REPORT|" + APPEAL_URL + "|" + digest(APPEAL_EVIDENCE),
    )
    direct_vm.clear_mocks()
    mock_evidence(direct_vm, include_appeal=True)
    mock_scores(direct_vm, [100, 100, 100, 100], "New appeal evidence supports full delivery.")
    dock.request_judgment(agreement_id)
    recheck = latest_verdict(dock, agreement_id)
    immutable_original = json.loads(dock.get_verdict(agreement_id, 0))
    assert immutable_original["overall_score"] == 80
    assert recheck["revision"] == 1
    assert recheck["supersedes"] == agreement_id + ":v0"
    assert recheck["overall_score"] == 100
    assert agreement_record(dock, agreement_id)["appeal_count"] == 1

    with direct_vm.expect_revert("already used its single appeal"):
        dock.appeal_judgment(
            agreement_id,
            "appeal-second-001",
            "A prohibited second appeal should not be accepted by the contract state machine.",
            "OTHER|" + APPEAL_URL + "|" + digest(APPEAL_EVIDENCE),
        )
