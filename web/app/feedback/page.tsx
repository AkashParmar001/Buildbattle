import Link from "next/link";

import { getCategories } from "@/lib/analytics";
import type { Sentiment } from "@/lib/db";
import { getClusterRows, getFeedbackRows } from "@/lib/db";
import { getOverlayRows } from "@/lib/feedback-store";
import { AddFeedbackModal } from "@/components/add-feedback-modal";
import { CsvImport } from "@/components/csv-import";
import { EmptyState } from "@/components/empty-state";
import { FeedbackSearch } from "@/components/feedback-search";
import { FeedbackTable, type SortKey } from "@/components/feedback-table";
import { FilterBar } from "@/components/filter-bar";
import { LoadSampleButton } from "@/components/load-sample-button";

const PAGE_SIZE = 15;
const VALID_SORTS: SortKey[] = [
  "volume_desc",
  "volume_asc",
  "text_asc",
  "text_desc",
];
const VALID_SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];

function pageHref(params: URLSearchParams, page: number): string {
  const next = new URLSearchParams(params.toString());
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  const query = next.toString();
  return `/feedback${query ? `?${query}` : ""}`;
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sentiment?: string;
    cluster?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const categories = await getCategories();
  const clusters = await getClusterRows();
  const q = params.q?.trim() ?? "";
  const category =
    params.category && categories.includes(params.category)
      ? params.category
      : undefined;
  const sentiment =
    params.sentiment && VALID_SENTIMENTS.includes(params.sentiment as Sentiment)
      ? (params.sentiment as Sentiment)
      : undefined;
  const sort: SortKey =
    params.sort && VALID_SORTS.includes(params.sort as SortKey)
      ? (params.sort as SortKey)
      : "volume_desc";
  const clusterParam =
    params.cluster !== undefined && params.cluster !== ""
      ? Number(params.cluster)
      : undefined;
  const cluster =
    clusterParam !== undefined && Number.isInteger(clusterParam)
      ? clusterParam
      : undefined;
  const clusterLabel =
    cluster !== undefined
      ? (clusters.find((c) => c.id === cluster)?.label ?? (cluster === -1 ? "Unclustered" : `Cluster ${cluster}`))
      : undefined;

  const [base, overlay] = await Promise.all([
    getFeedbackRows(),
    getOverlayRows(),
  ]);
  const all = [...overlay, ...base];

  const qLow = q.toLowerCase();
  const filtered = all.filter(
    (r) =>
      (!category || r.category === category) &&
      (!sentiment || r.sentiment === sentiment) &&
      (cluster === undefined || r.cluster === cluster) &&
      (!qLow ||
        r.text.toLowerCase().includes(qLow) ||
        r.topic.toLowerCase().includes(qLow)),
  );
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "volume_asc":
        return a.count - b.count;
      case "text_asc":
        return a.text.localeCompare(b.text);
      case "text_desc":
        return b.text.localeCompare(a.text);
      case "volume_desc":
      default:
        return b.count - a.count;
    }
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(
    Math.max(1, Number(params.page) || 1),
    totalPages,
  );
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalVolume = filtered.reduce((sum, r) => sum + r.count, 0);

  const current = new URLSearchParams();
  if (q) current.set("q", q);
  if (category) current.set("category", category);
  if (sentiment) current.set("sentiment", sentiment);
  if (cluster !== undefined) current.set("cluster", String(cluster));
  if (sort !== "volume_desc") current.set("sort", sort);
  const baseQuery = current.toString();

  const clearCluster = new URLSearchParams(current.toString());
  clearCluster.delete("cluster");
  clearCluster.delete("page");
  const clearClusterHref = `/feedback${clearCluster.toString() ? `?${clearCluster.toString()}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Feedback</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {sorted.length.toLocaleString()} texts ·{" "}
            {totalVolume.toLocaleString()} reports
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LoadSampleButton />
          <CsvImport categories={categories} />
          <AddFeedbackModal categories={categories} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FeedbackSearch key={q} current={q} />
        <FilterBar
          categories={categories}
          current={{ category, sentiment }}
        />
        {cluster !== undefined && (
          <Link
            href={clearClusterHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent/10 px-3 text-xs font-medium text-accent hover:bg-accent/20"
          >
            Cluster: {clusterLabel} ✕
          </Link>
        )}
      </div>

      {pageRows.length === 0 ? (
        <EmptyState
          title={all.length === 0 ? "No feedback yet" : "No feedback matches"}
          description={
            all.length === 0
              ? "Add the first review or import a CSV to get started."
              : "Try a different search or reset the filters."
          }
        />
      ) : (
        <>
          <FeedbackTable rows={pageRows} baseQuery={baseQuery} sort={sort} />
          <div className="flex items-center justify-between text-sm">
            <p className="text-zinc-500 dark:text-zinc-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={pageHref(current, page - 1)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-lg border border-zinc-100 px-3 py-1.5 text-zinc-300 dark:border-zinc-900 dark:text-zinc-700">
                  Previous
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={pageHref(current, page + 1)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-lg border border-zinc-100 px-3 py-1.5 text-zinc-300 dark:border-zinc-900 dark:text-zinc-700">
                  Next
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
