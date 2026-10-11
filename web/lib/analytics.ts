import { cache } from "react";

import {
  getClusterRows,
  getFeedbackRows,
  type AnalyticsFilters,
  type ClusterRecord,
  type FeedbackRecord,
} from "@/lib/db";

// Every metric weights by `count` (duplicate volume), never by row.
// Heavy aggregations are memoised per request via `cache`.

export function applyFilters(
  rows: FeedbackRecord[],
  filters: AnalyticsFilters,
): FeedbackRecord[] {
  return rows.filter(
    (r) =>
      (!filters.category || r.category === filters.category) &&
      (!filters.sentiment || r.sentiment === filters.sentiment) &&
      (filters.cluster === undefined || r.cluster === filters.cluster),
  );
}

const loadRows = cache(async () => {
  const { getOverlayRows } = await import("@/lib/feedback-store");
  const [feedback, clusters, overlay] = await Promise.all([
    getFeedbackRows(),
    getClusterRows(),
    getOverlayRows(),
  ]);
  return { feedback: [...feedback, ...overlay], clusters };
});

export type Kpis = {
  totalVolume: number;
  uniqueTexts: number;
  pctNegative: number;
  topPriority: { id: number; label: string; priority: number } | null;
};

export const getKpis = cache(async (filters: AnalyticsFilters = {}): Promise<Kpis> => {
  const { feedback, clusters } = await loadRows();
  const rows = applyFilters(feedback, filters);
  const totalVolume = rows.reduce((sum, r) => sum + r.count, 0);
  const negVolume = rows
    .filter((r) => r.sentiment === "negative")
    .reduce((sum, r) => sum + r.count, 0);
  const present = new Set(rows.map((r) => r.cluster));
  const top =
    clusters
      .filter((c) => present.has(c.id))
      .sort((a, b) => b.priority - a.priority)[0] ?? null;

  return {
    totalVolume,
    uniqueTexts: rows.length,
    pctNegative: totalVolume === 0 ? 0 : negVolume / totalVolume,
    topPriority: top
      ? { id: top.id, label: top.label, priority: top.priority }
      : null,
  };
});

export type SentimentSlice = {
  sentiment: "positive" | "neutral" | "negative";
  volume: number;
  share: number;
};

export const getSentimentDistribution = cache(
  async (filters: AnalyticsFilters = {}): Promise<SentimentSlice[]> => {
    const { feedback } = await loadRows();
    const rows = applyFilters(feedback, filters);
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    return (["positive", "neutral", "negative"] as const).map((sentiment) => {
      const volume = rows
        .filter((r) => r.sentiment === sentiment)
        .reduce((sum, r) => sum + r.count, 0);
      return {
        sentiment,
        volume,
        share: total === 0 ? 0 : volume / total,
      };
    });
  },
);

export type TopIssue = Pick<
  ClusterRecord,
  | "id"
  | "label"
  | "volume"
  | "share"
  | "negativity"
  | "growth"
  | "priority"
  | "recommendation"
  | "owner"
>;

function sumWeekly(rows: FeedbackRecord[]): number[] {
  // Row weekly arrays already encode volume (they sum to `count`),
  // so they add up directly — no extra weighting.
  const weeks = rows[0]?.weekly.length ?? 12;
  const totals = new Array<number>(weeks).fill(0);
  for (const r of rows) {
    r.weekly.forEach((v, i) => {
      totals[i] += v;
    });
  }
  return totals;
}

export function growthOf(weeklyTotals: number[]): number {
  const first = weeklyTotals.slice(0, 4).reduce((a, b) => a + b, 0);
  const last = weeklyTotals.slice(-4).reduce((a, b) => a + b, 0);
  return (last + 1) / (first + 1);
}

export const getTopIssues = cache(
  async (
    filters: AnalyticsFilters = {},
    limit = 5,
  ): Promise<TopIssue[]> => {
    const { feedback, clusters } = await loadRows();
    const rows = applyFilters(feedback, filters);
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    const byCluster = new Map<number, FeedbackRecord[]>();
    for (const r of rows) {
      const list = byCluster.get(r.cluster) ?? [];
      list.push(r);
      byCluster.set(r.cluster, list);
    }
    const meta = new Map(clusters.map((c) => [c.id, c]));
    return [...byCluster.entries()]
      .map(([id, list]) => {
        const stored = meta.get(id);
        const volume = list.reduce((sum, r) => sum + r.count, 0);
        const neg = list
          .filter((r) => r.sentiment === "negative")
          .reduce((sum, r) => sum + r.count, 0);
        return {
          id,
          label: stored?.label ?? (id === -1 ? "Unclustered" : `Cluster ${id}`),
          volume,
          share: total === 0 ? 0 : volume / total,
          negativity: volume === 0 ? 0 : neg / volume,
          growth: growthOf(sumWeekly(list)),
          priority: stored?.priority ?? 0,
          recommendation: stored?.recommendation ?? "",
          owner: stored?.owner ?? "",
        } satisfies TopIssue;
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  },
);

export type TrendPoint = { week: number; volume: number };
export const getTrend = cache(
  async (filters: AnalyticsFilters = {}): Promise<TrendPoint[]> => {
    const { feedback } = await loadRows();
    const rows = applyFilters(feedback, filters);
    if (rows.length === 0) return [];
    return sumWeekly(rows).map((volume, i) => ({ week: i + 1, volume }));
  },
);

export const getCategories = cache(async (): Promise<string[]> => {
  const { feedback } = await loadRows();
  return [...new Set(feedback.map((r) => r.category))].sort();
});
