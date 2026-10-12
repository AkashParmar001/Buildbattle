import Link from "next/link";

import type { Recommendation } from "@/lib/analytics";
import { priorityTextClass, priorityTier } from "@/lib/colors";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { TrackButton } from "@/components/track-button";

// "Fix this first" — the top-ranked recommendation with its numbers,
// why-it-matters and three evidence reviews. Lime edge marks the #1 issue
// (accent reserved for it).
export function DecisionBrief({
  item,
  tracked,
}: {
  item: Recommendation;
  tracked: boolean;
}) {
  return (
    <article className="flex flex-col gap-4 border border-rule border-l-2 border-l-accent bg-card/50 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center bg-accent px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] text-accent-foreground uppercase">
            Fix this first
          </span>
          <h2 className="mt-3 font-display text-2xl leading-tight tracking-tight sm:text-3xl">
            {item.label}
          </h2>
          <p className="mt-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
            Owner: {item.owner} · {item.volume.toLocaleString()} reports ·{" "}
            {(item.share * 100).toFixed(1)}% of volume ·{" "}
            {(item.negativity * 100).toFixed(0)}% negative ·{" "}
            {item.growth.toFixed(1)}x growth
          </p>
        </div>
        <span
          className={`shrink-0 font-display text-4xl leading-none tabular-nums ${priorityTextClass[priorityTier(item.priority)]}`}
        >
          {item.priority.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-rule pt-4">
        <p className="font-mono text-[11px] tracking-[0.18em] text-stone uppercase">
          Why this ranks #1
        </p>
        <p className="text-sm leading-6 text-muted-foreground">{item.why}</p>
      </div>

      <ScoreBreakdown item={item} />

      <div className="border-t border-rule pt-4">
        <p className="mb-1.5 font-mono text-[11px] tracking-[0.18em] text-stone uppercase">
          Evidence
        </p>
        <ul className="flex flex-col gap-1.5">
          {item.examples.slice(0, 3).map((ex, i) => (
            <li
              key={i}
              className="border-l border-rule pl-3 text-xs leading-5 text-muted-foreground italic"
            >
              “{ex}”
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
        <TrackButton clusterId={item.id} initialTracked={tracked} />
        <Link
          href={`/app?overlay=feedback&cluster=${item.id}`}
          className="inline-flex h-9 items-center border border-rule px-4 text-sm hover:bg-muted"
        >
          View evidence →
        </Link>
        <Link
          href={`?cluster=${item.id}`}
          className="inline-flex h-9 items-center px-3 text-sm underline-offset-4 hover:underline"
        >
          Open details
        </Link>
      </div>
    </article>
  );
}
