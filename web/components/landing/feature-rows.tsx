"use client";

import { useState } from "react";

import { SectionLabel } from "@/components/section-label";
import { sentimentColors } from "@/lib/colors";
import { cn } from "@/lib/utils";

type Feature = {
  num: string;
  title: string;
  body: string;
  preview: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    num: "01",
    title: "Collect",
    body: "Every review, ticket and mention lands in one place — deduplicated, with volume kept as a weight so nothing gets flattened.",
    preview: (
      <div className="space-y-2 font-mono text-xs">
        <p className="text-stone">raw reports</p>
        <p className="text-2xl">7,000</p>
        <p className="text-stone">unique texts</p>
        <p className="text-2xl">320</p>
      </div>
    ),
  },
  {
    num: "02",
    title: "Understand",
    body: "Sentiment and themes are labelled automatically, so a thousand similar complaints become one explainable theme with evidence.",
    preview: (
      <div className="w-40 space-y-2 text-xs">
        <div className="flex h-2 overflow-hidden rounded-full bg-rule">
          <span
            className="w-[42%]"
            style={{ background: sentimentColors.positive }}
          />
          <span
            className="w-[28%]"
            style={{ background: sentimentColors.neutral }}
          />
          <span
            className="w-[30%]"
            style={{ background: sentimentColors.negative }}
          />
        </div>
        <p className="font-mono text-stone">positive · neutral · negative</p>
      </div>
    ),
  },
  {
    num: "03",
    title: "Decide",
    body: "A ranked priority queue shows the one fix worth doing first — volume share, negativity and growth behind every score.",
    preview: (
      <div className="space-y-1">
        <span className="inline-block rounded-full bg-lime px-3 py-1 font-mono text-xs text-ink">
          #1 · score 100
        </span>
        <p className="font-mono text-xs text-stone">clamped at 100</p>
      </div>
    ),
  },
  {
    num: "04",
    title: "Track",
    body: "Turn any theme into a tracked issue, set status and notes, and watch its volume move week over week.",
    preview: (
      <div className="flex gap-1.5 text-xs">
        <span className="rounded-full border border-rule px-2 py-0.5">Open</span>
        <span className="rounded-full border border-rule px-2 py-0.5">In progress</span>
        <span className="rounded-full border border-rule px-2 py-0.5">Resolved</span>
      </div>
    ),
  },
  {
    num: "05",
    title: "Report",
    body: "Share a print-ready snapshot of KPIs and top recommendations with anyone — no login needed.",
    preview: (
      <div className="space-y-1 font-mono text-xs">
        <p className="text-2xl">PDF-ready</p>
        <p className="text-stone">read-only link</p>
      </div>
    ),
  },
];

// Big numbered feature rows: title + body on the left, a small mock preview
// on the right that appears on hover (static on touch / small screens).
export function FeatureRows() {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
      <SectionLabel index={3} label="What you get" className="mb-10" />
      <ul>
        {FEATURES.map((f) => (
          <li
            key={f.num}
            onMouseEnter={() => setHover(f.num)}
            onMouseLeave={() => setHover(null)}
            className="grid grid-cols-1 items-baseline gap-2 border-t border-rule py-7 md:grid-cols-[4rem_14rem_1fr_12rem]"
          >
            <span className="font-mono text-xs text-stone tabular-nums">
              {f.num}
            </span>
            <h3 className="font-display text-3xl tracking-tight lg:text-4xl">
              {f.title}
            </h3>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {f.body}
            </p>
            <div
              className={cn(
                "hidden justify-self-end transition-opacity duration-300 md:block",
                hover === f.num ? "opacity-100" : "opacity-40",
              )}
            >
              {f.preview}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
