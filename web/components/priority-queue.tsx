"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import type { Recommendation } from "@/lib/analytics";
import { priorityTextClass, priorityTier } from "@/lib/colors";
import { fadeUp } from "@/lib/motion";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { TrackButton } from "@/components/track-button";

// Ranked queue as editorial hairline rows (no cards). framer `layout`
// reorders with a short spring when filters change. Lime marks only #1.
export function PriorityQueue({
  items,
  trackedIds,
}: {
  items: Recommendation[];
  trackedIds: Set<number>;
}) {
  if (items.length === 0) {
    return (
      <p className="border-t border-rule py-8 text-center text-sm text-muted-foreground">
        No recommendations match these filters.
      </p>
    );
  }
  return (
    <ol className="flex flex-col">
      {items.map((item, i) => {
        const isFirst = i === 0;
        return (
          <motion.li
            key={item.id}
            layout
            transition={{ duration: 0.35 }}
            className={`flex flex-col gap-4 border-t border-rule py-6 ${
              isFirst ? "border-l-2 border-l-accent pl-4" : "pl-0"
            }`}
          >
            <motion.div variants={fadeUp} initial="hidden" animate="show">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-4">
                  <span
                    aria-hidden="true"
                    className={`shrink-0 font-display text-2xl leading-none tabular-nums ${
                      isFirst ? "text-accent" : "text-stone"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg leading-snug tracking-tight sm:text-xl">
                      {item.label}
                    </h3>
                    <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {item.volume.toLocaleString()} reports ·{" "}
                      {(item.share * 100).toFixed(1)}% share ·{" "}
                      {(item.negativity * 100).toFixed(0)}% negative ·{" "}
                      {item.growth.toFixed(1)}x growth · {item.owner}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 font-display text-2xl leading-none tabular-nums ${priorityTextClass[priorityTier(item.priority)]}`}
                >
                  {item.priority.toFixed(1)}
                </span>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6">
                {item.recommendation}
              </p>

              <ScoreBreakdown item={item} />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <TrackButton
                  clusterId={item.id}
                  initialTracked={trackedIds.has(item.id)}
                />
                <Link
                  href={`/app?overlay=feedback&cluster=${item.id}`}
                  className="inline-flex h-9 items-center border border-rule px-3 text-sm hover:bg-muted"
                >
                  Evidence ({item.examples.length}) →
                </Link>
              </div>
            </motion.div>
          </motion.li>
        );
      })}
    </ol>
  );
}
