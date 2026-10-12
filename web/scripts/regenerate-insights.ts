/**
 * Regenerate per-cluster insight text in analysis.json (run offline, never on
 * page load):  npx tsx scripts/regenerate-insights.ts
 *
 * - Relabels vague/near-duplicate cluster names to distinct product copy
 * - Writes a unique recommendation per cluster (amplify/protect for positive
 *   themes, fixes for negative ones)
 * - Rewrites summaries + why-lines from the cluster's real stats
 * - Recomputes priority with the fraud multiplier clamped to 0-100
 *
 * Patches both the canonical data/analysis.json and the bundled
 * web/data/analysis.json copy. Fails loudly if invariants break.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type Cluster = {
  id: number;
  volume: number;
  share: number;
  negativity: number;
  growth: number;
  categories: Record<string, number>;
  ids?: string[];
  label: string;
  summary: string;
  recommendation: string;
  owner: string;
  why: string;
  priority: number;
};

type Analysis = {
  meta: Record<string, unknown>;
  clusters: Cluster[];
  feedback: unknown[];
};

// Per-cluster product copy, keyed by id. Labels must stay distinct; each
// recommendation must be unique across the set.
const COPY: Record<
  number,
  { label: string; owner: string; recommendation: string }
> = {
  6: {
    label: "Unauthorized Charges & Missing Orders",
    owner: "Trust & Safety",
    recommendation:
      "Freeze captures on flagged charge patterns, auto-refund undelivered orders within 48 hours, and surface a one-tap dispute path at checkout.",
  },
  9: {
    label: "Seller & Listing Scams",
    owner: "Trust & Safety",
    recommendation:
      "Suspend sellers after two verified scam reports, require listing-accuracy audits, and back every purchase with a no-questions buyer guarantee.",
  },
  0: {
    label: "Delivery Delays",
    owner: "Operations",
    recommendation:
      "Set carrier SLAs for the worst-performing lanes, send proactive delay notifications with tracking, and pre-authorize compensation for late orders.",
  },
  3: {
    label: "Damaged & Wrong Orders",
    owner: "Operations",
    recommendation:
      "Add photo verification at the packing step and auto-ship replacements for every damaged or wrong-item report without a second contact.",
  },
  2: {
    label: "Mixed Support Experience",
    owner: "Support",
    recommendation:
      "Keep the fast-resolution scripts that earn praise, and escalate any ticket unresolved after first contact to a senior agent within two hours.",
  },
  7: {
    label: "Fast, Knowledgeable Support",
    owner: "Support",
    recommendation:
      "Turn the praised support flows into the documented playbook and staff them as the default first-response team.",
  },
  5: {
    label: "Durable, Great Value",
    owner: "Product",
    recommendation:
      "Amplify the durability-and-value praise in launch marketing, and protect it by locking the current build-quality bar into QA.",
  },
  8: {
    label: "Reliable Performance",
    owner: "Product",
    recommendation:
      "Protect reliability as a headline feature: publish performance stats and regression-gate every release against the current baseline.",
  },
  4: {
    label: "Innovative Features",
    owner: "Product",
    recommendation:
      "Feed the innovative-feature praise into the roadmap review and prioritize the next iteration of the most-mentioned capabilities.",
  },
  1: {
    label: "Exceeds Expectations",
    owner: "Product",
    recommendation:
      "Use exceeds-expectations quotes as social proof and interview these buyers for case studies before the next campaign.",
  },
};

const FRAUD = "Fraud and Scam";

function dominantCategory(c: Cluster): string {
  return (
    Object.entries(c.categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ""
  );
}

function clampPriority(c: Cluster, maxShare: number, maxGrowth: number): number {
  const raw =
    0.4 * (maxShare === 0 ? 0 : c.share / maxShare) +
    0.35 * c.negativity +
    0.25 * (maxGrowth === 0 ? 0 : Math.min(c.growth / maxGrowth, 1));
  const boosted =
    100 * raw * (dominantCategory(c) === FRAUD ? 1.25 : 1);
  return Math.round(Math.min(100, Math.max(0, boosted)) * 10) / 10;
}

function regenerate(analysis: Analysis): void {
  const { clusters } = analysis;
  const maxShare = Math.max(...clusters.map((c) => c.share), 0);
  const maxGrowth = Math.max(...clusters.map((c) => c.growth), 0);

  for (const c of clusters) {
    const copy = COPY[c.id];
    if (!copy) throw new Error(`No COPY entry for cluster ${c.id}`);
    c.label = copy.label;
    c.owner = copy.owner;
    c.recommendation = copy.recommendation;
    c.summary = `Covers ${c.ids?.length ?? "—"} distinct feedback texts (~${c.volume.toLocaleString()} reports, ${(c.share * 100).toFixed(1)}% of volume) around ${copy.label.toLowerCase()}. Dominant category: ${dominantCategory(c)}.`;
    c.why = `This theme represents ${c.volume.toLocaleString()} reports (${(c.share * 100).toFixed(1)}% of all feedback) with ${(c.negativity * 100).toFixed(0)}% negative sentiment, growing ${c.growth.toFixed(1)}x across the 12-week window — priority ${clampPriority(c, maxShare, maxGrowth).toFixed(1)}.`;
    c.priority = clampPriority(c, maxShare, maxGrowth);
  }

  // Invariants — fail loudly rather than ship broken seed data.
  const total = clusters.reduce((s, c) => s + c.volume, 0);
  if (total !== 7000) throw new Error(`Volume ${total} != 7000`);
  const labels = new Set(clusters.map((c) => c.label));
  if (labels.size !== clusters.length)
    throw new Error("Duplicate cluster labels");
  const recs = new Set(clusters.map((c) => c.recommendation));
  if (recs.size !== clusters.length)
    throw new Error("Duplicate recommendation text");
}

const root = path.resolve(__dirname, "..", "..");
const targets = [
  path.join(root, "data", "analysis.json"),
  path.join(root, "web", "data", "analysis.json"),
];

for (const file of targets) {
  const analysis = JSON.parse(readFileSync(file, "utf8")) as Analysis;
  regenerate(analysis);
  writeFileSync(file, `${JSON.stringify(analysis, null, 2)}\n`);
  console.log(`regenerated -> ${path.relative(root, file)}`);
}
