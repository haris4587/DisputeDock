import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import {
  ExecutionResult,
  TransactionHashVariant,
  TransactionStatus,
} from "genlayer-js/types";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Code2,
  Copy,
  Database,
  FileCheck2,
  FileKey2,
  Gavel,
  Hash,
  Landmark,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Menu,
  Network,
  RefreshCw,
  Scale,
  ShieldCheck,
  Unplug,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import deployment from "./deployment.json";
import "./styles.css";

const CONTRACT_ADDRESS = (
  import.meta.env.VITE_CONTRACT_ADDRESS || deployment.contractAddress || ""
).trim();
const GITHUB_URL =
  (import.meta.env.VITE_GITHUB_URL || "").trim() ||
  "https://github.com/haris4587/DisputeDock";
const SOURCE_COMMIT = (
  import.meta.env.VITE_SOURCE_COMMIT || deployment.contractSourceCommit || ""
).trim();
const SOURCE_HASH = deployment.contractSourceSha256;
const DEPLOYMENT_TX = (
  import.meta.env.VITE_DEPLOYMENT_TX || deployment.deploymentTransaction || ""
).trim();
const CONSENSUS_TX = (
  import.meta.env.VITE_CONSENSUS_TX || deployment.consensusTransaction || ""
).trim();
const CHAIN_HEX = "0x" + Number(studionet.id).toString(16);
const EXPLORER_URL = deployment.explorerUrl;
const EVIDENCE_COMMIT = "5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd";
const EVIDENCE_BASE =
  "https://raw.githubusercontent.com/haris4587/DisputeDock/" +
  EVIDENCE_COMMIT +
  "/demo/evidence/";
const CONTRACT_READY = /^0x[0-9a-fA-F]{40}$/.test(CONTRACT_ADDRESS);
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const readClient = createClient({ chain: studionet });

const statusOrder = [
  "AWAITING_ACCEPTANCE",
  "AWAITING_FUNDING",
  "ACTIVE",
  "IN_REVIEW",
  "DISPUTED",
  "EVIDENCE_READY",
  "JUDGED",
  "SETTLED",
];

const tabs = [
  ["desk", "Case desk"],
  ["create", "New agreement"],
  ["actions", "Lifecycle actions"],
  ["evidence", "Evidence lab"],
  ["protocol", "Protocol"],
];

function short(value, left = 7, right = 5) {
  if (!value) return "Not recorded";
  if (value.length <= left + right + 3) return value;
  return value.slice(0, left) + "…" + value.slice(-right);
}

function displayStatus(value) {
  return String(value || "NOT LOADED").replaceAll("_", " ");
}

function formatDate(value) {
  if (!value || Number(value) <= 0) return "—";
  return new Date(Number(value) * 1000).toLocaleString();
}

function localDate(hoursFromNow) {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function unixTime(value) {
  const result = Math.floor(new Date(value).getTime() / 1000);
  if (!Number.isFinite(result)) throw new Error("Enter a valid date and time.");
  return result;
}

function parseGenToWei(value) {
  const clean = String(value).trim();
  if (!/^\d+(\.\d{0,18})?$/.test(clean)) {
    throw new Error("GEN amount must be a positive number with at most 18 decimals.");
  }
  const [whole, fraction = ""] = clean.split(".");
  const result =
    BigInt(whole) * 10n ** 18n + BigInt((fraction + "0".repeat(18)).slice(0, 18));
  if (result <= 0n) throw new Error("Escrow must be greater than zero.");
  return result;
}

function formatWei(value) {
  if (value === undefined || value === null || value === "") return "0";
  const raw = BigInt(String(value));
  const whole = raw / 10n ** 18n;
  const fraction = (raw % 10n ** 18n).toString().padStart(18, "0").slice(0, 5);
  return String(whole) + (Number(fraction) ? "." + fraction.replace(/0+$/, "") : "");
}

async function sha256Bytes(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

function parseContractJson(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function normalizeError(error) {
  const code = error?.code ?? error?.cause?.code;
  const message =
    error?.shortMessage ||
    error?.cause?.shortMessage ||
    error?.message ||
    "The operation could not be completed.";
  if (code === 4001 || /rejected|denied/i.test(message)) {
    return "The wallet request was rejected. Nothing was submitted.";
  }
  if (/insufficient funds/i.test(message)) {
    return "The connected wallet does not have enough test GEN for this transaction.";
  }
  if (/wrong chain|chain.*mismatch|network/i.test(message)) {
    return "MetaMask is on the wrong network. Switch to GenLayer Studio and retry.";
  }
  return String(message).replace(/^Error:\s*/, "").slice(0, 420);
}

function receiptHasFailedExecution(receipt) {
  const consensusResult = receipt?.resultName || receipt?.result_name || "";
  const leaderReceipt = receipt?.consensusData?.leaderReceipt || receipt?.consensus_data?.leader_receipt;
  const leaderEntries = Array.isArray(leaderReceipt)
    ? leaderReceipt
    : leaderReceipt
      ? [leaderReceipt]
      : [];
  return (
    receipt?.txExecutionResultName === ExecutionResult.FINISHED_WITH_ERROR ||
    ["FAILURE", "MAJORITY_DISAGREE", "NO_MAJORITY", "DETERMINISTIC_VIOLATION"].includes(
      String(consensusResult),
    ) ||
    leaderEntries.some((entry) => entry?.execution_result === "ERROR")
  );
}

function Field({ label, hint, className = "", ...props }) {
  return (
    <label className={"field " + className}>
      <span>{label}</span>
      <input {...props} />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function Textarea({ label, hint, className = "", ...props }) {
  return (
    <label className={"field " + className}>
      <span>{label}</span>
      <textarea {...props} />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function Panel({ eyebrow, title, icon: Icon, children, className = "" }) {
  return (
    <section className={"panel " + className}>
      <div className="panel-heading">
        <div className="panel-icon">{Icon ? <Icon size={18} /> : null}</div>
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function CopyButton({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button className="icon-button" type="button" onClick={onCopy} disabled={!value}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

function ProofItem({ label, value, href }) {
  const hasValue = Boolean(value);
  return (
    <div className="proof-item">
      <span>{label}</span>
      <div>
        <strong className={hasValue ? "" : "pending-proof"}>
          {hasValue ? short(value, 10, 7) : "Awaiting verified record"}
        </strong>
        {hasValue && href ? (
          <a href={href} target="_blank" rel="noreferrer" aria-label={"Open " + label}>
            <ArrowUpRight size={15} />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function TransactionRail({ tx, onRetry }) {
  const stages = ["wallet", "submitted", "proposing", "accepted", "finalized"];
  const activeIndex = stages.indexOf(tx.stage);
  if (tx.stage === "idle") {
    return (
      <div className="tx-empty">
        <ShieldCheck size={18} />
        Wallet confirmation and consensus progress will appear here.
      </div>
    );
  }
  if (tx.stage === "failed") {
    return (
      <div className="tx-failed">
        <AlertCircle size={18} />
        <div>
          <strong>Transaction failed safely</strong>
          <p>{tx.error}</p>
          {tx.hash ? <code>{tx.hash}</code> : null}
        </div>
        {onRetry ? (
          <button className="button ghost small" type="button" onClick={onRetry}>
            <RefreshCw size={15} /> Retry
          </button>
        ) : null}
      </div>
    );
  }
  return (
    <div className="transaction-rail">
      <div className="rail-title">
        <span>
          <LoaderCircle className={tx.stage === "finalized" ? "" : "spin"} size={17} />
          {tx.label || "Contract transaction"}
        </span>
        {tx.hash ? <code>{short(tx.hash, 11, 8)}</code> : null}
      </div>
      <div className="rail-stages">
        {stages.map((stage, index) => (
          <div
            className={
              "rail-stage " +
              (index < activeIndex || tx.stage === "finalized"
                ? "done"
                : index === activeIndex
                  ? "active"
                  : "")
            }
            key={stage}
          >
            <i>{index < activeIndex || tx.stage === "finalized" ? <Check size={12} /> : index + 1}</i>
            <span>{stage === "wallet" ? "Wallet confirmation" : displayStatus(stage)}</span>
          </div>
        ))}
      </div>
      {tx.hash ? (
        <a className="tx-link" href={EXPLORER_URL} target="_blank" rel="noreferrer">
          Open GenLayer Explorer <ArrowUpRight size={14} />
        </a>
      ) : null}
    </div>
  );
}

function VerdictCard({ verdict }) {
  if (!verdict || typeof verdict !== "object") {
    return (
      <div className="empty-state compact">
        <Gavel size={24} />
        <div>
          <strong>No contract verdict recorded</strong>
          <p>Scores and payout percentages only appear after contract consensus.</p>
        </div>
      </div>
    );
  }
  const payout = Number(verdict.worker_payout_bps || 0) / 100;
  return (
    <div className="verdict-card">
      <div className="verdict-top">
        <div>
          <p className="eyebrow">{verdict.verdict_id || "Consensus verdict"}</p>
          <h3>{displayStatus(verdict.status)}</h3>
          <p>{verdict.summary || "No reasoning returned."}</p>
        </div>
        <div className="score-ring" style={{ "--score": payout }}>
          <strong>{Number(verdict.overall_score || 0)}%</strong>
          <span>compliance</span>
        </div>
      </div>
      <div className="settlement-split">
        <div>
          <span>Worker payout</span>
          <strong>{payout}%</strong>
          <i style={{ width: payout + "%" }} />
        </div>
        <div>
          <span>Client refund</span>
          <strong>{Number(verdict.client_refund_bps || 0) / 100}%</strong>
          <i style={{ width: Number(verdict.client_refund_bps || 0) / 100 + "%" }} />
        </div>
      </div>
      <div className="criteria-list">
        {(verdict.criteria || []).map((item) => (
          <div className="criterion" key={item.name}>
            <div>
              <strong>{item.name}</strong>
              <span>{item.weight_bps / 100}% weight</span>
            </div>
            <div className="criterion-score">
              <i><b style={{ width: item.score + "%" }} /></i>
              <strong>{item.score}</strong>
            </div>
            <p>{item.finding}</p>
          </div>
        ))}
      </div>
      <div className="verdict-meta">
        <span>Confidence <strong>{verdict.confidence}</strong></span>
        <span>Evidence <strong>{verdict.evidence_status}</strong></span>
        <span>Agreement <strong>{short(verdict.agreement_hash)}</strong></span>
      </div>
      {verdict.risk_flags?.length ? (
        <div className="risk-flags">
          {verdict.risk_flags.map((flag) => <span key={flag}>{flag}</span>)}
        </div>
      ) : null}
    </div>
  );
}

function AgreementTimeline({ agreement }) {
  if (!agreement) return null;
  const current = statusOrder.indexOf(agreement.status);
  const exceptional = !statusOrder.includes(agreement.status);
  return (
    <div className="state-machine">
      {statusOrder.map((status, index) => (
        <div
          key={status}
          className={
            "state-node " +
            (index < current || agreement.status === "SETTLED" ? "complete " : "") +
            (index === current ? "current" : "")
          }
        >
          <i>{index < current || agreement.status === "SETTLED" ? <Check size={12} /> : index + 1}</i>
          <span>{displayStatus(status)}</span>
        </div>
      ))}
      {exceptional ? (
        <div className="state-node current exceptional">
          <i>!</i><span>{displayStatus(agreement.status)}</span>
        </div>
      ) : null}
    </div>
  );
}

function App() {
  const [tab, setTab] = useState("desk");
  const [menuOpen, setMenuOpen] = useState(false);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [walletError, setWalletError] = useState("");
  const [walletBusy, setWalletBusy] = useState(false);
  const [lookupId, setLookupId] = useState("");
  const [agreement, setAgreement] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [dispute, setDispute] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [history, setHistory] = useState([]);
  const [readError, setReadError] = useState("");
  const [readBusy, setReadBusy] = useState(false);
  const [tx, setTx] = useState({ stage: "idle", label: "", hash: "", error: "" });
  const [retryAction, setRetryAction] = useState(null);
  const [toast, setToast] = useState("");

  const [createForm, setCreateForm] = useState({
    agreementId: "dock-web-001",
    title: "Five-page wallet-connected website",
    description:
      "Build and deploy a responsive five-page website with a working MetaMask connection and deliver it before the committed deadline.",
    worker: "",
    termsUrl: EVIDENCE_BASE + "agreement-terms.md",
    termsHash: "f18bfdc273e59b15dfcc603acbce4df25e85529a4486c9dc42d43b5ae4a49e8a",
    escrowGen: "5",
    acceptanceDeadline: localDate(24),
    submissionDeadline: localDate(168),
    reviewHours: "24",
    evidenceHours: "24",
    appealHours: "24",
    criteria:
      "Responsive design|2500\nFive complete pages|2500\nWorking MetaMask wallet integration|2000\nDelivery by the committed deadline|3000",
  });
  const [submissionForm, setSubmissionForm] = useState({
    deliverableUrl: EVIDENCE_BASE + "worker-deliverable.md",
    deliverableHash: "d9504d98ec3c1ff6d4cb34e6f4fcade05aaa0b89a333ca423dd32838f157cddb",
    evidence:
      "TEST_REPORT|" + EVIDENCE_BASE + "direct-test-report.md|2328f5564c16d8783bf71fdc57dec9584c7939f6fff61dd6fccafadbfa7429fe",
    statement:
      "The committed milestone is complete. The linked deliverable and evidence correspond to the submitted SHA-256 digests.",
  });
  const [disputeForm, setDisputeForm] = useState({
    evidence: "ISSUE_LOG|" + EVIDENCE_BASE + "client-dispute.md|77cd41892ebede1d8fb96c8e085045bdbdcee0d82d9909edab3e98dc0c1218e7",
    statement:
      "The wallet connection requirement does not work as agreed. The evidence records the reproducible failure.",
  });
  const [responseForm, setResponseForm] = useState({
    evidence: "COMMUNICATION|" + EVIDENCE_BASE + "worker-response.md|436f8d2c19cf82c9f13a2d1e4696dfbd892ffcd9f0752142e929a047888070eb",
    statement:
      "The remaining requirements were delivered. This response acknowledges and documents the wallet integration issue.",
  });
  const [appealForm, setAppealForm] = useState({
    appealId: "appeal-web-001",
    statement:
      "New, hash-bound evidence materially changes one criterion and should be considered in the single permitted recheck.",
    evidence: "TEST_REPORT|" + EVIDENCE_BASE + "appeal-new-evidence.md|55d6e8f341f14b77014d953957375520ebb2f0de0e815c1d2e76a7d2e7cd4dc0",
  });
  const [mutualForm, setMutualForm] = useState({
    proposalId: "mutual-web-001",
    workerBps: "8000",
    note: "Both parties agree to an 80/20 settlement based on the delivered scope.",
  });
  const [mutualAcceptId, setMutualAcceptId] = useState("");
  const [hashResult, setHashResult] = useState("");
  const [verifyForm, setVerifyForm] = useState({ url: "", hash: "" });
  const [verifyResult, setVerifyResult] = useState(null);

  const correctNetwork = chainId?.toLowerCase() === CHAIN_HEX.toLowerCase();
  const connectedRole = useMemo(() => {
    if (!agreement || !account) return "";
    if (String(agreement.client).toLowerCase() === account.toLowerCase()) return "CLIENT";
    if (String(agreement.worker).toLowerCase() === account.toLowerCase()) return "WORKER";
    return "OBSERVER";
  }, [agreement, account]);

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  const refreshWalletState = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const [accounts, activeChain] = await Promise.all([
        window.ethereum.request({ method: "eth_accounts" }),
        window.ethereum.request({ method: "eth_chainId" }),
      ]);
      setAccount(accounts?.[0] || "");
      setChainId(activeChain || "");
    } catch {
      // A passive wallet-state refresh should not open an intrusive error.
    }
  }, []);

  useEffect(() => {
    refreshWalletState();
    if (!window.ethereum) return undefined;
    const onAccounts = (accounts) => {
      setAccount(accounts?.[0] || "");
      setWalletError("");
    };
    const onChain = (value) => {
      setChainId(value);
      setWalletError("");
    };
    window.ethereum.on?.("accountsChanged", onAccounts);
    window.ethereum.on?.("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", onAccounts);
      window.ethereum.removeListener?.("chainChanged", onChain);
    };
  }, [refreshWalletState]);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask was not detected in this browser.");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_HEX }],
      });
    } catch (error) {
      if (error?.code !== 4902 && error?.cause?.code !== 4902) throw error;
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_HEX,
            chainName: studionet.name,
            nativeCurrency: studionet.nativeCurrency,
            rpcUrls: studionet.rpcUrls.default.http,
            blockExplorerUrls: [EXPLORER_URL],
          },
        ],
      });
    }
    const current = await window.ethereum.request({ method: "eth_chainId" });
    setChainId(current);
  }, []);

  const connectWallet = useCallback(async () => {
    setWalletBusy(true);
    setWalletError("");
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is required. Install or open MetaMask, then try again.");
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts?.[0]) throw new Error("MetaMask did not return an account.");
      setAccount(accounts[0]);
      await switchNetwork();
      notify("Wallet connected to GenLayer Studio.");
    } catch (error) {
      setWalletError(normalizeError(error));
    } finally {
      setWalletBusy(false);
    }
  }, [notify, switchNetwork]);

  const disconnectWallet = useCallback(() => {
    setAccount("");
    setWalletError("");
    setTx({ stage: "idle", label: "", hash: "", error: "" });
    setRetryAction(null);
    notify("Local wallet session cleared.");
  }, [notify]);

  const readContractJson = useCallback(async (functionName, args = []) => {
    if (!CONTRACT_READY) throw new Error("The verified contract address has not been recorded yet.");
    const value = await readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName,
      args,
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
      jsonSafeReturn: true,
    });
    return parseContractJson(value);
  }, []);

  const loadAgreement = useCallback(
    async (overrideId) => {
      const id = String(overrideId || lookupId).trim();
      if (!id) {
        setReadError("Enter an agreement ID.");
        return;
      }
      setReadBusy(true);
      setReadError("");
      try {
        const record = await readContractJson("get_agreement", [id]);
        if (!record || typeof record !== "object") throw new Error("Agreement was not found in finalized state.");
        const [submissionRecord, disputeRecord, verdictRecord] = await Promise.all([
          readContractJson("get_submission", [id]),
          readContractJson("get_dispute", [id]),
          readContractJson("get_latest_verdict", [id]),
        ]);
        setLookupId(id);
        setAgreement(record);
        setSubmission(submissionRecord && typeof submissionRecord === "object" ? submissionRecord : null);
        setDispute(disputeRecord && typeof disputeRecord === "object" ? disputeRecord : null);
        setVerdict(verdictRecord && typeof verdictRecord === "object" ? verdictRecord : null);
        if (record.open_proposal_id) setMutualAcceptId(record.open_proposal_id);
      } catch (error) {
        setReadError(normalizeError(error));
      } finally {
        setReadBusy(false);
      }
    },
    [lookupId, readContractJson],
  );

  const loadHistory = useCallback(async () => {
    if (!CONTRACT_READY) return;
    try {
      const ids = await readContractJson("get_recent_agreement_ids", []);
      const values = await Promise.all(
        Array.from(ids || []).slice(-12).reverse().map(async (id) => {
          const record = await readContractJson("get_agreement", [String(id)]);
          return record && typeof record === "object" ? record : null;
        }),
      );
      setHistory(values.filter(Boolean));
    } catch {
      setHistory([]);
    }
  }, [readContractJson]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const executeWrite = useCallback(
    async (label, functionName, args = [], value = 0n) => {
      const action = { label, functionName, args, value };
      setRetryAction(action);
      setTx({ stage: "wallet", label, hash: "", error: "" });
      try {
        if (!CONTRACT_READY) throw new Error("Contract deployment is not yet recorded. Writes are intentionally disabled.");
        if (!account) throw new Error("Connect MetaMask before submitting a contract transaction.");
        if (!correctNetwork) await switchNetwork();
        const writeClient = createClient({
          chain: studionet,
          account,
          provider: window.ethereum,
        });
        const txHash = await writeClient.writeContract({
          address: CONTRACT_ADDRESS,
          functionName,
          args,
          value: BigInt(value),
          leaderOnly: false,
          consensusMaxRotations: 3,
        });
        const hash = typeof txHash === "string" ? txHash : txHash?.hash || String(txHash);
        setTx({ stage: "submitted", label, hash, error: "" });
        window.setTimeout(() => {
          setTx((current) =>
            current.hash === hash && current.stage === "submitted"
              ? { ...current, stage: "proposing" }
              : current,
          );
        }, 1800);
        const accepted = await readClient.waitForTransactionReceipt({
          hash: txHash,
          status: TransactionStatus.ACCEPTED,
          interval: 4000,
          retries: 150,
        });
        if (receiptHasFailedExecution(accepted)) {
          throw new Error("Consensus accepted a failed execution; contract state was not changed.");
        }
        setTx({ stage: "accepted", label, hash, error: "" });
        const finalized = await readClient.waitForTransactionReceipt({
          hash: txHash,
          status: TransactionStatus.FINALIZED,
          interval: 4000,
          retries: 150,
        });
        if (receiptHasFailedExecution(finalized)) {
          throw new Error("The transaction finalized with an execution error; state was not changed.");
        }
        setTx({ stage: "finalized", label, hash, error: "" });
        setRetryAction(null);
        notify(label + " finalized.");
        await loadHistory();
        if (lookupId) await loadAgreement(lookupId);
        return hash;
      } catch (error) {
        setTx((current) => ({
          stage: "failed",
          label,
          hash: current.hash || "",
          error: normalizeError(error),
        }));
        return null;
      }
    },
    [account, correctNetwork, loadAgreement, loadHistory, lookupId, notify, switchNetwork],
  );

  const retryLast = retryAction
    ? () =>
        executeWrite(
          retryAction.label,
          retryAction.functionName,
          retryAction.args,
          retryAction.value,
        )
    : null;

  const createAgreement = async (event) => {
    event.preventDefault();
    try {
      const escrow = parseGenToWei(createForm.escrowGen);
      const args = [
        createForm.agreementId.trim(),
        createForm.title.trim(),
        createForm.description.trim(),
        createForm.worker.trim(),
        createForm.termsUrl.trim(),
        createForm.termsHash.trim().toLowerCase(),
        createForm.criteria.trim(),
        escrow,
        unixTime(createForm.acceptanceDeadline),
        unixTime(createForm.submissionDeadline),
        Math.round(Number(createForm.reviewHours) * 3600),
        Math.round(Number(createForm.evidenceHours) * 3600),
        Math.round(Number(createForm.appealHours) * 3600),
      ];
      const result = await executeWrite("Create agreement", "create_agreement", args);
      if (result) {
        setLookupId(createForm.agreementId.trim());
        setTab("desk");
      }
    } catch (error) {
      setTx({ stage: "failed", label: "Create agreement", hash: "", error: normalizeError(error) });
    }
  };

  const requireAgreementId = () => {
    const id = String(lookupId).trim();
    if (!id) throw new Error("Load or enter an agreement ID first.");
    return id;
  };

  const invoke = async (label, functionName, args = [], value = 0n) => {
    try {
      return await executeWrite(label, functionName, [requireAgreementId(), ...args], value);
    } catch (error) {
      setTx({ stage: "failed", label, hash: "", error: normalizeError(error) });
      return null;
    }
  };

  const digestFile = async (file) => {
    if (!file) return;
    setHashResult(await sha256Bytes(await file.arrayBuffer()));
  };

  const verifyUrl = async (event) => {
    event.preventDefault();
    setVerifyResult({ status: "busy", message: "Fetching the exact public bytes…" });
    try {
      const response = await fetch(verifyForm.url, { cache: "no-store" });
      if (!response.ok) throw new Error("Evidence URL returned HTTP " + response.status + ".");
      const bytes = await response.arrayBuffer();
      const actual = await sha256Bytes(bytes);
      const match = actual === verifyForm.hash.trim().toLowerCase();
      setVerifyResult({
        status: match ? "match" : "mismatch",
        message: match
          ? "Digest matches these fetched bytes."
          : "Digest mismatch. Do not submit this URL/hash pair.",
        actual,
        bytes: bytes.byteLength,
      });
    } catch (error) {
      setVerifyResult({ status: "error", message: normalizeError(error) });
    }
  };

  const createButtonText = CONTRACT_READY ? "Commit exact agreement" : "Awaiting contract deployment";

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setTab("desk")}>
          <span className="brand-mark"><Scale size={20} /></span>
          <span>DisputeDock<small>GenLayer arbitration desk</small></span>
        </button>
        <nav className={menuOpen ? "open" : ""}>
          {tabs.map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => {
                setTab(id);
                setMenuOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="wallet-area">
          {account ? (
            <div className={"network-pill " + (correctNetwork ? "good" : "bad")}>
              <i /> {correctNetwork ? "Studio" : "Wrong network"}
            </div>
          ) : null}
          {account ? (
            <button className="wallet-button connected" type="button" onClick={disconnectWallet}>
              <Wallet size={17} />
              <span>{short(account)}</span>
              <Unplug size={14} />
            </button>
          ) : (
            <button className="wallet-button" type="button" onClick={connectWallet} disabled={walletBusy}>
              {walletBusy ? <LoaderCircle className="spin" size={17} /> : <Wallet size={17} />}
              Connect wallet
            </button>
          )}
          <button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {walletError ? (
        <div className="global-notice error">
          <AlertCircle size={17} /><span>{walletError}</span>
          <button type="button" onClick={() => setWalletError("")}><X size={15} /></button>
        </div>
      ) : null}
      {account && !correctNetwork ? (
        <div className="global-notice warning">
          <Network size={17} />
          <span>MetaMask is not on GenLayer Studio (chain {studionet.id}).</span>
          <button type="button" onClick={() => switchNetwork().catch((error) => setWalletError(normalizeError(error)))}>
            Switch network
          </button>
        </div>
      ) : null}

      <main>
        <section className="intro">
          <div>
            <p className="eyebrow"><span /> Evidence-bound freelance escrow</p>
            <h1>Resolve work disputes by <em>requirements,</em> not leverage.</h1>
            <p className="intro-copy">
              Lock exact terms, escrow native test GEN, submit hash-bound evidence,
              and let GenLayer consensus turn human requirements into a deterministic split.
            </p>
          </div>
          <div className="intro-stat">
            <strong>80<span>%</span></strong>
            <p>Example compliance</p>
            <div><i style={{ width: "80%" }} /></div>
            <small>400 to worker · 100 returned to client</small>
          </div>
        </section>

        <section className="proof-strip">
          <ProofItem label="Network" value={"GenLayer Studio · " + studionet.id} href={EXPLORER_URL} />
          <ProofItem
            label="Contract"
            value={CONTRACT_READY ? CONTRACT_ADDRESS : ""}
            href={CONTRACT_READY ? EXPLORER_URL + "/address/" + CONTRACT_ADDRESS : ""}
          />
          <ProofItem
            label="Contract source"
            value={SOURCE_COMMIT}
            href={SOURCE_COMMIT ? GITHUB_URL + "/commit/" + SOURCE_COMMIT : ""}
          />
          <ProofItem label="Source SHA-256" value={SOURCE_HASH} href={SOURCE_COMMIT ? GITHUB_URL + "/blob/" + SOURCE_COMMIT + "/contracts/dispute_dock.py" : ""} />
          <ProofItem label="Deployment tx" value={DEPLOYMENT_TX} href={DEPLOYMENT_TX ? EXPLORER_URL + "/tx/" + DEPLOYMENT_TX : ""} />
          <ProofItem label="Consensus tx" value={CONSENSUS_TX} href={CONSENSUS_TX ? EXPLORER_URL + "/tx/" + CONSENSUS_TX : ""} />
        </section>

        <TransactionRail tx={tx} onRetry={retryLast} />

        {tab === "desk" ? (
          <div className="page-grid desk-grid">
            <div className="main-column">
              <Panel eyebrow="Finalized contract state" title="Case desk" icon={Landmark}>
                <div className="lookup-row">
                  <label>
                    <span>Agreement ID</span>
                    <input
                      value={lookupId}
                      onChange={(event) => setLookupId(event.target.value)}
                      placeholder="dock-web-001"
                    />
                  </label>
                  <button className="button primary" type="button" onClick={() => loadAgreement()} disabled={readBusy || !CONTRACT_READY}>
                    {readBusy ? <LoaderCircle className="spin" size={17} /> : <Database size={17} />}
                    Load finalized state
                  </button>
                </div>
                {readError ? <div className="inline-error"><AlertCircle size={16} />{readError}</div> : null}
                {!agreement ? (
                  <div className="empty-state">
                    <FileKey2 size={30} />
                    <div>
                      <strong>{CONTRACT_READY ? "Load an agreement" : "Deployment record pending"}</strong>
                      <p>
                        {CONTRACT_READY
                          ? "Read authoritative agreement, dispute, and verdict data from GenLayer."
                          : "The application is live in read-only preparation mode until a genuine contract address is recorded."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="case-header">
                      <div>
                        <p className="eyebrow">{agreement.agreement_id}</p>
                        <h3>{agreement.project_title}</h3>
                        <p>{agreement.project_description}</p>
                      </div>
                      <span className={"status-badge status-" + String(agreement.status).toLowerCase()}>
                        {displayStatus(agreement.status)}
                      </span>
                    </div>
                    <AgreementTimeline agreement={agreement} />
                    <div className="case-facts">
                      <div><span>Connected role</span><strong>{connectedRole || "No wallet"}</strong></div>
                      <div><span>Escrow</span><strong>{formatWei(agreement.expected_escrow_wei)} test GEN</strong></div>
                      <div><span>Terms hash</span><strong>{short(agreement.terms_sha256)}</strong></div>
                      <div><span>Agreement hash</span><strong>{short(agreement.agreement_hash)}</strong></div>
                      <div><span>Submission deadline</span><strong>{formatDate(agreement.submission_deadline_unix)}</strong></div>
                      <div><span>Settlement</span><strong>{displayStatus(agreement.settlement_action)}</strong></div>
                    </div>
                    <div className="party-row">
                      <div><span>Client</span><code>{agreement.client}</code></div>
                      <div><span>Worker</span><code>{agreement.worker}</code></div>
                    </div>
                    <div className="record-summary">
                      <div>
                        <FileCheck2 size={15} />
                        <span>Submission</span>
                        <strong>{submission ? short(submission.deliverable_sha256) : "Not recorded"}</strong>
                      </div>
                      <div>
                        <Scale size={15} />
                        <span>Dispute</span>
                        <strong>{dispute ? formatDate(dispute.opened_at) : "Not opened"}</strong>
                      </div>
                    </div>
                  </>
                )}
              </Panel>
              <Panel eyebrow="Consensus output" title="Requirement-by-requirement verdict" icon={Gavel}>
                <VerdictCard verdict={verdict} />
              </Panel>
            </div>

            <aside className="side-column">
              <Panel eyebrow="Project activity" title="Agreement history" icon={Clock3}>
                {history.length ? (
                  <div className="history-list">
                    {history.map((item) => (
                      <button
                        type="button"
                        key={item.agreement_id}
                        onClick={() => loadAgreement(item.agreement_id)}
                      >
                        <span className="history-icon"><FileCheck2 size={16} /></span>
                        <span>
                          <strong>{item.project_title}</strong>
                          <small>{item.agreement_id} · {displayStatus(item.status)}</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state compact">
                    <Clock3 size={22} /><p>No finalized agreements are available yet.</p>
                  </div>
                )}
              </Panel>
              <Panel eyebrow="Trust boundary" title="What consensus actually reviews" icon={ShieldCheck}>
                <ul className="trust-list">
                  <li><Hash size={16} /><span>Exact SHA-256 committed bytes</span></li>
                  <li><Link2 size={16} /><span>Public HTTPS source and content type</span></li>
                  <li><BadgeCheck size={16} /><span>Independent leader and validator retrieval</span></li>
                  <li><Scale size={16} /><span>Locked names, weights, and deterministic payout</span></li>
                </ul>
                <p className="muted-note">
                  Mutable URLs are never treated as proof by themselves. Any byte change fails closed.
                </p>
              </Panel>
            </aside>
          </div>
        ) : null}

        {tab === "create" ? (
          <div className="single-page">
            <Panel eyebrow="Step 1 of the lifecycle" title="Commit a new agreement" icon={FileKey2}>
              <form className="form-grid" onSubmit={createAgreement}>
                <Field label="Agreement ID" value={createForm.agreementId} onChange={(e) => setCreateForm({ ...createForm, agreementId: e.target.value })} />
                <Field label="Worker wallet" placeholder={ZERO_ADDRESS} value={createForm.worker} onChange={(e) => setCreateForm({ ...createForm, worker: e.target.value })} />
                <Field className="wide" label="Project title" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
                <Textarea className="wide" label="Human-written scope" rows="4" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
                <Field label="Canonical terms URL" placeholder="https://raw.githubusercontent.com/…" value={createForm.termsUrl} onChange={(e) => setCreateForm({ ...createForm, termsUrl: e.target.value })} />
                <Field label="Terms SHA-256" placeholder="64 lowercase hex characters" value={createForm.termsHash} onChange={(e) => setCreateForm({ ...createForm, termsHash: e.target.value })} />
                <Field label="Escrow in test GEN" value={createForm.escrowGen} onChange={(e) => setCreateForm({ ...createForm, escrowGen: e.target.value })} hint="Native Studionet GEN, not USDC." />
                <div className="currency-note"><CircleDollarSign size={18} /><span>Exact value is committed now and attached only after worker acceptance.</span></div>
                <Field label="Worker acceptance deadline" type="datetime-local" value={createForm.acceptanceDeadline} onChange={(e) => setCreateForm({ ...createForm, acceptanceDeadline: e.target.value })} />
                <Field label="Submission deadline" type="datetime-local" value={createForm.submissionDeadline} onChange={(e) => setCreateForm({ ...createForm, submissionDeadline: e.target.value })} />
                <Field label="Review window (hours)" type="number" min="1" value={createForm.reviewHours} onChange={(e) => setCreateForm({ ...createForm, reviewHours: e.target.value })} />
                <Field label="Evidence window (hours)" type="number" min="1" value={createForm.evidenceHours} onChange={(e) => setCreateForm({ ...createForm, evidenceHours: e.target.value })} />
                <Field label="Appeal window (hours)" type="number" min="1" value={createForm.appealHours} onChange={(e) => setCreateForm({ ...createForm, appealHours: e.target.value })} />
                <Textarea
                  className="wide"
                  label="Weighted acceptance criteria"
                  rows="6"
                  value={createForm.criteria}
                  onChange={(e) => setCreateForm({ ...createForm, criteria: e.target.value })}
                  hint="One NAME|WEIGHT_BPS per line. Between 2 and 8 criteria; weights must total exactly 10,000."
                />
                <div className="commit-warning wide">
                  <LockKeyhole size={18} />
                  <span>The worker must accept the exact computed agreement hash before the client can fund escrow.</span>
                </div>
                <div className="form-actions wide">
                  <button className="button primary" disabled={!CONTRACT_READY || !account} type="submit">
                    <FileKey2 size={17} /> {createButtonText}
                  </button>
                  {!account ? <small>Connect MetaMask to create an agreement.</small> : null}
                </div>
              </form>
            </Panel>
          </div>
        ) : null}

        {tab === "actions" ? (
          <div className="single-page">
            <div className="action-context">
              <label>
                <span>Active agreement ID</span>
                <input value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="dock-web-001" />
              </label>
              <button className="button ghost" type="button" onClick={() => loadAgreement()} disabled={!CONTRACT_READY}>
                <RefreshCw size={16} /> Refresh
              </button>
              <span className="role-chip">{connectedRole || "Connect wallet and load case"}</span>
            </div>
            <div className="actions-grid">
              <Panel eyebrow="Worker → exact terms" title="Accept agreement" icon={BadgeCheck}>
                <p>Acceptance is bound to the on-chain agreement hash shown below.</p>
                <code className="block-code">{agreement?.agreement_hash || "Load an agreement to retrieve its hash."}</code>
                <button className="button primary full" type="button" disabled={!agreement?.agreement_hash} onClick={() => invoke("Accept exact terms", "accept_agreement", [agreement.agreement_hash])}>
                  Accept exact hash
                </button>
              </Panel>
              <Panel eyebrow="Client → escrow" title="Fund with native test GEN" icon={CircleDollarSign}>
                <p>MetaMask attaches exactly the amount committed in the agreement.</p>
                <div className="large-value">{agreement ? formatWei(agreement.expected_escrow_wei) : "—"} <small>GEN</small></div>
                <button className="button primary full" type="button" disabled={!agreement?.expected_escrow_wei} onClick={() => invoke("Fund escrow", "fund_agreement", [], BigInt(agreement.expected_escrow_wei))}>
                  Fund exact escrow
                </button>
              </Panel>
              <Panel eyebrow="Worker → milestone" title="Submit deliverable" icon={Upload}>
                <div className="stack-fields">
                  <Field label="Deliverable URL" value={submissionForm.deliverableUrl} onChange={(e) => setSubmissionForm({ ...submissionForm, deliverableUrl: e.target.value })} />
                  <Field label="Deliverable SHA-256" value={submissionForm.deliverableHash} onChange={(e) => setSubmissionForm({ ...submissionForm, deliverableHash: e.target.value })} />
                  <Textarea label="Evidence manifest" rows="4" value={submissionForm.evidence} onChange={(e) => setSubmissionForm({ ...submissionForm, evidence: e.target.value })} hint="TYPE|HTTPS_URL|SHA256" />
                  <Textarea label="Worker statement" rows="3" value={submissionForm.statement} onChange={(e) => setSubmissionForm({ ...submissionForm, statement: e.target.value })} />
                </div>
                <button className="button primary full" type="button" onClick={() => invoke("Submit milestone", "submit_milestone", [submissionForm.deliverableUrl, submissionForm.deliverableHash, submissionForm.evidence, submissionForm.statement])}>
                  Submit hash-bound milestone
                </button>
              </Panel>
              <Panel eyebrow="Client → review" title="Approve or dispute" icon={Scale}>
                <button className="button success full" type="button" onClick={() => invoke("Approve milestone", "approve_milestone")}>
                  <Check size={16} /> Approve full release
                </button>
                <div className="divider"><span>or open a dispute</span></div>
                <div className="stack-fields">
                  <Textarea label="Client evidence manifest" rows="4" value={disputeForm.evidence} onChange={(e) => setDisputeForm({ ...disputeForm, evidence: e.target.value })} />
                  <Textarea label="Dispute statement" rows="3" value={disputeForm.statement} onChange={(e) => setDisputeForm({ ...disputeForm, statement: e.target.value })} />
                </div>
                <button className="button danger full" type="button" onClick={() => invoke("Open dispute", "open_dispute", [disputeForm.evidence, disputeForm.statement])}>
                  Open evidence-bound dispute
                </button>
              </Panel>
              <Panel eyebrow="Worker → response" title="Answer the dispute" icon={FileCheck2}>
                <div className="stack-fields">
                  <Textarea label="Worker evidence manifest" rows="4" value={responseForm.evidence} onChange={(e) => setResponseForm({ ...responseForm, evidence: e.target.value })} />
                  <Textarea label="Response statement" rows="3" value={responseForm.statement} onChange={(e) => setResponseForm({ ...responseForm, statement: e.target.value })} />
                </div>
                <button className="button primary full" type="button" onClick={() => invoke("Respond to dispute", "respond_to_dispute", [responseForm.evidence, responseForm.statement])}>
                  Record worker response
                </button>
              </Panel>
              <Panel eyebrow="Either party → validators" title="Request full-consensus judgment" icon={Gavel}>
                <div className="consensus-box">
                  <BadgeCheck size={20} />
                  <div>
                    <strong>Simulation off · leaderOnly false</strong>
                    <p>Validators independently retrieve and hash every evidence item before comparing structured scores.</p>
                  </div>
                </div>
                <button className="button primary full" type="button" onClick={() => invoke("Request GenLayer judgment", "request_judgment")}>
                  Start full-consensus adjudication
                </button>
              </Panel>
              <Panel eyebrow="One bounded recheck" title="Appeal with new evidence" icon={RefreshCw}>
                <div className="stack-fields">
                  <Field label="Unique appeal ID" value={appealForm.appealId} onChange={(e) => setAppealForm({ ...appealForm, appealId: e.target.value })} />
                  <Textarea label="Appeal statement" rows="3" value={appealForm.statement} onChange={(e) => setAppealForm({ ...appealForm, statement: e.target.value })} />
                  <Textarea label="New evidence manifest" rows="4" value={appealForm.evidence} onChange={(e) => setAppealForm({ ...appealForm, evidence: e.target.value })} />
                </div>
                <button className="button primary full" type="button" onClick={() => invoke("Open single appeal", "appeal_judgment", [appealForm.appealId, appealForm.statement, appealForm.evidence])}>
                  Commit one appeal
                </button>
              </Panel>
              <Panel eyebrow="No trapped funds" title="Settle or exercise timeout" icon={Clock3}>
                <div className="button-stack">
                  <button className="button ghost full" type="button" onClick={() => invoke("Settle final judgment", "settle_judgment")}>Settle after appeal window</button>
                  <button className="button ghost full" type="button" onClick={() => invoke("Exercise state timeout", "settle_timeout")}>Exercise current timeout</button>
                  <button className="button ghost full" type="button" onClick={() => invoke("Exercise hard timeout", "settle_final_timeout")}>Exercise hard final timeout</button>
                  <button className="button ghost full" type="button" onClick={() => invoke("Cancel before funding", "cancel_before_funding")}>Cancel before funding</button>
                </div>
              </Panel>
              <Panel eyebrow="Both parties → deterministic split" title="Mutual resolution" icon={Landmark}>
                <div className="stack-fields">
                  <Field label="Proposal ID" value={mutualForm.proposalId} onChange={(e) => setMutualForm({ ...mutualForm, proposalId: e.target.value })} />
                  <Field label="Worker payout (basis points)" type="number" min="0" max="10000" value={mutualForm.workerBps} onChange={(e) => setMutualForm({ ...mutualForm, workerBps: e.target.value })} />
                  <Textarea label="Resolution note" rows="2" value={mutualForm.note} onChange={(e) => setMutualForm({ ...mutualForm, note: e.target.value })} />
                </div>
                <button className="button primary full" type="button" onClick={() => invoke("Propose mutual split", "propose_mutual_resolution", [mutualForm.proposalId, Number(mutualForm.workerBps), mutualForm.note])}>Propose split</button>
                <div className="inline-action">
                  <input value={mutualAcceptId} onChange={(e) => setMutualAcceptId(e.target.value)} placeholder="Proposal ID" />
                  <button className="button ghost" type="button" onClick={() => invoke("Accept mutual split", "accept_mutual_resolution", [mutualAcceptId])}>Accept</button>
                </div>
                <button className="text-button" type="button" onClick={() => invoke("Expire mutual proposal", "expire_mutual_resolution")}>Expire stale proposal and resume case</button>
              </Panel>
            </div>
          </div>
        ) : null}

        {tab === "evidence" ? (
          <div className="page-grid">
            <Panel eyebrow="Local tool · no upload" title="Calculate a file SHA-256" icon={Hash}>
              <p className="panel-copy">
                Select the exact file that will be served at the public evidence URL. Hashing happens locally in this browser.
              </p>
              <label className="file-drop">
                <Upload size={26} />
                <strong>Choose evidence file</strong>
                <span>Plain text and stable raw files are recommended.</span>
                <input type="file" onChange={(event) => digestFile(event.target.files?.[0])} />
              </label>
              <div className="hash-output">
                <code>{hashResult || "SHA-256 will appear here"}</code>
                <CopyButton value={hashResult} />
              </div>
            </Panel>
            <Panel eyebrow="Preflight only" title="Verify URL bytes against a digest" icon={FileCheck2}>
              <p className="panel-copy">
                This catches an obvious mismatch before submission. GenLayer validators still perform the authoritative retrieval.
              </p>
              <form className="stack-fields" onSubmit={verifyUrl}>
                <Field label="Public HTTPS URL" value={verifyForm.url} onChange={(e) => setVerifyForm({ ...verifyForm, url: e.target.value })} />
                <Field label="Expected SHA-256" value={verifyForm.hash} onChange={(e) => setVerifyForm({ ...verifyForm, hash: e.target.value })} />
                <button className="button primary" type="submit">Fetch and compare</button>
              </form>
              {verifyResult ? (
                <div className={"verify-result " + verifyResult.status}>
                  {verifyResult.status === "busy" ? <LoaderCircle className="spin" size={17} /> : verifyResult.status === "match" ? <Check size={17} /> : <AlertCircle size={17} />}
                  <div><strong>{verifyResult.message}</strong>{verifyResult.actual ? <code>{verifyResult.actual} · {verifyResult.bytes} bytes</code> : null}</div>
                </div>
              ) : null}
            </Panel>
            <Panel eyebrow="Submission format" title="Canonical evidence manifest" icon={Code2} className="wide-panel">
              <div className="manifest-example">
                <code>TYPE|HTTPS_URL|SHA256</code>
                <code>TEST_REPORT|https://raw.githubusercontent.com/org/repo/commit/report.md|64-hex-digest</code>
              </div>
              <div className="evidence-rules">
                <div><strong>Stable bytes</strong><span>Prefer commit-pinned raw GitHub files or content-addressed storage.</span></div>
                <div><strong>Public retrieval</strong><span>No login, cookie wall, JavaScript challenge, private IP, query, or fragment.</span></div>
                <div><strong>Prompt isolation</strong><span>Evidence is treated as untrusted content; embedded instructions are ignored.</span></div>
                <div><strong>Fail closed</strong><span>Unavailable, oversized, empty, or changed evidence yields insufficient evidence.</span></div>
              </div>
            </Panel>
          </div>
        ) : null}

        {tab === "protocol" ? (
          <div className="single-page protocol-page">
            <Panel eyebrow="How DisputeDock resolves a case" title="Consensus-backed settlement protocol" icon={BookOpen}>
              <div className="protocol-steps">
                {[
                  ["01", "Commit", "Client records human terms, criteria weights, deadlines, evidence source, SHA-256, and escrow amount."],
                  ["02", "Accept + fund", "Worker accepts the exact agreement hash. Only then can the client attach native test GEN."],
                  ["03", "Deliver + review", "Worker submits hash-bound delivery evidence. Client approves, disputes, or times out into worker protection."],
                  ["04", "Adjudicate", "Leader and validators retrieve the same bytes, interpret each criterion, and reach full consensus."],
                  ["05", "Settle", "The contract derives basis points from the consensus score and deterministically splits escrow."],
                  ["06", "Recheck once", "Either party may commit new evidence during one bounded appeal; original verdict stays immutable."],
                ].map(([number, title, copy]) => (
                  <div className="protocol-step" key={number}>
                    <span>{number}</span><div><strong>{title}</strong><p>{copy}</p></div>
                  </div>
                ))}
              </div>
            </Panel>
            <div className="protocol-cards">
              <Panel eyebrow="Authorization" title="Wallet-gated actions" icon={Wallet}>
                <p>Client and worker roles are enforced by the contract sender address, not by the interface.</p>
              </Panel>
              <Panel eyebrow="Currency" title="Native test GEN" icon={CircleDollarSign}>
                <p>Current GenLayer documentation supports native GEN value transfer for Studio testing. Studio does not fully model live chain-layer behavior, and no claim of real-value USDC custody is made.</p>
              </Panel>
              <Panel eyebrow="Authority" title="Contract is the source of truth" icon={Database}>
                <p>The frontend reads finalized state. It never fabricates verdicts, scores, settlement status, or hashes.</p>
              </Panel>
            </div>
          </div>
        ) : null}
      </main>

      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark"><Scale size={19} /></span>
          <span>DisputeDock<small>Evidence in. Consensus out.</small></span>
        </div>
        <p>
          Experimental GenLayer Studionet prototype. Test GEN has no represented cash value.
          Do not use for production funds or legal adjudication.
        </p>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer"><Code2 size={17} /> Source code</a>
      </footer>

      {toast ? <div className="toast"><Check size={16} />{toast}</div> : null}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
