import { Flame, Inbox, Meh, Tags } from "lucide-react";

import {
  getCategories,
  getKpis,
  getSentimentDistribution,
  getTopIssues,
  getTrend,
} from "@/lib/analytics";
import type { Sentiment } from "@/lib/db";
import { EmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filter-bar";
import { KpiCard } from "@/components/kpi-card";
import { ReportButton } from "@/components/report-button";
import { SentimentDonut } from "@/components/sentiment-donut";
import { TopIssuesChart } from "@/components/top-issues-chart";
import { TrendChart } from "@/components/trend-chart";

const VALID_SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sentiment?: string }>;
}) {
  const params = await searchParams;
  const categories = await getCategories();
  const category = params.category && categories.includes(params.category)
    ? params.category
    : undefined;
  const sentiment =
    params.sentiment && VALID_SENTIMENTS.includes(params.sentiment as Sentiment)
      ? (params.sentiment as Sentiment)
      : undefined;
  const filters = { category, sentiment };

  const [kpis, sentimentMix, topIssues, trend] = await Promise.all([
    getKpis(filters),
    getSentimentDistribution(filters),
    getTopIssues(filters),
    getTrend(filters),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            KPIs, sentiment, top issues, and the 12-week trend — all filterable.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterBar categories={categories} current={filters} />
          <ReportButton filters={filters} />
        </div>
      </div>

      {kpis.totalVolume === 0 ? (
        <EmptyState
          title="No feedback matches these filters"
          description="Try a different category or sentiment, or reset the filters to see the full picture."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total feedback"
              value={kpis.totalVolume.toLocaleString()}
              sub={`${kpis.uniqueTexts.toLocaleString()} unique texts`}
              icon={Inbox}
            />
            <KpiCard
              title="Unique issues"
              value={kpis.uniqueTexts.toLocaleString()}
              sub="distinct feedback texts"
              icon={Tags}
            />
            <KpiCard
              title="Negative"
              value={`${(kpis.pctNegative * 100).toFixed(1)}%`}
              sub="share of feedback volume"
              icon={Meh}
            />
            <KpiCard
              title="Top priority issue"
              value={
                kpis.topPriority
                  ? `${kpis.topPriority.priority.toFixed(1)}`
                  : "—"
              }
              sub={kpis.topPriority?.label ?? "No issues"}
              icon={Flame}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SentimentDonut data={sentimentMix} />
            <TopIssuesChart data={topIssues} />
          </div>

          <TrendChart data={trend} />
        </>
      )}
    </div>
  );
}
