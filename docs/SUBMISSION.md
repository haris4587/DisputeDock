# Builder Project Submission

## Title

DisputeDock — AI-Native Freelance Escrow and Proportional Dispute Resolution

## Primary tag

AI Arbitration

## One-line description

DisputeDock locks freelance terms and native test-GEN escrow, authenticates public evidence by SHA-256, and uses GenLayer full consensus to score requirements and deterministically split settlement.

## Full description

DisputeDock is a complete GenLayer Builder Project for wallet-to-wallet freelance agreements, milestone escrow, and evidence-bound dispute resolution. A client commits exact human terms, weighted criteria, deadlines, participant wallets, evidence source, and escrow value. The worker must accept the contract-computed agreement hash before the client can fund.

After delivery, the client may approve or dispute. Both sides record public evidence URLs and SHA-256 commitments. GenLayer leaders and validators independently retrieve those exact bytes, treat them as untrusted evidence, interpret every locked requirement, and reach consensus on structured scores, reasoning, citations, confidence, and risk flags. The Intelligent Contract recomputes the weighted percentage and proportional payout deterministically.

The state machine includes silent-client worker protection, missing-submission and missing-response refunds, an evidence retry state, one new-evidence appeal with immutable revision history, mutual settlement, and a hard final timeout so native test GEN cannot remain locked indefinitely.

The responsive application includes genuine MetaMask account permission, Studio chain addition/switching, signed contract writes, finalized-state reads, rejection and retry handling, evidence hashing tools, history, and visible deployment proof. The repository includes 26 direct tests, live Studionet schema compilation, CI, architecture, security, testing, deployment, demo, and evidence documentation.

## What I changed / built

- Built the complete DisputeDock product and visual system from an empty repository.
- Implemented an explicit authorized escrow and dispute state machine.
- Added exact agreement-hash acceptance before funding.
- Added native test-GEN custody, proportional payout, mutual settlement, and every liveness timeout.
- Built hash-bound evidence retrieval inside GenLayer leader/validator consensus.
- Added weighted requirement interpretation, strict output normalization, validator tolerances, and immutable verdict revisions.
- Added one bounded appeal that requires genuinely new evidence.
- Built a real MetaMask/genlayer-js frontend with chain switching and transaction lifecycle states.
- Added local SHA-256 and URL verification tools without pretending browser checks are authoritative.
- Added 26 contract tests, Studionet schema integration, reproducible build, CI, full documentation, and submission evidence policy.

## Links

| Field | Link |
|---|---|
| Repository | https://github.com/haris4587/DisputeDock |
| Public website | https://disputedock.ansaf1st33.chatgpt.site |
| Intelligent Contract | https://explorer-studio.genlayer.com/address/0x89Fb9a916Cd9955b06EDb75CfFB855b3701bdF42 |
| Deployment transaction | https://explorer-studio.genlayer.com/tx/0xb9b6eb7359b9e2f34ad5545fbd8853f66306ed428bda565eb429e9ae640dac2a |
| Full-consensus transaction | https://explorer-studio.genlayer.com/tx/0x44edbca38d7ffa163cb584d9c9212d19aa040b119176c8155e49af516f8f1018 |
| Settlement transaction | https://explorer-studio.genlayer.com/tx/0xb802ca5e61304f4f65b9c7f82c53a2ee36d6f51cd75391145e8cb5ef68d3b123 |
| Evidence ledger | https://github.com/haris4587/DisputeDock/blob/main/EVIDENCE.md |

## Technical proof

| Item | Current verified record |
|---|---|
| Contract source | contracts/dispute_dock.py |
| Public contract methods | 25 recognized by Studionet schema compilation |
| Direct tests | 26 passed |
| Production frontend | Vite build passed |
| Wallet integration | MetaMask provider plus genlayer-js signed writer |
| Network | GenLayer Studionet, chain 61999 |
| Currency | Native test GEN only |
| Live deployment | FINALIZED; MAJORITY_AGREE; exact source match |
| Live adjudication | `dock-demo-80-live:v0`; 72% worker / 28% client; VERIFIED evidence; FINALIZED; MAJORITY_AGREE |
| Final settlement | 3.6 / 1.4 test GEN; `FINAL_CONSENSUS_SPLIT`; escrow balance 0 |

## Disclaimer

Experimental Studionet prototype. Test GEN has no represented cash value. This is not production escrow, legal adjudication, or a claim of USDC support.
