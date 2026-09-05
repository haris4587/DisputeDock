# Deployment Record

This file is the canonical deployment log. Values stay explicitly unrecorded until retrieved from the relevant system.

## Source

| Field | Record |
|---|---|
| Repository | https://github.com/haris4587/DisputeDock |
| Default branch | main |
| Initial source/evidence commit | 5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd |
| Contract source SHA-256 at that commit | 2c555de8b5dc34b0745f7cc9b70c118b6a19f25c0088e41a5e2c0bd5fa1d3a6b |
| Deployment metadata commit | 2500694b4ec3808f9ee495441b141d06730e6933 |
| Evidence commit | 5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd |

## Website

| Field | Record |
|---|---|
| Hosting project ID | appgprj_6a9c451d730c8191a2348068de142d45 |
| Public URL | https://disputedock.ansaf1st33.chatgpt.site |
| Site project | appgprj_6a9c451d730c8191a2348068de142d45 |
| Initial site version | appgprj_6a9c451d730c8191a2348068de142d45~appgver_3d16cb699ec08191b3e994bbf260c2f1 |
| Initial site source commit | 29015fc913640dc1acba1aecb8b32a3d9fe5ad69 |
| Deployment time | 2026-09-05 UTC |

## Intelligent Contract

| Field | Record |
|---|---|
| Network | GenLayer Studio Network |
| Chain ID | 61999 |
| Currency | Native test GEN |
| Contract address | 0x89Fb9a916Cd9955b06EDb75CfFB855b3701bdF42 |
| Deployment transaction | 0xb9b6eb7359b9e2f34ad5545fbd8853f66306ed428bda565eb429e9ae640dac2a |
| Contract explorer | https://explorer-studio.genlayer.com/address/0x89Fb9a916Cd9955b06EDb75CfFB855b3701bdF42 |
| Transaction explorer | https://explorer-studio.genlayer.com/tx/0xb9b6eb7359b9e2f34ad5545fbd8853f66306ed428bda565eb429e9ae640dac2a |
| Finalized result | FINALIZED; MAJORITY_AGREE |
| Validator round | 3 AGREE; 2 IDLE after quorum; 1 round |
| Simulation Mode | Disabled |
| Consensus mode | Normal/Full Consensus |
| Exact deployed-source match | PASS |

## Full-consensus demonstration

| Field | Record |
|---|---|
| Agreement ID | `dock-demo-80-live` |
| Client / worker | `0x29C7...A92e` / `0x028C...e367` (distinct Studio accounts) |
| Agreement hash | `92c91c83e5b4cf9fdec308de79dfe1ac545c1591223e1c1523999b4dd10543a1` |
| Create transaction | `0x60db660f56457c2c53e749acf81b73e72cd8d2dcd67f6be61d2fb5c4a04e5056` |
| Acceptance transaction | `0xda327bcbc0836113eb180217c98c6a6da63cf48f2d5793677d3e1c67e40ac1d1` |
| Funding transaction | `0xa76ac1babcead04988938e9a99d0247d3c0704b91e6fd5a5155e8aedbe6cce0c` |
| Submission transaction | `0x383fc36748911f444f389bea8d77c3282e345a334048d5f02ffc65b9a8d500a0` |
| Dispute transaction | `0x141aa786b2a0e0a3226eac17dae10075e87bb5d84c49101cb741192c2f934fe5` |
| Response transaction | `0x7f89ab778a2492c2613aba22308f3d5c98279fe3aa8ddbb7eb00f0cac95acb73` |
| Judgment transaction | `0x44edbca38d7ffa163cb584d9c9212d19aa040b119176c8155e49af516f8f1018` |
| Finalized status | FINALIZED; MAJORITY_AGREE; Normal/Full Consensus |
| Verdict revision | `dock-demo-80-live:v0`; revision 0 |
| Overall score | 72; `PARTIALLY_DELIVERED` |
| Worker payout basis points | 7200 |
| Client refund basis points | 2800 |
| Evidence status | VERIFIED; five commitments; HIGH confidence |
| Settlement transaction | `0xb802ca5e61304f4f65b9c7f82c53a2ee36d6f51cd75391145e8cb5ef68d3b123`; FINALIZED; 5/5 AGREE |
| Final settlement | `FINAL_CONSENSUS_SPLIT`; 3.6 test GEN paid to worker; 1.4 test GEN refunded to client; 0 locked |

## Local and RPC verification

| Check | Result |
|---|---|
| Python source compilation | Pass |
| genlayer-test direct suite | 26 passed |
| Frontend lint | Pass |
| Vite production build | Pass |
| Studionet schema compilation | Pass; 25 methods returned |
| Live deployed-code verification | Pass; exact source SHA-256, finalized, majority agree |

The deployment, adjudication, bounded appeal-window wait, and deterministic final settlement are complete.
