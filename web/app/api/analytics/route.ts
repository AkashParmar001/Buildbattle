import { connection, NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  getInsightClusters,
  getKpis,
  getRecommendations,
  getSentimentDistribution,
  getTopIssues,
  getTrend,
} from "@/lib/analytics";
import { getDataSource, loadSeedAnalysis, type Sentiment } from "@/lib/db";

const VALID_SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];

// Data-layer smoke test + Command Center fallback: totals must equal 7000
// rows unfiltered. Accepts ?category=&sentiment= like the dashboard.
export async function GET(req: NextRequest) {
  await connection();
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category") || undefined;
    const sentimentRaw = sp.get("sentiment");
    const sentiment =
      sentimentRaw && VALID_SENTIMENTS.includes(sentimentRaw as Sentiment)
        ? (sentimentRaw as Sentiment)
        : undefined;
    const filters = { category, sentiment };

    const [
      source,
      meta,
      kpis,
      sentimentMix,
      topIssues,
      trend,
      clusters,
      recommendations,
    ] = await Promise.all([
      getDataSource(),
      loadSeedAnalysis().then((a) => a.meta),
      getKpis(filters),
      getSentimentDistribution(filters),
      getTopIssues(filters),
      getTrend(filters),
      getInsightClusters(filters),
      getRecommendations(filters),
    ]);

    return NextResponse.json({
      source,
      meta,
      kpis,
      sentiment: sentimentMix,
      topIssues,
      trend,
      clusters,
      recommendations,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analytics failed." },
      { status: 500 },
    );
  }
}
