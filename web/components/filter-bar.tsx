"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { Sentiment } from "@/lib/db";

const SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];

type FilterBarProps = {
  categories: string[];
  current: { category?: string; sentiment?: Sentiment };
};

function updateQuery(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
): string {
  const next = new URLSearchParams(params.toString());
  if (value) next.set(key, value);
  else next.delete(key);
  const query = next.toString();
  return query ? `?${query}` : "?";
}

export function FilterBar({ categories, current }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="filter-category">
        Filter by category
      </label>
      <select
        id="filter-category"
        value={current.category ?? ""}
        onChange={(e) =>
          router.replace(
            `${pathname}${updateQuery(searchParams, "category", e.target.value || undefined)}`,
            { scroll: false },
          )
        }
        className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="filter-sentiment">
        Filter by sentiment
      </label>
      <select
        id="filter-sentiment"
        value={current.sentiment ?? ""}
        onChange={(e) =>
          router.replace(
            `${pathname}${updateQuery(searchParams, "sentiment", e.target.value || undefined)}`,
            { scroll: false },
          )
        }
        className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
      >
        <option value="">All sentiments</option>
        {SENTIMENTS.map((s) => (
          <option key={s} value={s}>
            {s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      {(current.category ?? current.sentiment) && (
        <button
          type="button"
          onClick={() => router.replace(pathname, { scroll: false })}
          className="h-9 rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent/10"
        >
          Reset
        </button>
      )}
    </div>
  );
}
