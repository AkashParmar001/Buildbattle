"use client";

import dynamic from "next/dynamic";

import type { SentimentSlice } from "@/lib/analytics";
import type { GalaxyCluster } from "@/components/landing/galaxy";

const Galaxy = dynamic(
  () => import("@/components/landing/galaxy").then((m) => m.Galaxy),
  { ssr: false },
);

// Client boundary that lazy-loads the canvas galaxy (ssr:false is only
// allowed from client components in the App Router).
export function HeroGalaxy(props: {
  clusters: GalaxyCluster[];
  sentimentMix: SentimentSlice[];
}) {
  return <Galaxy {...props} />;
}
