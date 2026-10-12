import { ArrowDown, ArrowUp } from "lucide-react";

import type { FeedbackRecord } from "@/lib/db";
import { categoryColor, sentimentBadgeClass } from "@/lib/colors";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SortKey = "volume_desc" | "volume_asc" | "text_asc" | "text_desc";

function nextSort(current: SortKey, target: "volume" | "text"): SortKey {
  if (target === "volume") {
    return current === "volume_desc" ? "volume_asc" : "volume_desc";
  }
  return current === "text_asc" ? "text_desc" : "text_asc";
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return null;
  return dir === "asc" ? (
    <ArrowUp className="inline h-3 w-3" />
  ) : (
    <ArrowDown className="inline h-3 w-3" />
  );
}

function SortHeader({
  label,
  target,
  sort,
  onSort,
}: {
  label: string;
  target: "volume" | "text";
  sort: SortKey;
  onSort: (next: SortKey) => void;
}) {
  const active = sort.startsWith(target);
  return (
    <button
      type="button"
      onClick={() => onSort(nextSort(sort, target))}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      <SortIcon
        active={active}
        dir={sort === `${target}_asc` ? "asc" : "desc"}
      />
    </button>
  );
}

export function FeedbackTable({
  rows,
  sort,
  onSort,
}: {
  rows: FeedbackRecord[];
  sort: SortKey;
  onSort: (next: SortKey) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase">
              <th scope="col" className="px-4 py-3 font-medium">
                <SortHeader label="Review" target="text" sort={sort} onSort={onSort} />
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Category
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Sentiment
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Topic
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                <SortHeader
                  label="Volume"
                  target="volume"
                  sort={sort}
                  onSort={onSort}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border last:border-0"
              >
                <td className="max-w-md px-4 py-3 leading-6">{r.text}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: categoryColor(r.category),
                      }}
                    />
                    {r.category}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                      sentimentBadgeClass[r.sentiment],
                    )}
                  >
                    {r.sentiment}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {r.topic}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.count.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
