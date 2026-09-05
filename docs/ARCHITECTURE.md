# Architecture

## System boundary

DisputeDock separates deterministic custody and state transitions from nondeterministic interpretation.

~~~mermaid
flowchart TD
    UI["React application"] --> Wallet["MetaMask provider"]
    UI --> Read["GenLayer read client"]
    Wallet --> Write["GenLayer signed write client"]
    Read --> IC["DisputeDock Intelligent Contract"]
    Write --> IC
    IC --> Store["Deterministic on-chain storage"]
    IC --> Consensus["Leader and validator execution"]
    Consensus --> Web["Public evidence bytes"]
    Consensus --> LLM["Requirement interpretation"]
    IC --> Payout["Native test-GEN messages"]
~~~

The React application is an interaction layer. MetaMask establishes the transaction sender. The Intelligent Contract alone controls authorization, deadlines, escrow accounting, evidence commitments, revision limits, and settlement arithmetic.

## Components

| Component | Responsibility | Trust level |
|---|---|---|
| React/Vite frontend | Forms, wallet UX, evidence preflight, finalized state rendering | Untrusted convenience client |
| MetaMask | Account permission, network consent, signing | User-controlled signer |
| genlayer-js read client | Finalized contract reads and receipt tracking | Transport; results verified by chain state |
| genlayer-js write client | Submits signed calls and attached native value | Transport plus wallet signature |
| Intelligent Contract | State machine, authorization, hashes, escrow, verdict storage, payout | Authoritative application logic |
| Leader execution | Fetches exact evidence bytes and produces structured interpretation | Proposed nondeterministic result |
| Validator execution | Independently fetches, interprets, and checks tolerances | Consensus guard |
| Evidence host | Serves committed bytes | Untrusted location; SHA-256 binds content |

## Deterministic versus nondeterministic work

Deterministic contract code performs:

- identifier, address, URL, text, weight, deadline, and percentage validation;
- agreement canonicalization and SHA-256 commitment;
- caller authorization and lifecycle state checks;
- escrow balance and aggregate accounting;
- evidence-manifest parsing and replay fingerprints;
- criterion-weight application;
- payout basis-point derivation;
- verdict revision linking and settlement.

The nondeterministic closure performs:

- public HTTPS retrieval;
- retrieved byte hashing;
- untrusted text extraction;
- LLM interpretation of human terms and evidence.

Storage mutation occurs only after the consensus call returns. The leader output cannot directly edit storage.

## Agreement commitment

The canonical agreement commitment hashes a sorted, delimiter-free JSON object containing:

- agreement ID;
- title and description;
- normalized client and worker addresses;
- terms URL and SHA-256;
- ordered criterion names and weights;
- expected escrow value;
- acceptance and submission deadlines;
- review, evidence, and appeal windows.

The contract computes this hash. The worker must pass the exact hash to acceptance. Funding is impossible until acceptance succeeds.

## Evidence flow

1. A party publishes plain evidence bytes at a public HTTPS path.
2. The party computes SHA-256 locally and submits type, URL, and digest.
3. The contract stores the manifest and its role/round-bound fingerprint.
4. During judgment, the leader fetches every committed resource.
5. A missing, empty, oversized, unavailable, or changed resource returns insufficient evidence.
6. When all bytes match, the LLM receives the locked criteria plus authenticated, explicitly untrusted evidence.
7. The leader normalizes output to the locked criterion set.
8. Validators repeat retrieval and interpretation.
9. The custom validator rejects incompatible status, evidence state, scores, payout, or criterion results.
10. Consensus-returned data is recorded as the next immutable verdict revision.

## Consensus validation

The validator requires:

- a structurally valid proposed result;
- the same evidence retrieval status;
- both results to fail closed when evidence is not verified;
- the same delivery-status class;
- no more than ten overall-score points of difference;
- no more than 1,000 payout basis points of difference;
- no more than twenty points of difference per locked criterion.

The final stored result still uses the leader proposal accepted by consensus. Payout arithmetic is recomputed from normalized weighted scores, so free-form model output cannot directly choose money values.

## Payout model

For criterion i with weight in basis points and score from 0 through 100:

~~~text
overall_score = floor(sum(score_i × weight_i) / 10,000)
worker_payout_bps = overall_score × 100
client_refund_bps = 10,000 - worker_payout_bps
~~~

At settlement:

~~~text
worker_amount = floor(escrow × worker_payout_bps / 10,000)
client_amount = escrow - worker_amount
~~~

The remainder belongs to the client side of the split, making total outflow exactly equal escrow.

## Data model

Large structured records are stored as sorted JSON strings in typed TreeMaps. This keeps the external API easy to inspect while the contract uses fixed typed storage containers.

| Map | Key | Value |
|---|---|---|
| agreements | agreement ID | Current lifecycle record |
| submissions | agreement ID | Immutable milestone submission |
| disputes | agreement ID | Client evidence plus worker response |
| verdicts | agreement ID plus revision | Immutable structured verdict |
| verdicts | agreement ID plus latest suffix | Latest-verdict pointer copy |
| appeals | appeal ID | Immutable appeal |
| appeals | agreement ID plus latest suffix | Latest-appeal pointer copy |
| mutual_proposals | proposal ID | Settlement proposal |
| escrows | agreement ID | Remaining native test GEN |
| evidence_fingerprints | fingerprint | Owning agreement ID |

Dynamic arrays index agreement, verdict, and appeal identifiers for history views. Aggregate counters expose protocol activity and accounting totals.

## Frontend read/write split

The application creates:

- a walletless read client for finalized state and receipt tracking;
- a wallet-backed write client only after account permission.

The interface requests the Studio chain explicitly and never substitutes a local success. Contract writes are disabled without a valid deployment address. A transaction is marked successful only when a finalized receipt does not report a failed execution.

## Deployment shape

The app is a static Vite bundle. Runtime proof values are injected at build time:

- contract address;
- source commit;
- deployment transaction;
- consensus transaction;
- GitHub URL.

Unverified values stay empty and render as awaiting a verified record.

