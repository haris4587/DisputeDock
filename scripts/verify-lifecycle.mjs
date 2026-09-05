import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionHashVariant } from "genlayer-js/types";
import deployment from "../src/deployment.json" with { type: "json" };

const snapshot = JSON.parse(
  await readFile(
    new URL("../demo/evidence/full-consensus-verdict.json", import.meta.url),
    "utf8",
  ),
);
const client = createClient({ chain: studionet });
const readJson = async (functionName, args = []) =>
  JSON.parse(
    await client.readContract({
      address: deployment.contractAddress,
      functionName,
      args,
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
      jsonSafeReturn: true,
    }),
  );

const [agreement, verdict, totals, judgmentTx, settlementTx] = await Promise.all([
  readJson("get_agreement", [deployment.demoAgreementId]),
  readJson("get_latest_verdict", [deployment.demoAgreementId]),
  readJson("get_totals"),
  client.getTransaction({ hash: deployment.consensusTransaction }),
  client.getTransaction({ hash: deployment.settlementTransaction }),
]);

const checks = {
  agreementSettled: agreement.status === "SETTLED",
  deterministicSettlement: agreement.settlement_action === "FINAL_CONSENSUS_SPLIT",
  payoutMatches: agreement.worker_paid_wei === "3600000000000000000",
  refundMatches: agreement.client_refunded_wei === "1400000000000000000",
  escrowReleased:
    agreement.escrow_remaining_wei === "0" && totals.locked_wei === "0",
  verdictMatchesSnapshot:
    verdict.verdict_id === snapshot.verdict_id &&
    verdict.agreement_hash === snapshot.agreement_hash &&
    verdict.overall_score === snapshot.overall_score &&
    verdict.worker_payout_bps === snapshot.worker_payout_bps &&
    verdict.client_refund_bps === snapshot.client_refund_bps &&
    verdict.evidence_status === "VERIFIED",
  judgmentFinalized:
    judgmentTx.statusName === "FINALIZED" &&
    judgmentTx.result_name === "MAJORITY_AGREE",
  settlementFinalized:
    settlementTx.statusName === "FINALIZED" &&
    settlementTx.result_name === "MAJORITY_AGREE",
};

const failed = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);

console.log(
  JSON.stringify(
    {
      network: studionet.name,
      agreementId: deployment.demoAgreementId,
      verdictId: verdict.verdict_id,
      status: verdict.status,
      overallScore: verdict.overall_score,
      workerPayoutBps: verdict.worker_payout_bps,
      clientRefundBps: verdict.client_refund_bps,
      evidenceStatus: verdict.evidence_status,
      settlementAction: agreement.settlement_action,
      workerPaidWei: agreement.worker_paid_wei,
      clientRefundedWei: agreement.client_refunded_wei,
      lockedWei: totals.locked_wei,
      checks,
      result: failed.length ? "FAIL" : "PASS",
    },
    null,
    2,
  ),
);

if (failed.length) {
  throw new Error("Lifecycle verification failed: " + failed.join(", "));
}
