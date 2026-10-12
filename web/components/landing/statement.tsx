"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const TEXT =
  "Every week your customers write thousands of reviews. Most teams read a handful. InsightFlow reads all of them — the pattern behind the noise, the complaint behind the number, and the one fix that actually moves the needle.";

// Large statement paragraph: words lift from stone to ink as you scroll
// through it (scrubbed ScrollTrigger). Static full-contrast under reduced
// motion.
export function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-w]"),
        { opacity: 0.22 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.05,
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            end: "bottom 55%",
            scrub: 0.4,
          },
        },
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <p
      ref={ref}
      className="max-w-4xl font-display text-3xl leading-[1.25] tracking-tight text-foreground sm:text-4xl lg:text-5xl"
    >
      {TEXT.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} data-w="">
          {word}{" "}
        </span>
      ))}
    </p>
  );
}
