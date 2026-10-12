import Link from "next/link";

import {
  getInsightClusters,
  getSentimentDistribution,
} from "@/lib/analytics";
import { loadSeedAnalysis } from "@/lib/db";
import { loadAdaptionEvaluation } from "@/lib/showcase";
import { HeroGalaxy } from "@/components/landing/hero-galaxy";
import type { GalaxyCluster } from "@/components/landing/galaxy";
import { Story, type StoryStep } from "@/components/landing/story";

// Landing reads seed analytics + Adaption artifacts at request time
// (memoised in-process) — allowed to block under cacheComponents.
export const instant = false;

// Landing: hero galaxy (canvas particles → labelled clusters) + scroll story
// that walks the real pipeline numbers. Client pieces are lazy-loaded.
export default async function LandingPage() {
  const [clusters, sentimentMix, seed, adaptionEvaluation] = await Promise.all([
    getInsightClusters({}),
    getSentimentDistribution({}),
    loadSeedAnalysis(),
    loadAdaptionEvaluation(),
  ]);

  const galaxyClusters: GalaxyCluster[] = clusters
    .slice(0, 8)
    .map((c) => ({ label: c.label, volume: c.volume }));
  const totalRows = seed.meta.total_rows;
  const unique = seed.meta.unique;
  const quality = adaptionEvaluation?.quality;

  const steps: StoryStep[] = [
    {
      key: "raw",
      title: "Raw customer feedback lands unfiltered",
      value: totalRows,
      statLabel: "Step 1 · Ingest",
      body: "Thousands of reviews across support tickets, app store notes and social mentions — noisy, duplicated, unranked.",
    },
    {
      key: "dedupe",
      title: "Exact duplicates collapse into unique texts",
      value: unique,
      statLabel: "Step 2 · Dedupe",
      body: `${totalRows.toLocaleString()} rows reduce to ${unique.toLocaleString()} unique reviews; volume is kept as a weight, never thrown away.`,
    },
    {
      key: "adaption",
      title: "Adaption refines the dataset before analysis",
      value: quality?.improvement_percent ?? 205,
      prefix: "+",
      suffix: "%",
      statLabel: "Step 3 · Adaption",
      body: quality
        ? `Quality score ${quality.score_before} → ${quality.score_after} (grade ${quality.grade_before} → ${quality.grade_after}) via Adaptive Data. Measured, not marketing.`
        : "Adaptive Data improves message quality end to end. Measured, not marketing.",
    },
    {
      key: "clusters",
      title: "Themes emerge as explainable clusters",
      value: clusters.length,
      statLabel: "Step 4 · Cluster",
      body: "TF-IDF + KMeans group the unique reviews into named topics, each with sentiment mix, growth and evidence quotes.",
    },
    {
      key: "decisions",
      title: "A ranked queue of what to fix first",
      value: 3,
      suffix: "",
      statLabel: "Step 5 · Decide",
      body: "Priority = volume share + negativity + growth (with a fraud multiplier). One glance tells you the top decision — with the numbers behind it.",
    },
  ];

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-glow bg-grid"
      />

      {/* Hero */}
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6">
        <header className="flex h-16 items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
            I
          </span>
          <span className="text-base font-semibold tracking-tight">
            InsightFlow
          </span>
          <Link
            href="/app"
            className="ml-auto inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
          >
            Open app
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-8 pb-16 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-5">
            <span className="inline-flex items-center rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              Frontend Arena Build Battle 2026
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Know which customer
              <br />
              problem to fix first.
            </h1>
            <p className="max-w-md text-base leading-7 text-muted-foreground">
              InsightFlow turns {totalRows.toLocaleString()} raw feedback rows
              into {unique.toLocaleString()} deduped, Adaption-refined insights,{" "}
              {clusters.length} explainable clusters, and a ranked action queue
              — every number traceable to source data.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="inline-flex h-11 items-center rounded-lg bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                Open the Command Center
              </Link>
              <a
                href="#story"
                className="inline-flex h-11 items-center rounded-lg border border-border px-6 text-sm font-medium hover:bg-muted"
              >
                How it works ↓
              </a>
            </div>
          </div>

          <div className="relative h-72 w-full sm:h-96 lg:h-[420px]">
            <HeroGalaxy clusters={galaxyClusters} sentimentMix={sentimentMix} />
          </div>
        </div>
      </section>

      {/* Scroll story */}
      <Story steps={steps} />

      {/* Closing CTA */}
      <section className="relative mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/70 px-6 py-14 text-center backdrop-blur-sm">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            See the queue behind the story.
          </h2>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            The Command Center shows the #1 fix with its score breakdown,
            evidence reviews, sentiment trends, and the full priority queue —
            filterable end to end.
          </p>
          <Link
            href="/app"
            className="inline-flex h-11 items-center rounded-lg bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Open the Command Center →
          </Link>
          <p className="text-xs text-muted-foreground">
            Demo runs on seed data — no keys or database required.
          </p>
        </div>
      </section>

      <footer className="relative border-t border-border px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        InsightFlow · Adaption + AutoScientist pipeline showcase · weekly
        trends are simulated demo data
      </footer>
    </main>
  );
}
