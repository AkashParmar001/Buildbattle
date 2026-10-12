import type { Recommendation } from "@/lib/analytics";

function TermBar({
  label,
  value,
  max,
  detail,
}: {
  label: string;
  value: number;
  max: number;
  detail: string;
}) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-muted-foreground">
          {label}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {detail}
        </span>
      </div>
      <div
        role="img"
        aria-label={`${label}: ${detail}`}
        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <span
          className="block h-full rounded-full bg-muted-foreground"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Visual explanation of priority = 100 * (volume + negativity + growth),
// ×1.25 when fraud-dominated, clamped to 0–100.
export function ScoreBreakdown({ item }: { item: Recommendation }) {
  const { breakdown } = item;
  const rawSum =
    breakdown.volumeTerm + breakdown.negativityTerm + breakdown.growthTerm;
  const boosted = rawSum * (item.fraudBoosted ? 1.25 : 1) * 100;
  const capped = boosted > 100;
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-muted p-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Why priority {item.priority.toFixed(1)}
      </p>
      <TermBar
        label="Volume (40%)"
        value={breakdown.volumeTerm}
        max={0.4}
        detail={`${item.volume.toLocaleString()} reports · ${(item.share * 100).toFixed(1)}% share`}
      />
      <TermBar
        label="Negativity (35%)"
        value={breakdown.negativityTerm}
        max={0.35}
        detail={`${(item.negativity * 100).toFixed(0)}% negative`}
      />
      <TermBar
        label="Growth (25%)"
        value={breakdown.growthTerm}
        max={0.25}
        detail={`${item.growth.toFixed(1)}x recent growth`}
      />
      {item.fraudBoosted ? (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
          ×1.25 fraud-severity multiplier applied ({boosted.toFixed(1)}
          {capped ? ` capped to ${item.priority.toFixed(1)}` : ""})
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          No fraud multiplier — dominant category is {item.dominantCategory}.
        </p>
      )}
    </div>
  );
}
