import Link from "next/link";

import type { InsightCluster } from "@/lib/analytics";
import { categoryColor, priorityTextClass, priorityTier } from "@/lib/colors";
import { Card, CardContent } from "@/components/ui/card";

// Phase A placeholder: legend chips sized by volume with category colors.
// The interactive force-directed bubble map lands in Phase D.
export function IssueMap({
  clusters,
  selectedId,
}: {
  clusters: InsightCluster[];
  selectedId?: number;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Issue map
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              One chip per cluster — color = dominant category, weight = volume
              share. Click to open its evidence.
            </p>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            {clusters.length} clusters
          </span>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {clusters.map((c) => (
            <li key={c.id}>
              <Link
                href={`/app?overlay=feedback&cluster=${c.id}`}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-muted ${
                  selectedId === c.id
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-card"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: categoryColor(c.dominantCategory) }}
                />
                <span className="max-w-48 truncate">{c.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {c.volume.toLocaleString()}
                </span>
                <span
                  className={`tabular-nums font-semibold ${priorityTextClass[priorityTier(c.priority)]}`}
                >
                  {c.priority.toFixed(0)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Interactive bubble view (size by volume, pulse by priority) ships in
          the next phase.
        </p>
      </CardContent>
    </Card>
  );
}
