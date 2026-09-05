# Demo Walkthrough

## Goal

Demonstrate that DisputeDock produces a proportional settlement from human-written requirements and authenticated evidence rather than manually supplied true/false fields.

Target test case:

- native escrow: 5 test GEN;
- responsive design: delivered;
- five application areas: delivered;
- MetaMask integration in the evidence fixture: not delivered;
- deadline: delivered;
- locked wallet weight: 20%;
- expected test-vector compliance: 80%.

The expected 80% is a test-vector target. The real verdict must be whatever full GenLayer consensus returns and must be recorded unchanged.

## Before recording

- use two distinct Studio wallets;
- obtain sufficient test GEN;
- verify every evidence URL is public and hash-matched;
- disable Studio Simulation Mode;
- use Normal/Full Consensus;
- open the repository, public website, and explorer in separate tabs;
- never pre-populate a transaction hash.

## Act 1 — Agreement integrity

1. Connect the client MetaMask wallet.
2. Show chain 61999 and the connected address.
3. Open New agreement.
4. Enter the dock-demo-80 terms and four weighted criteria.
5. Point terms to the commit-pinned agreement-terms.md bytes.
6. Submit Create agreement and show wallet confirmation, submitted, accepted, and finalized.
7. Load the case and copy the contract-computed agreement hash.
8. Switch to the worker wallet.
9. Select Accept exact hash.

Explain: the client cannot fund a quietly changed scope because the worker accepts the contract-computed commitment.

## Act 2 — Escrow and delivery

1. Switch to the client.
2. Fund exactly 5 native test GEN.
3. Show ACTIVE finalized state.
4. Switch to the worker.
5. Submit worker-deliverable.md and direct-test-report.md as hash-bound evidence.
6. Show IN_REVIEW.

Explain: test GEN is a network demonstration asset, not USDC and not real payment.

## Act 3 — Dispute evidence

1. Switch to the client.
2. Open a dispute using client-dispute.md.
3. Show DISPUTED and the evidence deadline.
4. Switch to the worker.
5. Respond using worker-response.md.
6. Show EVIDENCE_READY.

Explain: URLs are retrieval locations. SHA-256 binds the bytes validators are allowed to judge.

## Act 4 — Full consensus

1. Confirm Simulation Mode is disabled.
2. Select Request full-consensus adjudication.
3. Approve MetaMask.
4. Show submitted, proposing, accepted, and finalized states.
5. Load the latest finalized verdict.
6. Show each locked criterion score, weighted overall score, confidence, citations, risk flags, agreement hash, and evidence hashes.
7. Show the immutable verdict ID.

Do not call a displayed 80% result genuine until the finalized contract read and explorer transaction are available.

## Act 5 — Settlement and liveness

Explain:

- after the appeal window, the contract splits escrow from the consensus basis points;
- either party may use one appeal with genuinely new evidence;
- the original verdict stays at revision zero;
- abandoned reviews, submissions, evidence responses, judgments, and appeals each have a deterministic timeout;
- the hard-final timeout prevents indefinite lock.

For a short presentation, do not wait through long windows. Show the tested timeout matrix in docs/TESTING.md and use a separately configured demo window only when contract minimums and event timing allow it.

## Evidence to capture

- repository commit;
- public website;
- contract address;
- deployment transaction;
- create transaction;
- accept transaction;
- funding transaction;
- submission transaction;
- dispute transaction;
- response transaction;
- full-consensus judgment transaction;
- finalized verdict JSON;
- screenshot of case desk and proof strip.

Store genuine captures under demo/screenshots and link them from EVIDENCE.md. Do not create mock explorer screenshots.

