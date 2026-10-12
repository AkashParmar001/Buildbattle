"use client";

import { useSearchParams } from "next/navigation";

import { FeedbackDrawer } from "@/components/feedback-drawer";
import { HoodModal } from "@/components/hood-modal";
import { IssuesPanel } from "@/components/issues-panel";

// Renders whichever overlay the `overlay` URL param selects. Suspense-wrapped
// in the shell layout because useSearchParams suspends during prerender.
export function OverlayHost() {
  const searchParams = useSearchParams();
  const overlay = searchParams.get("overlay");
  const clusterRaw = searchParams.get("cluster");
  const cluster =
    clusterRaw !== null && Number.isInteger(Number(clusterRaw))
      ? Number(clusterRaw)
      : undefined;

  if (overlay === "feedback") return <FeedbackDrawer initialCluster={cluster} />;
  if (overlay === "issues") return <IssuesPanel />;
  if (overlay === "hood") return <HoodModal />;
  return null;
}
