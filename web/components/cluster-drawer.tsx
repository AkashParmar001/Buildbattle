"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calculator, X } from "lucide-react";
import { useState } from "react";

import type { InsightCluster, Recommendation } from "@/lib/analytics";
import { categoryColor } from "@/lib/colors";
import { AnimatedNumber } from "@/components/animated-number";
import { useCloseOverlay } from "@/components/overlay-utils";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { TrackButton } from "@/components/track-button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Full cluster detail drawer — opened from the Issue map bubble or a deep
// link (?cluster=ID). Shares its layoutId with the bubble for the morph.
export function ClusterDrawer({
  cluster,
  recommendation,
  tracked,
  totals,
}: {
  cluster: InsightCluster;
  recommendation?: Recommendation;
  tracked: boolean;
  totals: { volume: number; negativeVolume: number };
}) {
  const close = useCloseOverlay();
  const [simOpen, setSimOpen] = useState(false);

  const clusterNegVolume = Math.round(cluster.negativity * cluster.volume);
  const newNeg = Math.max(0, totals.negativeVolume - clusterNegVolume);
  const newTotal = Math.max(0, totals.volume - cluster.volume);
  const oldPct =
    totals.volume === 0 ? 0 : (totals.negativeVolume / totals.volume) * 100;
  const newPct = newTotal === 0 ? 0 : (newNeg / newTotal) * 100;
  const deltaPp = oldPct - newPct;

  const sentimentRows = (
    [
      ["Negative", cluster.sentiment.negative, "bg-rose-500"],
      ["Neutral", cluster.sentiment.neutral, "bg-slate-400"],
      ["Positive", cluster.sentiment.positive, "bg-emerald-500"],
    ] as const
  ).map(([label, value, bar]) => ({
    label,
    value,
    bar,
    pct: cluster.volume === 0 ? 0 : (value / cluster.volume) * 100,
  }));

  return (
    <div
      className="fixed inset-0 z-40 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`Cluster details: ${cluster.label}`}
    >
      <button
        type="button"
        aria-label="Close cluster details"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-start gap-3 border-b border-border px-4 py-3 sm:px-6">
          <motion.div
            layoutId={`cluster-bubble-${cluster.id}`}
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2"
            style={{
              backgroundColor: `${categoryColor(cluster.dominantCategory)}26`,
              borderColor: categoryColor(cluster.dominantCategory),
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: categoryColor(cluster.dominantCategory),
              }}
            />
          </motion.div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">
              {cluster.label}
            </h2>
            <p className="text-xs tabular-nums text-muted-foreground">
              {cluster.volume.toLocaleString()} reports ·{" "}
              {(cluster.share * 100).toFixed(1)}% of volume ·{" "}
              {(cluster.negativity * 100).toFixed(0)}% negative ·{" "}
              {cluster.growth.toFixed(1)}x growth · {cluster.owner}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: categoryColor(cluster.dominantCategory),
                }}
              />
              Dominant category: {cluster.dominantCategory}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-5 pb-6">
            {/* Sentiment mix */}
            <Card>
              <CardContent>
                <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Sentiment mix
                </h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {sentimentRows.map((row) => (
                    <li key={row.label} className="flex items-center gap-2">
                      <span className="w-16 text-xs text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className={cn("block h-full rounded-full", row.bar)}
                          style={{ width: `${row.pct}%` }}
                        />
                      </span>
                      <span className="w-24 text-right text-xs tabular-nums text-muted-foreground">
                        {row.value.toLocaleString()} ({row.pct.toFixed(0)}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {recommendation && <ScoreBreakdown item={recommendation} />}

            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Recommendation
              </p>
              <p className="text-sm leading-6">{cluster.recommendation}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Why it matters
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {cluster.why}
              </p>
            </div>

            {/* Impact simulator */}
            <Card>
              <CardContent className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setSimOpen((v) => !v)}
                  aria-expanded={simOpen}
                  className="flex items-center gap-2 text-left"
                >
                  <Calculator className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold">
                    Estimate impact if this is resolved
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {simOpen ? "Hide" : "Show"}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {simOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-2 rounded-lg bg-muted p-3">
                        <p className="text-xs leading-5 text-muted-foreground">
                          Removing this cluster&apos;s{" "}
                          {clusterNegVolume.toLocaleString()} negative reports
                          from {totals.volume.toLocaleString()} total would move
                          overall negativity:
                        </p>
                        <p className="text-lg font-semibold tabular-nums">
                          <AnimatedNumber value={oldPct} decimals={1} suffix="%" />
                          <span className="mx-2 text-muted-foreground">→</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            <AnimatedNumber value={newPct} decimals={1} suffix="%" />
                          </span>
                          <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            (−{deltaPp.toFixed(1)} pp)
                          </span>
                        </p>
                        <p className="text-[11px] leading-4 text-muted-foreground">
                          Estimate only: assumes every negative report in this
                          cluster disappears and no new feedback replaces it.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Evidence */}
            <div>
              <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Evidence
              </p>
              <ul className="flex flex-col gap-1.5">
                {cluster.examples.slice(0, 4).map((ex, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground"
                  >
                    “{ex}”
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <TrackButton clusterId={cluster.id} initialTracked={tracked} />
              <a
                href={`/app?overlay=feedback&cluster=${cluster.id}`}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
              >
                All evidence in feedback →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
