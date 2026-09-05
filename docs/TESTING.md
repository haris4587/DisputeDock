# Testing Guide

## Test layers

DisputeDock uses three layers in order:

1. direct contract execution for fast lifecycle and security coverage;
2. Studionet RPC schema compilation for current API compatibility;
3. live deployment source/status verification;
4. a real full-consensus lifecycle transaction with simulation disabled.

The first two layers do not need a wallet. The third requires the project owner to approve wallet-protected transactions.

## Reproducible environment

~~~bash
npm ci
python3 -m pip install -r requirements-dev.txt
~~~

Pinned primary tooling:

| Tool | Version |
|---|---|
| genlayer-js | 1.1.8 |
| genlayer-test | 0.29.2 |
| React | 19.2.8 |
| Vite | 8.2.2 |
| Python | 3.12 |

The Intelligent Contract declares its exact py-genlayer dependency in the source header.

## Complete local verification

~~~bash
npm test
~~~

This performs:

~~~text
npm run lint
python3 -m py_compile contracts/dispute_dock.py
python3 -m pytest -q tests/direct
npm run build
~~~

Current recorded result:

~~~text
26 passed
frontend lint passed
production build passed
~~~

## Direct test inventory

### Lifecycle

- deployment and agreement creation;
- exact hash acceptance;
- exact native test-GEN funding;
- worker submission;
- client full approval;
- 80% partial compliance and 80/20 basis-point output;
- 100% compliance;
- 0% compliance;
- insufficient evidence;
- evidence retry with a linked new revision;
- one new-evidence appeal;
- original verdict immutability.

### Security and invalid input

- outsider acceptance, funding, submission, approval, dispute, response, and judgment attempts;
- incorrect agreement hash;
- wrong escrow amount;
- invalid weight sum;
- malformed SHA-256;
- client and worker set to the same wallet;
- duplicate agreement ID;
- duplicate manifest entry;
- worker payout over 10,000 basis points;
- wrong lifecycle action;
- repeated settlement;
- evidence hash mismatch;
- material validator disagreement;
- replayed appeal.

### Timeout and liveness

- worker acceptance timeout;
- accepted-but-unfunded timeout;
- worker submission timeout;
- silent-client review timeout;
- missing worker dispute-response timeout;
- missing judgment timeout;
- judged settlement after appeal window;
- abandoned appeal fallback to prior verified verdict;
- mutual settlement;
- expired mutual proposal state restoration;
- hard-final timeout.

## Studionet schema integration

~~~bash
npm run test:schema
~~~

The script sends the exact contract source to the current Studionet schema endpoint through genlayer-js. It fails if compilation fails or any required method is missing.

Recorded result:

~~~json
{
  "network": "Genlayer Studio Network",
  "chainId": 61999,
  "methods": 25,
  "requiredMethods": 16,
  "result": "PASS"
}
~~~

This is a genuine live RPC compatibility check. It is not a deployment.

## Live deployment verification

~~~bash
npm run test:deployment
~~~

This retrieves the deployed contract code, deployed schema, and deployment transaction from Studionet. It fails unless the code is byte-identical to `contracts/dispute_dock.py`, both source hashes match the recorded SHA-256, the transaction targets the recorded address, all 25 methods exist, and the transaction is `FINALIZED` with `MAJORITY_AGREE`.

Recorded result:

~~~text
contract  0x89Fb9a916Cd9955b06EDb75CfFB855b3701bdF42
tx        0xb9b6eb7359b9e2f34ad5545fbd8853f66306ed428bda565eb429e9ae640dac2a
status    FINALIZED
result    MAJORITY_AGREE
source    exact match
methods   25
verifier  PASS
~~~

## Validator-disagreement test

Direct mode captures the custom validator closure. The leader first returns an authenticated 80% result. The validator is then given the same authenticated bytes but a materially different zero-percent model result. The validator returns false because status, overall payout, and criterion tolerances are violated.

## Failed-retrieval tests

Two independent paths are covered:

- HTTP 503 on the terms resource;
- HTTP 200 with bytes that do not match the committed SHA-256.

Both record INSUFFICIENT_EVIDENCE semantics, zero authoritative worker payout, and EVIDENCE_REVIEW status. The first path then retries with restored bytes and records a linked 80% revision.

## Full-consensus integration

After deployment:

1. disable Simulation Mode in GenLayer Studio;
2. use Normal/Full Consensus, never leader-only;
3. create the demo agreement;
4. accept with the worker wallet;
5. fund with native test GEN;
6. submit commit-pinned evidence;
7. open and answer the dispute;
8. call request_judgment;
9. wait for accepted and finalized states;
10. retrieve get_latest_verdict;
11. record transaction hash, contract address, verdict, source commit, and evidence hashes in EVIDENCE.md.

The deployment is already finalized and independently verified. Until the distinct-participant lifecycle flow is complete, its verdict fields must say not recorded rather than using sample values.

## CI

GitHub Actions installs pinned Node and Python dependencies, compiles the contract, executes direct tests, lints the frontend, and creates the production bundle. The live schema check remains manual so a transient public RPC outage cannot make deterministic repository CI flaky.

## Adding a regression

Every contract bug fix should add a direct test that:

- creates the smallest relevant state;
- asserts the unsafe call reverts or the safe transition succeeds;
- reads stored JSON and exact escrow accounting;
- avoids relying on frontend validation;
- uses fixed, byte-level web mocks for adjudication.
