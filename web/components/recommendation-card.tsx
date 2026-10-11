import Link from "next/link";

import type { Recommendation } from "@/lib/analytics";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { TrackButton } from "@/components/track-button";
import { Card, CardContent } from "@/components/ui/card";

export function RecommendationCard({
  item,
  rank,
  tracked,
}: {
  item: Recommendation;
  rank: number;
  tracked: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">
              #{rank} priority
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
              {item.label}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Owner: {item.owner} · {item.volume.toLocaleString()} reports ·{" "}
              {(item.share * 100).toFixed(1)}% of volume ·{" "}
              {(item.negativity * 100).toFixed(0)}% negative ·{" "}
              {item.growth.toFixed(1)}x growth
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
            {item.priority.toFixed(1)}
          </span>
        </div>

        <ScoreBreakdown item={item} />

        <div className="flex flex-col gap-1.5">
          <div>
            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Recommendation
            </p>
            <p className="mt-0.5 text-sm leading-6">{item.recommendation}</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
              Why this matters
            </p>
            <p className="mt-0.5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {item.why}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Evidence
          </p>
          <ul className="flex flex-col gap-1.5">
            {item.examples.slice(0, 3).map((ex, i) => (
              <li
                key={i}
                className="rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
              >
                “{ex}”
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TrackButton clusterId={item.id} initialTracked={tracked} />
          <Link
            href={`/feedback?cluster=${item.id}`}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent/10"
          >
            View evidence in feedback →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
