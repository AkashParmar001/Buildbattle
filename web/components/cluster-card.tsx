import Link from "next/link";

import type { InsightCluster } from "@/lib/analytics";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Sparkline } from "@/components/sparkline";
import { Card, CardContent } from "@/components/ui/card";

function SentimentBar({
  positive,
  neutral,
  negative,
}: {
  positive: number;
  neutral: number;
  negative: number;
}) {
  const total = positive + neutral + negative;
  const pct = (v: number) => (total === 0 ? 0 : (v / total) * 100);
  return (
    <div
      role="img"
      aria-label={`Sentiment: positive ${pct(positive).toFixed(1)} percent, neutral ${pct(neutral).toFixed(1)} percent, negative ${pct(negative).toFixed(1)} percent`}
      className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
    >
      <span style={{ width: `${pct(positive)}%` }} className="bg-emerald-500" />
      <span style={{ width: `${pct(neutral)}%` }} className="bg-zinc-400" />
      <span style={{ width: `${pct(negative)}%` }} className="bg-rose-500" />
    </div>
  );
}

export function ClusterCard({ cluster }: { cluster: InsightCluster }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">
              {cluster.label}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {cluster.volume.toLocaleString()} reports ·{" "}
              {(cluster.share * 100).toFixed(1)}% of volume ·{" "}
              {cluster.dominantCategory}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
            Priority {cluster.priority.toFixed(1)}
          </span>
        </div>

        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          {cluster.summary}
        </p>

        <div className="flex flex-col gap-1.5">
          <SentimentBar
            positive={cluster.sentiment.positive}
            neutral={cluster.sentiment.neutral}
            negative={cluster.sentiment.negative}
          />
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              {(cluster.negativity * 100).toFixed(0)}% negative
            </span>
            <span>{cluster.growth.toFixed(1)}x growth</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Sparkline
            data={cluster.weekly}
            label={`12-week trend for ${cluster.label}`}
          />
          <SimulatedBadge />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Example reviews
          </p>
          <ul className="flex flex-col gap-1.5">
            {cluster.examples.slice(0, 3).map((ex, i) => (
              <li
                key={i}
                className="rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
              >
                “{ex}”
              </li>
            ))}
          </ul>
        </div>

        <Link
          href={`/feedback?cluster=${cluster.id}`}
          className="text-sm font-medium text-accent hover:underline"
        >
          View all feedback in this cluster →
        </Link>
      </CardContent>
    </Card>
  );
}
