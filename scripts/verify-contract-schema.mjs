import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const source = await readFile(
  new URL("../contracts/dispute_dock.py", import.meta.url),
  "utf8",
);
const client = createClient({ chain: studionet });
const schema = await client.getContractSchemaForCode(source);
const methods = schema?.methods || {};
const required = [
  "create_agreement",
  "accept_agreement",
  "fund_agreement",
  "submit_milestone",
  "approve_milestone",
  "open_dispute",
  "respond_to_dispute",
  "request_judgment",
  "appeal_judgment",
  "propose_mutual_resolution",
  "accept_mutual_resolution",
  "settle_judgment",
  "settle_timeout",
  "settle_final_timeout",
  "get_agreement",
  "get_latest_verdict",
];

const missing = required.filter((name) => !methods[name]);
if (missing.length) {
  throw new Error("Studionet schema omitted required methods: " + missing.join(", "));
}

const summary = {
  network: studionet.name,
  chainId: studionet.id,
  methods: Object.keys(methods).length,
  requiredMethods: required.length,
  result: "PASS",
};
console.log(JSON.stringify(summary, null, 2));
