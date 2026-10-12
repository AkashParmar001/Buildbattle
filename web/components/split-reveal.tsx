"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type SplitRevealProps = {
  text: string;
  className?: string;
  /** Animate when scrolled into view (default) or immediately on mount. */
  immediate?: boolean;
  delay?: number;
};

// Line-by-line headline reveal via GSAP SplitText (masked lines slide up).
// Falls back to plain text under prefers-reduced-motion.
export function SplitReveal({
  text,
  className,
  immediate = false,
  delay = 0,
}: SplitRevealProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let split: SplitText | undefined;
    let ctx: gsap.Context | undefined;
    let cancelled = false;

    const run = () => {
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(SplitText, ScrollTrigger);
      ctx = gsap.context(() => {
        split = new SplitText(el, {
          type: "lines",
          linesClass: "split-line",
          mask: "lines",
        });
        gsap.fromTo(
          split.lines,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 0.9,
            ease: "power3.out",
            delay,
            stagger: 0.09,
            ...(immediate
              ? {}
              : {
                  scrollTrigger: { trigger: el, start: "top 88%", once: true },
                }),
          },
        );
      }, ref);
    };

    if (document.fonts?.status === "loaded") run();
    else document.fonts?.ready.then(run);

    return () => {
      cancelled = true;
      ctx?.revert();
      split?.revert();
    };
  }, [text, immediate, delay]);

  return (
    <h2 ref={ref} className={className}>
      {text}
    </h2>
  );
}
