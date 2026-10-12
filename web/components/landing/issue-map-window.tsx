"use client";

import { IssueMap } from "@/components/issue-map";
import { SectionLabel } from "@/components/section-label";
import type { InsightCluster } from "@/lib/analytics";

// Framed "live window" around the interactive issue map. Bubbles link into
// the app's cluster drawer (?cluster=ID on /app).
export function IssueMapWindow({ clusters }: { clusters: InsightCluster[] }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
      <SectionLabel index={4} label="Explore the map" className="mb-6" />
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="max-w-xl font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          Every circle is a theme, sized by how many customers hit it.
        </h2>
        <p className="font-mono text-xs text-stone">
          Click a circle to open its full evidence →
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-rule bg-[var(--charcoal)]">
        <div className="flex items-center gap-2 border-b border-rule px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rule" />
          <span className="h-2.5 w-2.5 rounded-full bg-rule" />
          <span className="h-2.5 w-2.5 rounded-full bg-rule" />
          <span className="ml-2 font-mono text-[11px] text-stone">
            issue map · live
          </span>
        </div>
        <div className="h-[380px] w-full sm:h-[460px]">
          <IssueMap clusters={clusters} />
        </div>
      </div>
    </section>
  );
}
