"use client";

import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

// Infinite horizontal marquee of theme words. Pure CSS animation (cheap,
// compositor-friendly); static wrapping under prefers-reduced-motion.
export function Marquee({
  items,
  seconds = 38,
  className,
}: {
  items: string[];
  seconds?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-2", className)}>
        {items.map((item) => (
          <span key={item} className="text-sm text-muted-foreground">
            {item}
          </span>
        ))}
      </div>
    );
  }

  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key === "b"}>
      {items.map((item) => (
        <span key={item} className="flex items-center">
          <span className="px-5 text-sm tracking-wide whitespace-nowrap">
            {item}
          </span>
          <span aria-hidden="true" className="text-stone">
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        className="flex w-max"
        style={{
          animation: `marquee ${seconds}s linear infinite`,
        }}
      >
        {row("a")}
        {row("b")}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
