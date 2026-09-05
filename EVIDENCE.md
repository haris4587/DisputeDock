# Verification Evidence

This ledger records reproducible build evidence and the finalized Studionet deployment and lifecycle. Values below were retrieved from the deployed contract or transaction receipts; sample fixtures remain explicitly labeled.

## Repository verification

| Evidence | Result | Reproduce |
|---|---|---|
| Contract Python compilation | PASS | python3 -m py_compile contracts/dispute_dock.py |
| Direct GenLayer test suite | PASS — 26 tests | python3 -m pytest -q tests/direct |
| Frontend lint | PASS | npm run lint |
| Production build | PASS | npm run build |
| Studionet schema compilation | PASS — 25 methods | npm run test:schema |
| Deployed contract verification | PASS — exact source, finalized, majority agree | npm run test:deployment |
| Finalized lifecycle verification | PASS — verdict, split, settlement, zero locked balance | npm run test:lifecycle |
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
| Initial source/evidence commit | 5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd |
| Contract SHA-256 at evidence commit | 2c555de8b5dc34b0745f7cc9b70c118b6a19f25c0088e41a5e2c0bd5fa1d3a6b |
| Deployment metadata commit | 2500694b4ec3808f9ee495441b141d06730e6933 |
| Build date | 2026-09-05 UTC |

## Commit-pinned evidence commitments

| Type | Commit-pinned raw source | SHA-256 |
|---|---|---|
| Terms | https://raw.githubusercontent.com/haris4587/DisputeDock/5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd/demo/evidence/agreement-terms.md | f18bfdc273e59b15dfcc603acbce4df25e85529a4486c9dc42d43b5ae4a49e8a |
| Deliverable | https://raw.githubusercontent.com/haris4587/DisputeDock/5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd/demo/evidence/worker-deliverable.md | d9504d98ec3c1ff6d4cb34e6f4fcade05aaa0b89a333ca423dd32838f157cddb |
| Worker test report | https://raw.githubusercontent.com/haris4587/DisputeDock/5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd/demo/evidence/direct-test-report.md | 2328f5564c16d8783bf71fdc57dec9584c7939f6fff61dd6fccafadbfa7429fe |
| Client dispute | https://raw.githubusercontent.com/haris4587/DisputeDock/5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd/demo/evidence/client-dispute.md | 77cd41892ebede1d8fb96c8e085045bdbdcee0d82d9909edab3e98dc0c1218e7 |
| Worker response | https://raw.githubusercontent.com/haris4587/DisputeDock/5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd/demo/evidence/worker-response.md | 436f8d2c19cf82c9f13a2d1e4696dfbd892ffcd9f0752142e929a047888070eb |
| Appeal fixture | https://raw.githubusercontent.com/haris4587/DisputeDock/5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd/demo/evidence/appeal-new-evidence.md | 55d6e8f341f14b77014d953957375520ebb2f0de0e815c1d2e76a7d2e7cd4dc0 |

## Website

| Field | Verified value |
|---|---|
| Hosting project ID | appgprj_6a9c451d730c8191a2348068de142d45 |
| Public URL | https://disputedock.ansaf1st33.chatgpt.site |
| Initial deployed source commit | 29015fc913640dc1acba1aecb8b32a3d9fe5ad69 |
| Hosting project | appgprj_6a9c451d730c8191a2348068de142d45 |
| Application screenshot | Public desktop and responsive captures verified during deployment |

## Intelligent Contract deployment

| Field | Verified value |
|---|---|
| Network | GenLayer Studio Network |
| Chain ID | 61999 |
| Contract address | 0x89Fb9a916Cd9955b06EDb75CfFB855b3701bdF42 |
| Contract explorer | https://explorer-studio.genlayer.com/address/0x89Fb9a916Cd9955b06EDb75CfFB855b3701bdF42 |
| Deployment transaction | 0xb9b6eb7359b9e2f34ad5545fbd8853f66306ed428bda565eb429e9ae640dac2a |
| Transaction explorer | https://explorer-studio.genlayer.com/tx/0xb9b6eb7359b9e2f34ad5545fbd8853f66306ed428bda565eb429e9ae640dac2a |
| Finalized execution | FINALIZED; MAJORITY_AGREE; one round |
| Validator votes | AGREE, IDLE, AGREE, AGREE, IDLE; quorum reached |
| Simulation Mode | Disabled |
| Execution mode | Normal / Full Consensus |
| Deployed code SHA-256 | 2c555de8b5dc34b0745f7cc9b70c118b6a19f25c0088e41a5e2c0bd5fa1d3a6b |
| Exact source match | PASS against contracts/dispute_dock.py |

## Full-consensus lifecycle

| Field | Verified value |
|---|---|
| Agreement ID | `dock-demo-80-live` |
| Client | `0x29C7cD11CcB902f57B5B20F5A29C3E970A10A92e` |
| Worker | `0x028C4a8A498b48A2C7eD164E4149A4389AF9e367` |
| Agreement hash | `92c91c83e5b4cf9fdec308de79dfe1ac545c1591223e1c1523999b4dd10543a1` |
| Create transaction | `0x60db660f56457c2c53e749acf81b73e72cd8d2dcd67f6be61d2fb5c4a04e5056` |
| Worker acceptance transaction | `0xda327bcbc0836113eb180217c98c6a6da63cf48f2d5793677d3e1c67e40ac1d1` |
| Funding transaction | `0xa76ac1babcead04988938e9a99d0247d3c0704b91e6fd5a5155e8aedbe6cce0c` — 5 test GEN |
| Submission transaction | `0x383fc36748911f444f389bea8d77c3282e345a334048d5f02ffc65b9a8d500a0` |
| Client dispute transaction | `0x141aa786b2a0e0a3226eac17dae10075e87bb5d84c49101cb741192c2f934fe5` |
| Worker response transaction | `0x7f89ab778a2492c2613aba22308f3d5c98279fe3aa8ddbb7eb00f0cac95acb73` |
| Judgment transaction | `0x44edbca38d7ffa163cb584d9c9212d19aa040b119176c8155e49af516f8f1018` |
| Judgment finality | FINALIZED; MAJORITY_AGREE; validator votes AGREE, AGREE, IDLE, IDLE, AGREE |
| Verdict | `dock-demo-80-live:v0`; `PARTIALLY_DELIVERED`; revision 0 |
| Compliance / split | 72% overall; 7,200 bps worker; 2,800 bps client |
| Evidence / confidence | VERIFIED; 5 retrieved commitments; HIGH confidence |
| Verdict snapshot | `demo/evidence/full-consensus-verdict.json` |
| Settlement transaction | `0xb802ca5e61304f4f65b9c7f82c53a2ee36d6f51cd75391145e8cb5ef68d3b123`; FINALIZED; 5/5 AGREE |
| Final settlement | `SETTLED`; `FINAL_CONSENSUS_SPLIT`; 3.6 test GEN worker / 1.4 test GEN client; escrow remaining 0 |

The full lifecycle used two distinct Studio accounts, Normal/Full Consensus, Simulation Mode disabled, native test GEN, and commit-pinned evidence bytes. The judgment transaction is separate from the deployment transaction and is not a fabricated sample. After the bounded appeal window closed without an appeal, `settle_judgment` applied the recorded 72/28 split and released the entire escrow.

## Non-fabrication statement

The repository does not contain invented wallet addresses, contract addresses, transaction hashes, validator results, or explorer screenshots. Sample JSON in documentation is labeled as a schema or test vector; the lifecycle verdict snapshot is a genuine finalized on-chain read.

## Evidence-file policy

The evidence bytes live in the earlier immutable commit above. Later metadata commits cite that commit without changing it or creating a recursive hash dependency.
