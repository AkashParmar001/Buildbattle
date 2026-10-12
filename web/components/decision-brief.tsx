import Link from "next/link";

import type { Recommendation } from "@/lib/analytics";
import { priorityTextClass, priorityTier } from "@/lib/colors";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { TrackButton } from "@/components/track-button";
import { Card, CardContent } from "@/components/ui/card";

// "Fix this first" — the top-ranked recommendation with its numbers,
// why-it-matters and three evidence reviews, all citable in a demo.
export function DecisionBrief({
  item,
  tracked,
}: {
  item: Recommendation;
  tracked: boolean;
}) {
  return (
    <Card className="border-accent/40">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              Fix this first
            </span>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              {item.label}
            </h2>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              Owner: {item.owner} · {item.volume.toLocaleString()} reports ·{" "}
              {(item.share * 100).toFixed(1)}% of volume ·{" "}
              {(item.negativity * 100).toFixed(0)}% negative ·{" "}
              {item.growth.toFixed(1)}x growth
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full bg-muted px-3 py-1.5 text-lg font-bold tabular-nums ${priorityTextClass[priorityTier(item.priority)]}`}
          >
            {item.priority.toFixed(1)}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Why this ranks #1
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{item.why}</p>
        </div>

        <ScoreBreakdown item={item} />

        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Evidence
          </p>
          <ul className="flex flex-col gap-1.5">
            {item.examples.slice(0, 3).map((ex, i) => (
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
          <TrackButton clusterId={item.id} initialTracked={tracked} />
          <Link
            href={`/app?overlay=feedback&cluster=${item.id}`}
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
          >
            View evidence →
          </Link>
          <Link
            href={`?cluster=${item.id}`}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent/10"
          >
            Open details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
