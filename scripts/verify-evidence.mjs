import { createHash } from "node:crypto";

const base =
  "https://raw.githubusercontent.com/haris4587/DisputeDock/" +
  "5f3cb7ff97cbfcc60f71f30c732bfd9b7e67a9fd/demo/evidence/";

const commitments = {
  "agreement-terms.md": "f18bfdc273e59b15dfcc603acbce4df25e85529a4486c9dc42d43b5ae4a49e8a",
  "worker-deliverable.md": "d9504d98ec3c1ff6d4cb34e6f4fcade05aaa0b89a333ca423dd32838f157cddb",
  "direct-test-report.md": "2328f5564c16d8783bf71fdc57dec9584c7939f6fff61dd6fccafadbfa7429fe",
  "client-dispute.md": "77cd41892ebede1d8fb96c8e085045bdbdcee0d82d9909edab3e98dc0c1218e7",
  "worker-response.md": "436f8d2c19cf82c9f13a2d1e4696dfbd892ffcd9f0752142e929a047888070eb",
  "appeal-new-evidence.md": "55d6e8f341f14b77014d953957375520ebb2f0de0e815c1d2e76a7d2e7cd4dc0",
};

const records = [];
for (const [name, expected] of Object.entries(commitments)) {
  const response = await fetch(base + name, { cache: "no-store" });
  if (!response.ok) throw new Error(name + " returned HTTP " + response.status);
  const bytes = Buffer.from(await response.arrayBuffer());
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== expected) {
    throw new Error(name + " hash mismatch: expected " + expected + ", got " + actual);
  }
  records.push({ name, bytes: bytes.length, sha256: actual, result: "PASS" });
}

console.log(JSON.stringify({ commit: base.split("/")[5], records }, null, 2));
