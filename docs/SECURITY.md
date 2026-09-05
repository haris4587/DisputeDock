# Security and Threat Model

## Scope

This document reviews the prototype contract and frontend. Studionet test GEN has no represented cash value. The project has not undergone a professional external audit and must not custody production assets.

## Protected assets

- native test-GEN escrow;
- exact agreement terms and participant identities;
- evidence commitments and authorship;
- lifecycle deadlines;
- verdict revision history;
- deterministic payout and refund accounting;
- wallet consent and transaction status in the UI.

## Trust assumptions

- GenLayer consensus, execution semantics, and native-value messaging work as specified;
- MetaMask correctly exposes the selected account and signs only user-approved requests;
- SHA-256 collision resistance holds;
- the configured Studionet RPC and chain definition are authentic;
- validator access to public evidence is sufficiently consistent for consensus;
- users publish non-secret evidence because every submitted URL and digest is public.

No evidence host, browser display, LLM statement, client, or worker is trusted by itself.

## Threat matrix

| Threat | Control | Residual risk |
|---|---|---|
| Client changes scope after worker accepts | Contract-computed agreement hash; exact worker acceptance | Off-chain conversations outside committed terms carry no authority |
| Client funds a different amount | Funding requires exact committed message value | Native token price/value is not stabilized |
| Unauthorized lifecycle call | Sender checks on every privileged method | Compromised party wallet retains that role |
| Duplicate agreement/appeal/proposal ID | Map existence check | IDs are public and may be front-run; creator should use unpredictable suffixes |
| Duplicate/replayed evidence | Duplicate manifest check, role/round fingerprint, new-digest appeal rule | Same bytes may legitimately appear under distinct evidence roles |
| Mutable evidence URL | Validator hashes fetched bytes against stored SHA-256 | Host may remove data and force insufficient evidence |
| SSRF/private network access | HTTPS-only, public path required, private/loopback prefixes blocked | String filtering is defense in depth; platform egress policy remains important |
| Huge response denial of service | 1 MB hard cap and 12 KB per-item text cap | Remote servers can still respond slowly |
| JavaScript or Cloudflare challenge | Plain byte fetch only; documentation rejects these sources | Poor source choice can yield insufficient evidence |
| Prompt injection in evidence | Evidence tagged as untrusted; locked prompt and output normalization | LLM systems are probabilistic; validator agreement thresholds mitigate, not eliminate |
| LLM chooses payout directly | Contract discards arbitrary payout and recomputes from locked scores/weights | Scores remain interpretive |
| Validator disagrees materially | Custom validator compares retrieval state, status, overall, payout, and each criterion | Thresholds permit bounded variance |
| Missing/malformed model output | Normalizer defaults unsupported scores to zero and validates structure | Conservative defaults may disadvantage worker when evidence is ambiguous |
| Funds stay locked | State deadlines plus hard final timeout | A party must still submit the timeout transaction |
| Client disappears after delivery | Review timeout pays worker 100% | Worker must invoke timeout |
| Worker disappears after dispute | Evidence timeout refunds client | Client must invoke timeout |
| Appeal spam | Exactly one contract-level appeal with genuinely new digest | GenLayer protocol-level transaction appeals are separate network behavior |
| Repeated settlement/reentrancy | Escrow zeroed and state closed before outgoing messages | Cross-contract native transfer semantics should be monitored as platform evolves |
| Frontend fabricates verdict | Reads finalized contract JSON; no local verdict calculation | A malicious fork can misdisplay state; users should verify source and chain |
| Fake deployment metadata | Empty values visibly remain unverified | Users must verify explorer and commit links |
| Wallet rejection hidden | Explicit rejected state; no optimistic success | Wallet/provider error messages vary |
| Wrong-chain signature | Chain check and switch/add flow before writes | Malicious injected providers are outside app control |

## State-transition defenses

Every write method has three layers where applicable:

1. caller role;
2. exact source lifecycle state;
3. open or elapsed deadline.

The contract never relies on frontend routing to determine permissible actions. A direct malicious call receives the same checks.

## Evidence authenticity

The contract stores commitments at submission time and recomputes hashes during adjudication. It never asserts that a URL, repository page, screenshot link, or timestamp proves content on its own. The verdict includes both expected and observed hashes for an auditable binding.

### Source guidance

Recommended:

- raw commit-pinned GitHub files;
- content-addressed IPFS gateways with stable public retrieval;
- simple HTTPS objects with immutable retention.

Rejected in practice:

- pages requiring authentication or cookies;
- expiring signed URLs;
- pages built only after JavaScript execution;
- Cloudflare/browser challenges;
- private-network hosts;
- mutable branch URLs when a commit-pinned path is possible.

## Consensus and model risk

Evidence interpretation is deliberately nondeterministic. The custom validator does not demand byte-identical prose. It validates stable semantic outputs within defined tolerances while requiring the same evidence status and delivery status. Criterion names and weights are immutable, and arithmetic is deterministic.

This design does not make subjective freelance disputes mathematically objective. It makes the inputs, validation policy, result structure, and fund split auditable.

## Frontend security

- no private keys or seed phrases are requested or stored;
- no secrets are committed;
- wallet writes use the injected provider;
- local disconnect clears app state without pretending MetaMask revoked access;
- contract writes are disabled until a syntactically valid deployed address is configured;
- proof metadata is blank until verified;
- finalized execution result is checked before success;
- evidence hashing uses the browser Web Crypto API;
- user-provided evidence is not rendered as HTML.

## Known prototype limits

- native test GEN only; no stablecoin integration;
- one milestone per agreement;
- public evidence only, with no encryption or selective disclosure;
- dynamic history arrays are appropriate for a demo but would need pagination/indexing at scale;
- URL filtering is conservative but not a substitute for network-level egress controls;
- validator thresholds are application policy and may require calibration;
- no external professional audit;
- no production deployment or financial warranty.

## Reporting

Open a GitHub issue without publishing private keys, seed phrases, authentication tokens, or sensitive evidence.
