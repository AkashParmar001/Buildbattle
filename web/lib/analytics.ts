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
  const hasFilters = Boolean(
    filters.category || filters.sentiment || filters.cluster !== undefined,
  );
  if (hasFilters) {
    // Filtered mode: derive top priority from the same recomputed cluster
    // metrics the Issue map and Priority queue use, so every number agrees.
    const cards = await getInsightClusters(filters);
    const top = cards[0] ?? null;
    const rows = applyFilters(feedback, filters);
    const totalVolume = rows.reduce((sum, r) => sum + r.count, 0);
    const negVolume = rows
      .filter((r) => r.sentiment === "negative")
      .reduce((sum, r) => sum + r.count, 0);
    return {
      totalVolume,
      uniqueTexts: rows.length,
      pctNegative: totalVolume === 0 ? 0 : negVolume / totalVolume,
      topPriority: top
        ? { id: top.id, label: top.label, priority: top.priority }
        : null,
    };
  }
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
export type Trend = {
  /** Seed volume across the 12-week simulated demo timeline. */
  simulated: TrendPoint[];
  /** User-submitted/imported volume bucketed by real created_at (last 12 weeks). */
  live: TrendPoint[];
};

const LIVE_WEEKS = 12;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Older stored reports saved trend as a bare array (simulated only).
export function normalizeTrend(raw: Trend | TrendPoint[]): Trend {
  return Array.isArray(raw) ? { simulated: raw, live: [] } : raw;
}

export const getTrend = cache(
  async (filters: AnalyticsFilters = {}): Promise<Trend> => {
    const { feedback } = await loadRows();
    const rows = applyFilters(feedback, filters);
    if (rows.length === 0) return { simulated: [], live: [] };

    const simRows = rows.filter((r) => r.simulated);
    const simulated =
      simRows.length === 0 ? [] : sumWeekly(simRows).map((volume, i) => ({ week: i + 1, volume }));

    // Live series: real submission timestamps, bucketed into the last 12
    // calendar weeks ending with the current week (week 12 = most recent).
    const now = Date.now();
    const buckets = new Array<number>(LIVE_WEEKS).fill(0);
    for (const r of rows) {
      if (r.simulated) continue;
      const t = r.createdAt ? Date.parse(r.createdAt) : now;
      const ageWeeks = Math.floor(Math.max(0, now - t) / WEEK_MS);
      const idx = Math.max(0, LIVE_WEEKS - 1 - ageWeeks);
      buckets[idx] += r.count;
    }
    const live = buckets.map((volume, i) => ({ week: i + 1, volume }));
    return { simulated, live };
  },
);

export const getCategories = cache(async (): Promise<string[]> => {
  const { feedback } = await loadRows();
  return [...new Set(feedback.map((r) => r.category))].sort();
});

export type InsightCluster = ClusterRecord & {
  sentiment: { positive: number; neutral: number; negative: number };
  dominantCategory: string;
};

// Full cluster cards: stored aggregates plus a sentiment breakdown and the
// dominant category recomputed from the underlying rows (works with the
// Supabase schema, which stores no per-category counts on clusters).
// With filters, volume/share/negativity/priority are recomputed from the
// filtered rows so the whole Command Center agrees; unfiltered returns the
// stored seed aggregates unchanged.
export const getInsightClusters = cache(
  async (filters: AnalyticsFilters = {}): Promise<InsightCluster[]> => {
    const { feedback, clusters } = await loadRows();
    const hasFilters = Boolean(
      filters.category || filters.sentiment || filters.cluster !== undefined,
    );
    const rows = hasFilters ? applyFilters(feedback, filters) : feedback;
    const byCluster = new Map<number, FeedbackRecord[]>();
    for (const r of rows) {
      const list = byCluster.get(r.cluster) ?? [];
      list.push(r);
      byCluster.set(r.cluster, list);
    }
    const filteredTotal = rows.reduce((sum, r) => sum + r.count, 0);
    const cards = clusters
      .filter((c) => !hasFilters || byCluster.has(c.id))
      .map((c) => {
        const list = byCluster.get(c.id) ?? [];
        const sentiment = {
          positive: list
            .filter((r) => r.sentiment === "positive")
            .reduce((s, r) => s + r.count, 0),
          neutral: list
            .filter((r) => r.sentiment === "neutral")
            .reduce((s, r) => s + r.count, 0),
          negative: list
            .filter((r) => r.sentiment === "negative")
            .reduce((s, r) => s + r.count, 0),
        };
        const catVolume = new Map<string, number>();
        for (const r of list) {
          catVolume.set(r.category, (catVolume.get(r.category) ?? 0) + r.count);
        }
        const dominantCategory =
          [...catVolume.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
        if (!hasFilters) return { ...c, sentiment, dominantCategory };
        const volume = list.reduce((s, r) => s + r.count, 0);
        return {
          ...c,
          volume,
          share: filteredTotal === 0 ? 0 : volume / filteredTotal,
          negativity: volume === 0 ? 0 : sentiment.negative / volume,
          sentiment,
          dominantCategory,
        };
      });
    if (!hasFilters) {
      return cards.sort((a, b) => b.priority - a.priority);
    }
    // Volume share (40%), negativity (35%), growth (25%); fraud themes
    // weighted ×1.25, then clamped to 0–100.
    const maxShare = Math.max(...cards.map((c) => c.share), 0);
    const maxGrowth = Math.max(...cards.map((c) => c.growth), 0);
    return cards
      .map((c) => {
        const raw =
          0.4 * (maxShare === 0 ? 0 : c.share / maxShare) +
          0.35 * c.negativity +
          0.25 * (maxGrowth === 0 ? 0 : Math.min(c.growth / maxGrowth, 1));
        const boosted =
          100 * raw * (c.dominantCategory === "Fraud and Scam" ? 1.25 : 1);
        return {
          ...c,
          priority: Math.min(100, Math.max(0, boosted)),
        };
      })
      .sort((a, b) => b.priority - a.priority);
  },
);

export type Recommendation = ClusterRecord & {
  dominantCategory: string;
  fraudBoosted: boolean;
  breakdown: { volumeTerm: number; negativityTerm: number; growthTerm: number };
  maxShare: number;
  maxGrowth: number;
};

// Ranked recommendations with the priority score broken into the exact
// formula terms so the ranking is explainable:
// 0.4*share/maxShare + 0.35*negativity + 0.25*min(growth/maxGrowth,1),
// x1.25 when fraud-dominated.
export const getRecommendations = cache(
  async (filters: AnalyticsFilters = {}): Promise<Recommendation[]> => {
    const cards = await getInsightClusters(filters);
    const maxShare = Math.max(...cards.map((c) => c.share), 0);
    const maxGrowth = Math.max(...cards.map((c) => c.growth), 0);
    return cards.map((c) => {
      const fraudBoosted = c.dominantCategory === "Fraud and Scam";
      return {
        ...c,
        dominantCategory: c.dominantCategory,
        fraudBoosted,
        breakdown: {
          volumeTerm: maxShare === 0 ? 0 : 0.4 * (c.share / maxShare),
          negativityTerm: 0.35 * c.negativity,
          growthTerm:
            maxGrowth === 0 ? 0 : 0.25 * Math.min(c.growth / maxGrowth, 1),
        },
        maxShare,
        maxGrowth,
      };
    });
  },
);
