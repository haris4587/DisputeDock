# Intelligent Contract Specification

Contract source: contracts/dispute_dock.py

## Roles

| Role | Source | Principal powers |
|---|---|---|
| Client | Creator message sender | Create, fund, approve, dispute, cancel before funding |
| Worker | Address committed at creation | Accept exact hash, submit, answer dispute |
| Either party | Sender equals client or worker | Request judgment, appeal once, negotiate, settle timeouts |
| Anyone | Public caller where harmless | Expire a stale mutual proposal |
| Validators | GenLayer consensus | Authenticate evidence and accept or reject interpreted scoring |

Role checks are always repeated in contract code. Frontend role labels have no authority.

## States

| State | Meaning |
|---|---|
| AWAITING_ACCEPTANCE | Created; exact hash not accepted |
| AWAITING_FUNDING | Worker accepted; no escrow yet |
| ACTIVE | Exact native test-GEN escrow locked |
| IN_REVIEW | Worker submission recorded; client review open |
| DISPUTED | Client dispute recorded; worker response open |
| EVIDENCE_READY | Both dispute sides recorded; judgment available |
| EVIDENCE_REVIEW | Retrieval/authentication failed; retry or timeout |
| JUDGED | Verified verdict recorded; appeal window open |
| APPEAL_PENDING | Single appeal committed; consensus recheck pending |
| MUTUAL_PENDING | Temporary mutual settlement proposal open |
| SETTLED | Escrow distributed exactly once |
| CANCELLED | Closed before funding |

## Write methods

### create_agreement

Client creates an unfunded agreement.

Inputs:

- unique agreement ID;
- title and human description;
- worker wallet;
- canonical terms URL and SHA-256;
- two through eight NAME|WEIGHT_BPS criteria totaling 10,000;
- positive expected escrow in wei;
- future acceptance and later submission deadlines;
- review, evidence, and appeal windows from 300 through 2,592,000 seconds.

Effects: stores the canonical record, computed agreement hash, hard-final timeout, and state AWAITING_ACCEPTANCE.

### accept_agreement

Worker-only. Requires state AWAITING_ACCEPTANCE, open deadline, and exact agreement hash. Moves to AWAITING_FUNDING.

### fund_agreement

Client-only payable method. Requires worker acceptance, open submission deadline, zero existing escrow, and message value exactly equal to expected escrow. Moves to ACTIVE.

### cancel_before_funding

Client-only. Closes AWAITING_ACCEPTANCE or AWAITING_FUNDING. It cannot touch a funded agreement.

### submit_milestone

Worker-only. Requires ACTIVE and open submission deadline. Records deliverable URL/digest, at least one evidence item, evidence fingerprint, statement, and timestamp. Moves to IN_REVIEW and starts the review clock.

### approve_milestone

Client-only during open review. Records an immutable client-approved full-delivery verdict and releases 100% to the worker.

### open_dispute

Client-only during open review. Requires at least one evidence item and a substantive statement. Moves to DISPUTED and starts evidence and judgment clocks.

### respond_to_dispute

Worker-only during the evidence window. Requires at least one evidence item and statement. Moves to EVIDENCE_READY.

### request_judgment

Either party in EVIDENCE_READY, EVIDENCE_REVIEW, or APPEAL_PENDING. Runs evidence retrieval and interpretation through full leader/validator consensus. Records a new verdict revision.

- Verified result: moves to JUDGED and starts appeal window.
- Failed retrieval or authentication: moves to EVIDENCE_REVIEW without making payout authoritative.
- Appeal result: links to the exact prior revision.

### appeal_judgment

Either party during the appeal window. Exactly one appeal is allowed. It must have a unique ID and introduce at least one digest absent from original dispute evidence. Moves to APPEAL_PENDING.

### propose_mutual_resolution

Either party in an escrow-bearing live state. Records 0 through 10,000 worker basis points, counterparty note, expiry, and resume state. Moves temporarily to MUTUAL_PENDING.

### accept_mutual_resolution

Counterparty-only. Requires the exact open proposal before expiry. Settles the proposed split.

### expire_mutual_resolution

After proposal expiry, restores the recorded resume state.

### settle_judgment

After the appeal window, distributes escrow using the latest verified consensus payout.

### settle_timeout

State-specific liveness:

| State | Trigger | Settlement |
|---|---|---|
| AWAITING_ACCEPTANCE / AWAITING_FUNDING | Acceptance deadline passed | Cancel, no funds |
| ACTIVE | Submission deadline passed | 100% client |
| IN_REVIEW | Review deadline passed | 100% worker |
| DISPUTED | Evidence deadline passed | 100% client |
| EVIDENCE_READY / EVIDENCE_REVIEW | Judgment deadline passed | 100% client |
| APPEAL_PENDING | Recheck deadline passed | Prior verified verdict split |
| JUDGED | Appeal deadline passed | Latest verified verdict split |

### settle_final_timeout

After the hard-final timestamp:

- latest verified/client-approved verdict exists: settle that payout;
- otherwise: safe refund to client.

This ensures no escrow can remain locked indefinitely.

## Read methods

| Method | Result |
|---|---|
| get_agreement | Current agreement JSON |
| get_submission | Submission JSON |
| get_dispute | Dispute/response JSON |
| get_verdict | Exact immutable revision JSON |
| get_latest_verdict | Latest verdict JSON |
| get_latest_appeal | Latest appeal JSON |
| get_latest_mutual_proposal | Latest proposal JSON |
| get_recent_agreement_ids | Agreement ID array |
| get_totals | Aggregate JSON accounting |

## Evidence manifest grammar

Each non-empty line:

~~~text
TYPE|HTTPS_URL|LOWERCASE_SHA256
~~~

Allowed types:

TERMS, DELIVERABLE, REQUIREMENTS, SCREENSHOT, TEST_REPORT, REPOSITORY, DEPLOYMENT, COMMUNICATION, ISSUE_LOG, VIDEO, DESIGN, OTHER.

## Verdict invariants

- status is delivered, partially delivered, not delivered, or insufficient evidence;
- score is 0 through 100;
- worker and client basis points sum to exactly 10,000;
- for verified evidence, worker basis points equal score multiplied by 100;
- criteria align to every locked criterion;
- evidence record list contains validator-observed hashes;
- agreement hash is copied into every revision;
- revision IDs cannot be reused;
- each nonzero revision links to its predecessor.

## Settlement invariants

- remaining escrow must be nonzero;
- basis points stay within 0 through 10,000;
- escrow is set to zero before outgoing messages;
- aggregate locked balance decreases exactly once;
- payout plus refund equals escrow;
- subsequent settlement calls fail in the closed state.

