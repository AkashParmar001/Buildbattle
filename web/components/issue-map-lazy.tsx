"use client";

import dynamic from "next/dynamic";

import type { InsightCluster } from "@/lib/analytics";

const IssueMapInner = dynamic(
  () => import("@/components/issue-map").then((m) => m.IssueMap),
  { ssr: false },
);

// Lazy client boundary: the d3-force map only loads on the client, so the
// Command Center shell paints immediately and bubbles never stack at 0,0.
export function IssueMap(props: { clusters: InsightCluster[] }) {
  return <IssueMapInner {...props} />;
}
