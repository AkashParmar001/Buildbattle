import { notFound } from "next/navigation";
import { connection } from "next/server";

import { normalizeTrend } from "@/lib/analytics";
import { getReport } from "@/lib/reports";
import { KpiCard } from "@/components/kpi-card";
import { RecommendationCard } from "@/components/recommendation-card";
import { ReportActions } from "@/components/report-actions";
import { SentimentDonut } from "@/components/sentiment-donut";
import { SimulatedBadge } from "@/components/simulated-badge";
import { TrendChart } from "@/components/trend-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Inbox, Meh, Tags } from "lucide-react";

// Tokenized share links read from the database/overlay at request time —
// allowed to block (cacheComponents opt-out for this segment).
export const instant = false;

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await connection();
  const report = await getReport(token);
  if (!report) notFound();
  const { snapshot } = report;
  const { kpis } = snapshot;
  const top = snapshot.recommendations[0];

  const filterLabel =
    snapshot.filters.category ?? snapshot.filters.sentiment
      ? [
          snapshot.filters.category ?? "All categories",
          snapshot.filters.sentiment
            ? `${snapshot.filters.sentiment} sentiment`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "All feedback";

  return (
    <div className="light mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 print:max-w-none print:gap-4 print:p-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            InsightFlow executive report
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Customer feedback snapshot
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filterLabel} ·{" "}
            {new Date(snapshot.createdAt).toLocaleString()} · token{" "}
            <span className="font-mono">{token.slice(0, 8)}…</span>
          </p>
        </div>
        <ReportActions url={`/report/${token}`} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold tracking-tight">
            Executive summary
          </h2>
          <p className="text-sm leading-6">
            Across {kpis.totalVolume.toLocaleString()} reports (
            {kpis.uniqueTexts.toLocaleString()} unique texts),{" "}
            {(kpis.pctNegative * 100).toFixed(1)}% of volume is negative.
            {top
              ? ` The top priority is “${top.label}” (score ${top.priority.toFixed(1)}, ${top.volume.toLocaleString()} reports), owned by ${top.owner}.`
              : " No priority issue identified."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
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
            kpis.topPriority ? kpis.topPriority.priority.toFixed(1) : "—"
          }
          sub={kpis.topPriority?.label ?? "No issues"}
          icon={Flame}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 print:grid-cols-2">
        <SentimentDonut data={snapshot.sentiment} />
        <TrendChart data={normalizeTrend(snapshot.trend)} />
      </div>

      <div>
        <h2 className="text-base font-semibold tracking-tight">
          Top recommendations
        </h2>
        <div className="mt-3 flex flex-col gap-4">
          {snapshot.recommendations.map((item, i) => (
            <RecommendationCard
              key={item.id}
              item={item}
              rank={i + 1}
              tracked={false}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Methodology</h2>
          <div className="flex flex-wrap items-center gap-2">
            <SimulatedBadge />
          </div>
          <ul className="list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
            <li>
              Source: {snapshot.meta.total_rows.toLocaleString()} deduplicated
              feedback reports ({snapshot.meta.unique} unique texts, volume =
              duplicate count), refined through adaptive data before analysis.
            </li>
            <li>
              The 12-week trend is a simulated timeline — feedback has no real
              dates. Only user-submitted or imported feedback carries real
              timestamps.
            </li>
            <li>
              {snapshot.meta.unique} unique reviews refined and evaluated
              (quality grade E → C, +205%); downstream analysis runs on review
              text with volume-weighted metrics.
            </li>
            <li>
              Priority combines volume share, negativity and growth, with
              fraud-dominated themes weighted higher.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
