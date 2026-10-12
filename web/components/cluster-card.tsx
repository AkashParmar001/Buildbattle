import Link from "next/link";

import type { InsightCluster } from "@/lib/analytics";
import {
  categoryColor,
  priorityTextClass,
  priorityTier,
  sentimentColors,
} from "@/lib/colors";
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
      className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
    >
      <span
        style={{ width: `${pct(positive)}%`, backgroundColor: sentimentColors.positive }}
      />
      <span
        style={{ width: `${pct(neutral)}%`, backgroundColor: sentimentColors.neutral }}
      />
      <span
        style={{ width: `${pct(negative)}%`, backgroundColor: sentimentColors.negative }}
      />
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
            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
              {cluster.volume.toLocaleString()} reports ·{" "}
              {(cluster.share * 100).toFixed(1)}% of volume ·{" "}
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: categoryColor(cluster.dominantCategory),
                  }}
                />
                {cluster.dominantCategory}
              </span>
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tabular-nums ${priorityTextClass[priorityTier(cluster.priority)]}`}
          >
            Priority {cluster.priority.toFixed(1)}
          </span>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          {cluster.summary}
        </p>

        <div className="flex flex-col gap-1.5">
          <SentimentBar
            positive={cluster.sentiment.positive}
            neutral={cluster.sentiment.neutral}
            negative={cluster.sentiment.negative}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
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
          <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Example reviews
          </p>
          <ul className="flex flex-col gap-1.5">
            {cluster.examples.slice(0, 3).map((ex, i) => (
              <li
                key={i}
                className="rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground"
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
