import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";

import {
  getKpis,
  getRecommendations,
  getSentimentDistribution,
  getTrend,
} from "@/lib/analytics";
import { loadSeedAnalysis } from "@/lib/db";
import { createReport, type ReportFilters } from "@/lib/reports";

const VALID_SENTIMENTS = ["positive", "neutral", "negative"];

export async function POST(req: NextRequest) {
  await connection();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { category, sentiment } = (body ?? {}) as {
    category?: unknown;
    sentiment?: unknown;
  };
  const filters: ReportFilters = {
    ...(typeof category === "string" && category ? { category } : {}),
    ...(typeof sentiment === "string" &&
    VALID_SENTIMENTS.includes(sentiment)
      ? { sentiment: sentiment as ReportFilters["sentiment"] }
      : {}),
  };

  const [meta, kpis, sentimentMix, recommendations, trend] = await Promise.all([
    loadSeedAnalysis().then((a) => a.meta),
    getKpis(filters),
    getSentimentDistribution(filters),
    getRecommendations().then((recs) =>
      // Recommendations stay global (priority ranking is dataset-wide);
      // dashboard filters apply to KPIs, sentiment and trend.
      recs.slice(0, 5),
    ),
    getTrend(filters),
  ]);

  const report = await createReport({
    filters,
    meta,
    kpis,
    sentiment: sentimentMix,
    recommendations,
    trend,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json(
    { token: report.token, url: `/report/${report.token}` },
    { status: 201 },
  );
}
