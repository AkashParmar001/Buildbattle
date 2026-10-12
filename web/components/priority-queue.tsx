"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import type { Recommendation } from "@/lib/analytics";
import { priorityTextClass, priorityTier } from "@/lib/colors";
import { fadeUp } from "@/lib/motion";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { TrackButton } from "@/components/track-button";
import { Card, CardContent } from "@/components/ui/card";

// Ranked queue with framer `layout` so filter changes reorder cards with a
// short spring instead of a hard remount.
export function PriorityQueue({
  items,
  trackedIds,
}: {
  items: Recommendation[];
  trackedIds: Set<number>;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">
          No recommendations match these filters.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <motion.div key={item.id} layout transition={{ duration: 0.35 }}>
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Card>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold tabular-nums text-muted-foreground"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight">
                        {item.label}
                      </h3>
                      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                        {item.volume.toLocaleString()} reports ·{" "}
                        {(item.share * 100).toFixed(1)}% share ·{" "}
                        {(item.negativity * 100).toFixed(0)}% negative ·{" "}
                        {item.growth.toFixed(1)}x growth · {item.owner}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full bg-muted px-3 py-1 text-sm font-bold tabular-nums ${priorityTextClass[priorityTier(item.priority)]}`}
                  >
                    {item.priority.toFixed(1)}
                  </span>
                </div>

                <p className="text-sm leading-6">{item.recommendation}</p>

                <ScoreBreakdown item={item} />

                <div className="flex flex-wrap items-center gap-2">
                  <TrackButton
                    clusterId={item.id}
                    initialTracked={trackedIds.has(item.id)}
                  />
                  <Link
                    href={`/app?overlay=feedback&cluster=${item.id}`}
                    className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent/10"
                  >
                    Evidence ({item.examples.length}) →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
