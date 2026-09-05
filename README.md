# DisputeDock

**AI-native freelance agreements, native test-GEN escrow, and evidence-bound proportional dispute settlement on GenLayer.**

[![CI](https://github.com/haris4587/DisputeDock/actions/workflows/ci.yml/badge.svg)](https://github.com/haris4587/DisputeDock/actions/workflows/ci.yml)
[![GenLayer](https://img.shields.io/badge/GenLayer-Studionet-DC8A58)](https://docs.genlayer.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-66C895.svg)](LICENSE)
[![Live](https://img.shields.io/badge/Live-disputedock-66C895.svg)](https://disputedock.ansaf1st33.chatgpt.site)

DisputeDock turns a freelance scope into an explicit on-chain state machine. A client commits exact human-written terms, weighted requirements, parties, deadlines, and escrow value. The worker must accept the resulting agreement hash before funding. If a delivery is disputed, GenLayer validators independently retrieve the committed evidence bytes, verify every SHA-256 digest, interpret each requirement, and reach consensus on structured scores. The contract then derives the payout split deterministically.

> Experimental Studionet prototype. It uses native **test GEN**, which has no represented cash value. It is not a production escrow service, legal ruling, or claim of USDC support.

## Verified live deployment

| Field | Verified record |
|---|---|
| Application | https://disputedock.ansaf1st33.chatgpt.site |
| Contract | [0x89Fb9a916Cd9955b06EDb75CfFB855b3701bdF42](https://explorer-studio.genlayer.com/address/0x89Fb9a916Cd9955b06EDb75CfFB855b3701bdF42) |
| Deployment transaction | [0xb9b6eb7359b9e2f34ad5545fbd8853f66306ed428bda565eb429e9ae640dac2a](https://explorer-studio.genlayer.com/tx/0xb9b6eb7359b9e2f34ad5545fbd8853f66306ed428bda565eb429e9ae640dac2a) |
| Deployment status | FINALIZED · MAJORITY_AGREE · Normal/Full Consensus · Simulation off |
| Exact deployed source | Commit `5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd` |
| Source SHA-256 | `2c555de8b5dc34b0745f7cc9b70c118b6a19f25c0088e41a5e2c0bd5fa1d3a6b` |

`npm run test:deployment` independently retrieves the deployed code, schema, and transaction from Studionet and fails unless the source bytes, hash, address, 25-method schema, finalized status, and majority-agree result all match this repository.

## Why this is a GenLayer Builder Project

This repository contains the complete application rather than only an Intelligent Contract:

- production-style Python Intelligent Contract with native-value escrow;
- React application with genuine MetaMask and genlayer-js integration;
- explicit wallet, network, consensus, and failure states;
- browser-side SHA-256 evidence preflight tooling;
- 26 direct contract tests plus a live Studionet schema integration check;
- architecture, specification, threat model, testing, deployment, and demo guides;
- immutable demo evidence fixtures and an evidence ledger;
- reproducible CI and static-site deployment configuration.

## Core guarantees

| Guarantee | Enforcement |
|---|---|
| Exact agreement acceptance | Worker signs the contract-computed agreement hash before funding |
| Role authorization | Every privileged transition checks the message sender |
| Exact escrow | Payable funding must attach the committed native test-GEN value exactly |
| Weighted interpretation | Validators score locked criterion names; the contract preserves locked weights |
| Deterministic payout | Worker payout basis points equal weighted score multiplied by 100 |
| Evidence authenticity | Public bytes must match committed SHA-256 values or adjudication fails closed |
| Prompt-injection boundary | Retrieved material is explicitly untrusted evidence, never system instruction |
| Bounded recheck | One appeal only, and it must introduce at least one new evidence digest |
| Immutable decisions | Original and recheck verdicts use linked revision IDs and are never overwritten |
| Liveness | Acceptance, submission, review, evidence, judgment, appeal, and hard-final timeouts |
| No double settlement | Escrow is zeroed before payout messages; closed states reject further settlement |
| Honest interface | The frontend reads finalized contract state and never invents a verdict or hash |

## Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> AWAITING_ACCEPTANCE
    AWAITING_ACCEPTANCE --> AWAITING_FUNDING: worker accepts exact hash
    AWAITING_ACCEPTANCE --> CANCELLED: cancel or timeout
    AWAITING_FUNDING --> ACTIVE: exact test GEN funded
    AWAITING_FUNDING --> CANCELLED: cancel or timeout
    ACTIVE --> IN_REVIEW: worker submits
    ACTIVE --> SETTLED: no-submission timeout
    IN_REVIEW --> SETTLED: approve or client-silence timeout
    IN_REVIEW --> DISPUTED: client disputes
    DISPUTED --> EVIDENCE_READY: worker responds
    DISPUTED --> SETTLED: response timeout
    EVIDENCE_READY --> JUDGED: verified consensus verdict
    EVIDENCE_READY --> EVIDENCE_REVIEW: evidence unavailable or changed
    EVIDENCE_REVIEW --> JUDGED: successful retry
    EVIDENCE_REVIEW --> SETTLED: retry timeout
    JUDGED --> APPEAL_PENDING: one new-evidence appeal
    JUDGED --> SETTLED: appeal window closes
    APPEAL_PENDING --> JUDGED: consensus recheck
    APPEAL_PENDING --> SETTLED: recheck timeout uses prior verdict
~~~

MUTUAL_PENDING is a temporary overlay available from funded, review, dispute, evidence, judgment, and appeal states. Counterparty acceptance settles the proposed split. Expiry restores the exact prior state. A hard final timeout remains available as the last safety valve.

## Evidence trust boundary

Each evidence record contains:

- content type;
- canonical public HTTPS source URL;
- submitter role and on-chain timestamp;
- expected SHA-256;
- validator-observed SHA-256 and byte count in the verdict.

The URL is a retrieval location, not proof. Every leader and validator retrieves the resource inside the GenLayer nondeterministic consensus flow. The contract rejects private-network targets, query strings, fragments, empty bodies, responses over 1 MB, HTTP failures, and hash mismatches. A changed mutable URL therefore becomes unusable rather than silently changing the record.

Evidence should be plain, publicly retrievable, and stable. Commit-pinned raw GitHub files or content-addressed storage are preferred. Cloudflare challenges, authentication walls, and client-rendered JavaScript pages are deliberately unsuitable.

## Verdict schema

A stored verdict includes:

~~~json
{
  "verdict_id": "dock-web-001:v0",
  "revision": 0,
  "supersedes": "",
  "status": "PARTIALLY_DELIVERED",
  "criteria": [
    {
      "name": "Working wallet integration",
      "weight_bps": 2000,
      "score": 0,
      "finding": "Evidence-based finding"
    }
  ],
  "overall_score": 80,
  "worker_payout_bps": 8000,
  "client_refund_bps": 2000,
  "summary": "Concise neutral reasoning",
  "confidence": "HIGH",
  "risk_flags": ["Documented defect"],
  "citations": ["https://..."],
  "agreement_hash": "sha256",
  "evidence_status": "VERIFIED",
  "evidence_hashes": []
}
~~~

The example is a schema illustration, not a claimed live verdict. Genuine deployment and consensus records are documented only in [EVIDENCE.md](EVIDENCE.md).

## Repository map

~~~text
contracts/dispute_dock.py       Intelligent Contract
src/main.jsx                    React app and GenLayer/MetaMask client
src/styles.css                  Responsive visual system
tests/direct/                   Direct-mode lifecycle/security tests
scripts/verify-contract-schema.mjs
demo/evidence/                  Hashable demo evidence bytes
docs/                           Architecture, security, testing, deployment, demo
.github/workflows/ci.yml        Reproducible validation
.openai/hosting.json            Static site configuration
~~~

## Quick start

Prerequisites:

- Node.js 22 or newer;
- Python 3.12;
- MetaMask for signed Studionet writes.

~~~bash
git clone https://github.com/haris4587/DisputeDock.git
cd DisputeDock
npm ci
python3 -m pip install -r requirements-dev.txt
cp .env.example .env
npm test
npm run dev
~~~

To verify that the current Studionet RPC recognizes the contract schema:

~~~bash
npm run test:schema
npm run test:deployment
~~~

This check needs network access. It asks Studionet to compile and return the schema for the exact contract source; it does not deploy or spend test GEN.

## Environment

~~~dotenv
VITE_CONTRACT_ADDRESS=0x89Fb9a916Cd9955b06EDb75CfFB855b3701bdF42
VITE_NETWORK=studionet
VITE_GITHUB_URL=https://github.com/haris4587/DisputeDock
VITE_SOURCE_COMMIT=5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd
VITE_DEPLOYMENT_TX=0xb9b6eb7359b9e2f34ad5545fbd8853f66306ed428bda565eb429e9ae640dac2a
VITE_CONSENSUS_TX=
~~~

The tracked `src/deployment.json` provides the verified public defaults above. Environment variables may override them for a later deployment. Empty unverified fields, including the lifecycle consensus transaction until it exists, render as **Awaiting verified record**.

## MetaMask behavior

The frontend:

1. requests accounts using eth_requestAccounts;
2. displays the connected address;
3. detects the active chain;
4. requests a switch to Studionet chain 61999 (0xf22f);
5. adds the network through wallet_addEthereumChain when needed;
6. clears its local session on disconnect;
7. distinguishes rejection, wrong network, insufficient funds, execution failure, and retry;
8. shows wallet confirmation, submitted, proposing, accepted, and finalized stages;
9. checks the transaction execution result before treating a finalized transaction as successful.

MetaMask does not expose a general programmatic “disconnect site” RPC. The disconnect control clears DisputeDock’s local account state; users can revoke the site connection from MetaMask itself.

## Currency decision

The contract uses native Studionet test GEN through a payable method, `gl.message.value`, and finalized value-bearing payout messages. Current GenLayer documentation explicitly supports these primitives and Studio faucet funding, while warning that Studio is not a complete live chain-layer replica. No secure Studionet USDC escrow path is asserted or simulated. Stablecoin support is a future extension and must not be inferred from the 500-unit product example.

## Testing status

The current local verification matrix covers:

- creation, exact acceptance, exact funding, submission, approval;
- 80% partial delivery, 100% delivery, 0% delivery;
- unavailable and hash-mismatched evidence;
- validator agreement and disagreement;
- one new-evidence appeal and immutable revision linking;
- mutual settlement and mutual-proposal expiry;
- every timeout and hard-final timeout;
- unauthorized callers, wrong states, bad hashes, bad weights, bad percentages;
- duplicate IDs, duplicate manifest entries, replay attempts, and double settlement.

See [docs/TESTING.md](docs/TESTING.md) for the exact commands and evidence policy.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Contract specification](docs/CONTRACT_SPEC.md)
- [Security and threat model](docs/SECURITY.md)
- [Testing guide](docs/TESTING.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Demo walkthrough](docs/DEMO.md)
- [Deployment record](docs/DEPLOYMENT_RECORD.md)
- [Submission copy](docs/SUBMISSION.md)
- [Verification evidence](EVIDENCE.md)

## Status and non-fabrication policy

Repository tests, build results, schema checks, deployments, and transactions are recorded separately. A field is populated only after it can be reproduced or retrieved. There are no invented contract addresses, transaction hashes, validator verdicts, screenshots, or public links.

## License

[MIT](LICENSE)
