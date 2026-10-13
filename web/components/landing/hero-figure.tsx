import Image from "next/image";

import { Reveal } from "@/components/reveal";

// Framed product visual for the landing hero: a crafted illustration of the
// Command Center (decision brief, issue map, priority queue) with live seed
// numbers overlaid as chips. Renders on every device — including the mobile /
// reduced-motion paths where the WebGL scene stays off.
export function HeroFigure({
  totalRows,
  unique,
  themes,
  qualityGain,
}: {
  totalRows: number;
  unique: number;
  themes: number;
  qualityGain: number;
}) {
  return (
    <Reveal className="relative w-full">
      <figure className="overflow-hidden rounded-xl border border-rule bg-card shadow-[0_24px_80px_-32px_color-mix(in_srgb,var(--ink)_35%,transparent)]">
        <div className="flex items-center gap-2 border-b border-rule px-4 py-2.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-rule" />
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-rule" />
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-rule" />
          <span className="ml-2 font-mono text-[11px] text-stone">
            insightflow · command center
          </span>
          <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 font-mono text-[11px] text-accent-foreground sm:inline-flex">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
            live snapshot
          </span>
        </div>
        <div className="relative">
          <Image
            src="/product-snapshot.svg"
            alt="Illustration of the InsightFlow Command Center: the top fix with its score breakdown, a bubble map of ten feedback themes, and a ranked priority queue."
            width={1200}
            height={900}
            priority
            className="h-auto w-full"
          />
        </div>
        <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-rule px-4 py-3 font-mono text-[11px] tabular-nums text-muted-foreground">
          <span>
            <strong className="font-semibold text-foreground">
              {totalRows.toLocaleString()}
            </strong>{" "}
            reports
          </span>
          <span>
            <strong className="font-semibold text-foreground">
              {unique.toLocaleString()}
            </strong>{" "}
            unique
          </span>
          <span>
            <strong className="font-semibold text-foreground">{themes}</strong>{" "}
            themes
          </span>
          <span className="ml-auto text-stone">
            +{Math.round(qualityGain)}% data quality, measured
          </span>
        </figcaption>
      </figure>
    </Reveal>
  );
}
