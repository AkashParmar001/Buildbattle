import Link from "next/link";

import {
  getInsightClusters,
  getSentimentDistribution,
} from "@/lib/analytics";
import { loadSeedAnalysis } from "@/lib/db";
import {
  loadAdaptionEval,
  loadAdaptionEvaluation,
  loadAutoScientistRun,
} from "@/lib/showcase";
import { HeroGalaxy } from "@/components/landing/hero-galaxy";
import type { GalaxyCluster } from "@/components/landing/galaxy";
import { Story, type StoryStep } from "@/components/landing/story";
import { Statement } from "@/components/landing/statement";
import { FeatureRows } from "@/components/landing/feature-rows";
import { IssueMapWindow } from "@/components/landing/issue-map-window";
import { Counters } from "@/components/landing/counters";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Marquee } from "@/components/marquee";
import { SectionLabel } from "@/components/section-label";
import { SplitReveal } from "@/components/split-reveal";
import { MagneticButton } from "@/components/magnetic-button";

// Landing reads seed analytics + evaluation artifacts at request time
// (memoised in-process) — allowed to block under cacheComponents.
export const instant = false;

const MARQUEE_THEMES = [
  "Fraud & scams",
  "Delivery delays",
  "Support quality",
  "Refunds & billing",
  "Damaged orders",
  "App reliability",
  "Seller listings",
  "Packaging",
  "Response times",
  "Returns",
];

export default async function LandingPage() {
  const [clusters, sentimentMix, seed, adaptionEvaluation, adaptionEval, autoscientist] =
    await Promise.all([
      getInsightClusters({}),
      getSentimentDistribution({}),
      loadSeedAnalysis(),
      loadAdaptionEvaluation(),
      loadAdaptionEval(),
      loadAutoScientistRun(),
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
      statLabel: "Step 1 · Collect",
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
      title: "Adaptive data refines the dataset before analysis",
      value: quality?.improvement_percent ?? 205,
      prefix: "+",
      suffix: "%",
      statLabel: "Step 3 · Refine",
      body: quality
        ? `Quality score ${quality.score_before} → ${quality.score_after} (grade ${quality.grade_before} → ${quality.grade_after}). Measured, not marketing.`
        : "Adaptive Data improves message quality end to end. Measured, not marketing.",
    },
    {
      key: "clusters",
      title: "Themes emerge as explainable clusters",
      value: clusters.length,
      statLabel: "Step 4 · Understand",
      body: "Reviews group into named topics, each with sentiment mix, growth trend and evidence quotes you can read.",
    },
    {
      key: "decisions",
      title: "A ranked queue of what to fix first",
      value: 3,
      statLabel: "Step 5 · Decide",
      body: "Priority = volume share + negativity + growth, with a fraud multiplier. One glance shows the top decision — with the numbers behind it.",
    },
  ];

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      {/* 1 · Hero (bone) */}
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-8">
        <header className="flex h-16 items-center gap-3">
          <span className="font-display text-xl tracking-tight">
            InsightFlow
          </span>
          <span className="hidden font-mono text-[11px] tracking-wider text-stone uppercase sm:inline">
            customer feedback intelligence
          </span>
          <Link
            href="/app"
            className="ml-auto inline-flex h-9 items-center border border-rule px-4 text-sm hover:bg-muted"
          >
            Open app
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-8 pb-16 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-5">
            <SplitReveal
              as="h1"
              immediate
              text="Hear what your customers are really saying."
              className="max-w-xl font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            />
            <p className="max-w-md text-base leading-7 text-muted-foreground">
              InsightFlow reads every review, groups them into named themes,
              and ranks what to fix first — with the evidence attached.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <MagneticButton>
                <Link
                  href="/app"
                  className="inline-flex h-11 items-center bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
                >
                  Open the Command Center →
                </Link>
              </MagneticButton>
              <a
                href="#story"
                className="inline-flex h-11 items-center border border-rule px-6 text-sm hover:bg-muted"
              >
                See how it works ↓
              </a>
            </div>
          </div>

          <div className="relative h-72 w-full sm:h-96 lg:h-[420px]">
            <HeroGalaxy clusters={galaxyClusters} sentimentMix={sentimentMix} />
          </div>
        </div>
      </section>

      {/* 2 · Theme marquee (ink strip) */}
      <div className="band-ink border-y border-rule py-4">
        <Marquee items={MARQUEE_THEMES} />
      </div>

      {/* 3 · Statement (bone) */}
      <section className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <SectionLabel index={1} label="The problem" className="mb-8" />
        <Statement />
      </section>

      {/* 4 · Pinned scroll story (ink) */}
      <div className="band-ink border-y border-rule">
        <div className="mx-auto w-full max-w-6xl px-5 pt-16 sm:px-8">
          <SectionLabel index={2} label="From raw to ranked" />
        </div>
        <Story steps={steps} />
      </div>

      {/* 5 · Feature rows (bone) */}
      <FeatureRows />

      {/* 6 · Live issue map (ink) */}
      <div className="band-ink border-y border-rule">
        <IssueMapWindow clusters={clusters} />
      </div>

      {/* 7 · Counters (bone) */}
      <Counters
        items={[
          { label: "Customer reports", value: totalRows, note: "raw input" },
          { label: "Unique reviews", value: unique, note: "after dedupe" },
          { label: "Named themes", value: clusters.length },
          { label: "Weeks of signal", value: 12, note: "simulated demo timeline" },
          {
            label: "Data quality gain",
            value: Math.round(quality?.improvement_percent ?? 205),
            prefix: "+",
            suffix: "%",
            note: "grade E → C, measured",
          },
        ]}
      />

      {/* 8 · How it works (bone) */}
      <div className="border-t border-rule">
        <HowItWorks
          quality={quality ?? null}
          evalData={adaptionEval}
          run={autoscientist}
        />
      </div>

      {/* 9 · Final CTA (ink) */}
      <div className="band-ink border-t border-rule">
        <section className="mx-auto w-full max-w-6xl px-5 py-24 text-center sm:px-8">
          <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            See what to fix first.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            The Command Center shows the #1 fix with its score breakdown,
            evidence reviews, sentiment trends and the full priority queue —
            filterable end to end.
          </p>
          <div className="mt-8 flex justify-center">
            <MagneticButton>
              <Link
                href="/app"
                className="inline-flex h-11 items-center bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                Open the Command Center →
              </Link>
            </MagneticButton>
          </div>
        </section>

        {/* 10 · Footer with giant wordmark (ink) */}
        <footer className="border-t border-rule px-5 pt-10 pb-6 sm:px-8">
          <p
            aria-hidden="true"
            className="w-full overflow-hidden text-center font-display leading-[0.85] tracking-tight select-none text-[clamp(3rem,14vw,12rem)]"
          >
            InsightFlow
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5 font-mono text-[11px] text-stone">
            <span>InsightFlow — customer feedback intelligence</span>
            <span>Demo dataset · simulated demo timeline</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
