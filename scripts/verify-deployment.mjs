import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import deployment from "../src/deployment.json" with { type: "json" };

const source = await readFile(
  new URL("../contracts/dispute_dock.py", import.meta.url),
  "utf8",
);
const localSha256 = createHash("sha256").update(source).digest("hex");
const client = createClient({ chain: studionet });

const [deployedCode, schema, transaction] = await Promise.all([
  client.getContractCode(deployment.contractAddress),
  client.getContractSchema(deployment.contractAddress),
  client.getTransaction({ hash: deployment.deploymentTransaction }),
]);

const deployedSha256 = createHash("sha256").update(deployedCode).digest("hex");
const methods = Object.keys(schema?.methods || {});
const checks = {
  chainMatches: Number(deployment.chainId) === Number(studionet.id),
  exactSourceMatch: deployedCode === source,
  sourceHashMatches:
    localSha256 === deployment.contractSourceSha256 &&
    deployedSha256 === deployment.contractSourceSha256,
  addressMatches:
    String(transaction?.to_address || transaction?.recipient || "").toLowerCase() ===
    deployment.contractAddress.toLowerCase(),
  finalized: transaction?.statusName === "FINALIZED",
  majorityAgree: transaction?.result_name === "MAJORITY_AGREE",
  methodCountMatches: methods.length === 25,
};

const failed = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

const report = {
  network: studionet.name,
  chainId: studionet.id,
  contractAddress: deployment.contractAddress,
  deploymentTransaction: deployment.deploymentTransaction,
  status: transaction?.statusName,
  consensusResult: transaction?.result_name,
  deployedCodeSha256: deployedSha256,
  localCodeSha256: localSha256,
  methods: methods.length,
  validatorVotes: transaction?.last_round?.validator_votes_name || [],
  checks,
  result: failed.length ? "FAIL" : "PASS",
};

console.log(JSON.stringify(report, null, 2));

if (failed.length) {
  throw new Error("Deployment verification failed: " + failed.join(", "));
}
