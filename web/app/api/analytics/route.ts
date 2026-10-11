import { connection, NextResponse } from "next/server";

import {
  getKpis,
  getSentimentDistribution,
  getTopIssues,
  getTrend,
} from "@/lib/analytics";
import { getDataSource, loadSeedAnalysis } from "@/lib/db";

// Smoke-test route for the data layer: totals must equal 7000 rows.
export async function GET() {
  await connection();
  try {
    const [source, meta, kpis, sentiment, topIssues, trend] = await Promise.all([
      getDataSource(),
      loadSeedAnalysis().then((a) => a.meta),
      getKpis(),
      getSentimentDistribution(),
      getTopIssues(),
      getTrend(),
    ]);

    return NextResponse.json({
      source,
      meta,
      kpis,
      sentiment,
      topIssues,
      trend,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analytics failed." },
      { status: 500 },
    );
  }
}
