import { Flame, Inbox, Meh, Tags } from "lucide-react";
import { Suspense } from "react";

import {
  getCategories,
  getInsightClusters,
  getKpis,
  getRecommendations,
  getSentimentDistribution,
  getTrend,
} from "@/lib/analytics";
import type { Sentiment } from "@/lib/db";
import { getIssueTrackedClusterIds } from "@/lib/issues";
import { AnimatedNumber } from "@/components/animated-number";
import { ClusterDrawer } from "@/components/cluster-drawer";
import { DecisionBrief } from "@/components/decision-brief";
import { EmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filter-bar";
import { IssueMap } from "@/components/issue-map";
import { KpiCard } from "@/components/kpi-card";
import { PriorityQueue } from "@/components/priority-queue";
import { ReportButton } from "@/components/report-button";
import { Reveal } from "@/components/reveal";
import { SentimentDonut } from "@/components/sentiment-donut";
import { TrendChart } from "@/components/trend-chart";

const VALID_SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];

// The Command Center: one filterable view — decision brief, KPIs, issue map,
// priority queue, trends. category/sentiment params refilter everything
// server-side so every number agrees.
export default async function CommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    sentiment?: string;
    cluster?: string;
  }>;
}) {
  const params = await searchParams;
  const categories = await getCategories();
  const category =
    params.category && categories.includes(params.category)
      ? params.category
      : undefined;
  const sentiment =
    params.sentiment && VALID_SENTIMENTS.includes(params.sentiment as Sentiment)
      ? (params.sentiment as Sentiment)
      : undefined;
  const filters = { category, sentiment };
  const selectedCluster =
    params.cluster !== undefined && Number.isInteger(Number(params.cluster))
      ? Number(params.cluster)
      : undefined;

  const [kpis, sentimentMix, trend, clusters, recommendations, tracked] =
    await Promise.all([
      getKpis(filters),
      getSentimentDistribution(filters),
      getTrend(filters),
      getInsightClusters(filters),
      getRecommendations(filters),
      getIssueTrackedClusterIds(),
    ]);
  const trackedIds = new Set(tracked);
  const top = recommendations[0];
  const selected = clusters.find((c) => c.id === selectedCluster);
  const selectedRec = recommendations.find((r) => r.id === selectedCluster);
  const negativeVolume = Math.round(kpis.pctNegative * kpis.totalVolume);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Command Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What to fix first, why, and the evidence behind it — filterable
            end to end.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterBar categories={categories} current={filters} />
          <ReportButton filters={filters} />
        </div>
      </div>

      {kpis.totalVolume === 0 || !top ? (
        <EmptyState
          title="No feedback matches these filters"
          description="Try a different category or sentiment, or reset the filters to see the full picture."
        />
      ) : (
        <>
          <Reveal>
            <DecisionBrief item={top} tracked={trackedIds.has(top.id)} />
          </Reveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Reveal delay={0.02}>
              <KpiCard
                title="Total feedback"
                value={<AnimatedNumber value={kpis.totalVolume} />}
                sub={`${kpis.uniqueTexts.toLocaleString()} unique texts`}
                icon={Inbox}
              />
            </Reveal>
            <Reveal delay={0.06}>
              <KpiCard
                title="Unique issues"
                value={<AnimatedNumber value={kpis.uniqueTexts} />}
                sub="distinct feedback texts"
                icon={Tags}
              />
            </Reveal>
            <Reveal delay={0.1}>
              <KpiCard
                title="Negative"
                value={
                  <AnimatedNumber
                    value={kpis.pctNegative * 100}
                    decimals={1}
                    suffix="%"
                  />
                }
                sub="share of feedback volume"
                icon={Meh}
              />
            </Reveal>
            <Reveal delay={0.14}>
              <KpiCard
                title="Top priority issue"
                value={
                  kpis.topPriority ? (
                    <AnimatedNumber
                      value={kpis.topPriority.priority}
                      decimals={1}
                    />
                  ) : (
                    "—"
                  )
                }
                sub={kpis.topPriority?.label ?? "No issues"}
                icon={Flame}
              />
            </Reveal>
          </div>

          <Reveal>
            <Suspense
              fallback={
                <div
                  aria-busy="true"
                  aria-label="Loading issue map"
                  className="h-96 rounded-xl border border-border animate-shimmer"
                />
              }
            >
              <IssueMap clusters={clusters} />
            </Suspense>
          </Reveal>

          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Priority queue
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Ranked by the AGENTS.md priority formula — volume share (40%),
                negativity (35%), growth (25%), ×1.25 when fraud-dominated.
              </p>
            </div>
            <PriorityQueue items={recommendations} trackedIds={trackedIds} />
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Reveal>
              <SentimentDonut data={sentimentMix} />
            </Reveal>
            <Reveal delay={0.06}>
              <TrendChart data={trend} />
            </Reveal>
          </div>
        </>
      )}

      {selected && (
        <ClusterDrawer
          cluster={selected}
          recommendation={selectedRec}
          tracked={trackedIds.has(selected.id)}
          totals={{ volume: kpis.totalVolume, negativeVolume }}
        />
      )}
    </div>
  );
}
