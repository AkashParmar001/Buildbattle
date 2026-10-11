import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import type { FeedbackRecord } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SortKey = "volume_desc" | "volume_asc" | "text_asc" | "text_desc";

const SENTIMENT_STYLE: Record<FeedbackRecord["sentiment"], string> = {
  positive:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  neutral: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  negative: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

function sortHref(
  base: string,
  target: "volume" | "text",
  current: SortKey,
): string {
  const next: SortKey =
    target === "volume"
      ? current === "volume_desc"
        ? "volume_asc"
        : "volume_desc"
      : current === "text_asc"
        ? "text_desc"
        : "text_asc";
  const params = new URLSearchParams(base);
  params.set("sort", next);
  params.delete("page");
  const query = params.toString();
  return query ? `?${query}` : "?";
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return null;
  return dir === "asc" ? (
    <ArrowUp className="inline h-3 w-3" />
  ) : (
    <ArrowDown className="inline h-3 w-3" />
  );
}

export function FeedbackTable({
  rows,
  baseQuery,
  sort,
}: {
  rows: FeedbackRecord[];
  baseQuery: string;
  sort: SortKey;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs text-zinc-500 uppercase dark:border-zinc-800 dark:text-zinc-400">
              <th scope="col" className="px-4 py-3 font-medium">
                <Link
                  href={`/feedback${sortHref(baseQuery, "text", sort)}`}
                  className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Review <SortIcon active={sort.startsWith("text")} dir={sort === "text_asc" ? "asc" : "desc"} />
                </Link>
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
                <Link
                  href={`/feedback${sortHref(baseQuery, "volume", sort)}`}
                  className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Volume <SortIcon active={sort.startsWith("volume")} dir={sort === "volume_asc" ? "asc" : "desc"} />
                </Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
              >
                <td className="max-w-md px-4 py-3 leading-6">{r.text}</td>
                <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                  {r.category}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                      SENTIMENT_STYLE[r.sentiment],
                    )}
                  >
                    {r.sentiment}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
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
