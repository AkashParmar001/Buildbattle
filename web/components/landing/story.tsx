"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { AnimatedNumber } from "@/components/animated-number";

export type StoryStep = {
  key: string;
  title: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  statLabel: string;
  body: string;
};

// ~400vh sticky scroll story: each fifth of the scroll reveals one pipeline
// stage with a live counter. Reduced motion → plain stacked sections.
export function Story({ steps }: { steps: StoryStep[] }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  if (reduce || steps.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
        {steps.map((s) => (
          <StoryCard key={s.key} step={s} active />
        ))}
      </div>
    );
  }

  return (
    <section
      ref={ref}
      id="story"
      aria-label="How InsightFlow works"
      className="relative h-[400vh]"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="relative mx-auto h-full w-full max-w-3xl px-6">
          <ol className="relative h-full">
            {steps.map((step, i) => (
              <StoryPanel key={step.key} step={step} index={i} total={steps.length} progress={scrollYProgress} />
            ))}
          </ol>
          {/* Progress dots */}
          <ProgressDots progress={scrollYProgress} total={steps.length} />
        </div>
      </div>
    </section>
  );
}

function StoryPanel({
  step,
  index,
  total,
  progress,
}: {
  step: StoryStep;
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(
    progress,
    [start, start + 0.04, end - 0.04, end],
    [0, 1, 1, index === total - 1 ? 1 : 0],
  );
  const y = useTransform(
    progress,
    [start, start + 0.04, end - 0.04, end],
    [24, 0, 0, index === total - 1 ? 0 : -24],
  );

  return (
    <motion.li
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity, y }}
      aria-hidden={false}
    >
      <StoryCard step={step} active />
    </motion.li>
  );
}

function StoryCard({ step, active }: { step: StoryStep; active: boolean }) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3 text-center">
      <p className="text-xs font-semibold tracking-widest text-accent uppercase">
        {step.statLabel}
      </p>
      <p className="text-5xl font-semibold tracking-tight sm:text-6xl">
        {active ? (
          <AnimatedNumber
            value={step.value}
            decimals={step.decimals ?? 0}
            prefix={step.prefix}
            suffix={step.suffix}
          />
        ) : (
          step.value.toLocaleString()
        )}
      </p>
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {step.title}
      </h2>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        {step.body}
      </p>
    </div>
  );
}

function ProgressDots({
  progress,
  total,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  total: number;
}) {
  return (
    <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const start = i / total;
        const end = (i + 1) / total;
        return <Dot key={i} progress={progress} start={start} end={end} />;
      })}
    </div>
  );
}

function Dot({
  progress,
  start,
  end,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  start: number;
  end: number;
}) {
  const scaleX = useTransform(progress, [start, end], [1, 3]);
  return (
    <motion.span
      aria-hidden="true"
      className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
      style={{ scaleX }}
    />
  );
}
