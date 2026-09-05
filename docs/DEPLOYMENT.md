# Deployment Guide

## Deployment policy

Never populate a contract address, transaction hash, consensus result, or screenshot before it can be verified. The application treats empty deployment values as unverified and disables contract writes.

## 1. Verify locally

~~~bash
npm ci
python3 -m pip install -r requirements-dev.txt
npm test
npm run test:schema
npm run test:deployment
~~~

Expected local contract result: 26 passed.

Expected live schema result: Studionet, chain 61999, PASS.

## 2. Prepare evidence

Publish plain evidence files at public, validator-retrievable HTTPS paths. Prefer commit-pinned raw GitHub URLs.

For every file:

~~~bash
sha256sum path/to/file
~~~

The website Evidence Lab can also calculate a local SHA-256 and preflight a public URL. Browser preflight is convenience only; validators perform the authoritative fetch and comparison.

## 3. Deploy in GenLayer Studio

1. Open the official GenLayer Studio.
2. Create a new Intelligent Contract.
3. Copy the exact bytes from contracts/dispute_dock.py.
4. Confirm the dependency header remains the first metadata block.
5. Select Studionet.
6. Turn Simulation Mode off.
7. Use Normal/Full Consensus rather than leader-only execution.
8. Deploy with no constructor arguments.
9. Confirm the Studio account or external wallet action if prompted.
10. Wait for finalized execution and confirm it finished without error.
11. Copy the contract address and deployment transaction hash.
12. Record both in docs/DEPLOYMENT_RECORD.md and EVIDENCE.md.

The user must personally approve external-wallet, network, or login prompts. Studio's built-in development account may execute without an external-wallet prompt.

## 4. Configure the application

Create a local .env file:

~~~dotenv
VITE_CONTRACT_ADDRESS=0x89Fb9a916Cd9955b06EDb75CfFB855b3701bdF42
VITE_NETWORK=studionet
VITE_GITHUB_URL=https://github.com/haris4587/DisputeDock
VITE_SOURCE_COMMIT=5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd
VITE_DEPLOYMENT_TX=0xb9b6eb7359b9e2f34ad5545fbd8853f66306ed428bda565eb429e9ae640dac2a
VITE_CONSENSUS_TX=
~~~

Build:

~~~bash
npm run build
~~~

Confirm the proof strip shows the real network, address, source commit, deployment transaction, and finalized lifecycle consensus transaction.

## 5. Execute a real lifecycle

Two distinct wallet accounts are required because the contract forbids assigning the client as worker.

Recommended demonstration:

1. Client creates dock-demo-80 with the pinned agreement terms and weighted criteria.
2. Worker loads the finalized agreement and accepts its exact agreement hash.
3. Client funds the exact committed 5 test GEN.
4. Worker submits the deliverable and worker report manifests.
5. Client opens the wallet-integration dispute.
6. Worker submits the response evidence.
7. Either party requests GenLayer judgment with full consensus.
8. Wait for proposing, accepted, and finalized.
9. Read get_latest_verdict from finalized state.
10. Confirm every expected evidence hash matches.
11. Record the transaction and verdict without editing its contents.

Settlement should be invoked only after the appeal window or through the documented mutual path.

## 6. Record consensus evidence

Update:

- VITE_CONSENSUS_TX;
- docs/DEPLOYMENT_RECORD.md;
- EVIDENCE.md;
- docs/SUBMISSION.md.

Rebuild and run npm test again. Commit the metadata update so the site and repository cite the same source commit.

## 7. Public website

The static deployment source is dist as declared in .openai/hosting.json. Deploy only a fresh production build. Confirm:

- HTTPS site opens publicly;
- MetaMask connection requests real account access;
- Studio chain addition/switch works;
- connected address and wrong-network states are visible;
- read methods load finalized agreement, dispute, and verdict records;
- signed writes request MetaMask confirmation;
- rejected signatures remain failed, not successful;
- proof strip links match the evidence ledger;
- mobile layout remains usable.

## 8. Rollback

The Intelligent Contract is not presented as upgradeable. A source defect requires:

1. patch and test a new source revision;
2. deploy a new contract;
3. retain the old deployment record;
4. update the site to the new address;
5. explain migration status explicitly.

Never replace an old address in the evidence ledger as if it never existed.

## Network parameters

| Field | Value |
|---|---|
| Network | GenLayer Studio Network |
| Chain ID | 61999 |
| Hex chain ID | 0xf22f |
| Currency | Native test GEN |
| Decimals | 18 |
| RPC | https://studio.genlayer.com/api |

Use the chain information exported by the installed genlayer-js package as the application source of truth.
