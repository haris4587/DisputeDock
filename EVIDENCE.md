# Verification Evidence

This ledger distinguishes reproducible build evidence from wallet-protected deployment evidence. Blank or pending records are never treated as proof.

## Repository verification

| Evidence | Result | Reproduce |
|---|---|---|
| Contract Python compilation | PASS | python3 -m py_compile contracts/dispute_dock.py |
| Direct GenLayer test suite | PASS — 26 tests | python3 -m pytest -q tests/direct |
| Frontend lint | PASS | npm run lint |
| Production build | PASS | npm run build |
| Studionet schema compilation | PASS — 25 methods | npm run test:schema |
| Dependency lock | Present | npm ci |

## Studionet schema response

~~~json
{
  "network": "Genlayer Studio Network",
  "chainId": 61999,
  "methods": 25,
  "requiredMethods": 16,
  "result": "PASS"
}
~~~

## Source integrity

| Field | Verified value |
|---|---|
| Repository | https://github.com/haris4587/DisputeDock |
| Source commit | Pending first push |
| Contract SHA-256 | Pending final source freeze |
| Evidence commit | Pending first push |
| Build date | 2026-09-05 UTC |

## Website

| Field | Verified value |
|---|---|
| Hosting project ID | appgprj_6a9c451d730c8191a2348068de142d45 |
| Public URL | Pending site deployment |
| Deployed source commit | Pending site deployment |
| Application screenshot | Capture only after public deployment |

## Intelligent Contract deployment

| Field | Verified value |
|---|---|
| Network | GenLayer Studio Network |
| Chain ID | 61999 |
| Contract address | Pending wallet-approved Studio deployment |
| Deployment transaction | Pending wallet-approved Studio deployment |
| Finalized execution | Pending |
| Simulation Mode | Must be disabled for recorded transaction |

## Full-consensus lifecycle

| Field | Verified value |
|---|---|
| Agreement ID | dock-demo-80 |
| Create transaction | Pending |
| Worker acceptance transaction | Pending |
| Funding transaction | Pending |
| Submission transaction | Pending |
| Client dispute transaction | Pending |
| Worker response transaction | Pending |
| Judgment transaction | Pending |
| Finalized verdict JSON | Pending |
| Settlement transaction | Pending appeal window or mutual resolution |

## Non-fabrication statement

No pending field above represents a completed action. The repository does not contain invented wallet addresses, contract addresses, transaction hashes, validator results, or explorer screenshots. Sample JSON in documentation is labeled as a schema or test vector.

## Evidence-file commitments

The exact SHA-256 values and commit-pinned raw URLs will be inserted after the evidence files receive their first immutable Git commit. A later metadata commit may cite that earlier evidence commit without creating a recursive hash dependency.

