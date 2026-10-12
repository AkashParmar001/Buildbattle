"use client";

import { Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { FeedbackRecord, Sentiment } from "@/lib/db";
import { onFeedbackChanged } from "@/lib/feedback-refresh";
import type { FeedbackSort } from "@/lib/query-feedback";
import { AddFeedbackModal } from "@/components/add-feedback-modal";
import { CsvImport } from "@/components/csv-import";
import { EmptyState } from "@/components/empty-state";
import {
  FeedbackTable,
  type SortKey,
} from "@/components/feedback-table";
import { LoadSampleButton } from "@/components/load-sample-button";
import { useCloseOverlay } from "@/components/overlay-utils";

type QueryState = {
  rows: FeedbackRecord[];
  page: number;
  totalPages: number;
  totalRows: number;
  totalVolume: number;
  categories: string[];
};

const SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];
const SORTS: { value: FeedbackSort; label: string }[] = [
  { value: "volume_desc", label: "Volume (high → low)" },
  { value: "volume_asc", label: "Volume (low → high)" },
  { value: "text_asc", label: "Text (A → Z)" },
  { value: "text_desc", label: "Text (Z → A)" },
];

export function FeedbackDrawer({
  initialCluster,
}: {
  initialCluster?: number;
}) {
  const close = useCloseOverlay();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [sort, setSort] = useState<FeedbackSort>("volume_desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<QueryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const fetchRows = useCallback(async (): Promise<QueryState> => {
    const params = new URLSearchParams();
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    if (category) params.set("category", category);
    if (sentiment) params.set("sentiment", sentiment);
    if (initialCluster !== undefined)
      params.set("cluster", String(initialCluster));
    params.set("sort", sort);
    params.set("page", String(page));
    const res = await fetch(`/api/feedback?${params.toString()}`);
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(json.error ?? "Could not load feedback.");
    }
    return (await res.json()) as QueryState;
  }, [debouncedQ, category, sentiment, sort, page, initialCluster]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await fetchRows();
        if (!active) return;
        setData(result);
        setError(null);
      } catch (err) {
        if (active)
          setError(
            err instanceof Error ? err.message : "Could not load feedback.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchRows]);

  // Refetch after submits/imports/merges anywhere in the app (silent refresh).
  useEffect(
    () =>
      onFeedbackChanged(() => {
        fetchRows()
          .then((result) => {
            setData(result);
            setError(null);
          })
          .catch((err: unknown) =>
            setError(
              err instanceof Error ? err.message : "Could not load feedback.",
            ),
          );
      }),
    [fetchRows],
  );

  const onSort = (next: SortKey) => {
    setSort(next as FeedbackSort);
    setPage(1);
  };

  return (
    <div className="fixed inset-0 z-40 print:hidden" role="dialog" aria-modal="true" aria-label="Feedback browser">
      <button
        type="button"
        aria-label="Close feedback"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">
              Feedback
            </h2>
            <p className="text-xs tabular-nums text-muted-foreground">
              {data
                ? `${data.totalRows.toLocaleString()} texts · ${data.totalVolume.toLocaleString()} reports`
                : "Loading…"}
              {initialCluster !== undefined && data && " · cluster filter on"}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
          <AddFeedbackModal categories={data?.categories ?? []} />
          <CsvImport categories={data?.categories ?? []} />
          <LoadSampleButton />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search reviews or topics…"
              aria-label="Search feedback"
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by category"
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium"
          >
            <option value="">All categories</option>
            {(data?.categories ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sentiment}
            onChange={(e) => {
              setSentiment(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by sentiment"
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium"
          >
            <option value="">All sentiments</option>
            {SENTIMENTS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as FeedbackSort);
              setPage(1);
            }}
            aria-label="Sort feedback"
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {error ? (
            <EmptyState title="Could not load feedback" description={error} />
          ) : loading && !data ? (
            <div aria-busy="true" aria-label="Loading feedback" className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : data && data.rows.length === 0 ? (
            <EmptyState
              title="No feedback matches"
              description="Try a different search term, category, or sentiment filter."
            />
          ) : data ? (
            <FeedbackTable rows={data.rows} sort={sort} onSort={onSort} />
          ) : null}
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-6">
            <p className="text-xs tabular-nums text-muted-foreground">
              Page {data.page} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, data.page - 1))}
                disabled={data.page <= 1}
                className="h-9 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage(Math.min(data.totalPages, data.page + 1))}
                disabled={data.page >= data.totalPages}
                className="h-9 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
