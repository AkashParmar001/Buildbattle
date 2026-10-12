"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Smooth scrolling: Lenis drives the scroll position, GSAP's ticker drives
// Lenis, and ScrollTrigger follows Lenis's scroll events. Disabled entirely
// under prefers-reduced-motion (native scroll takes over).
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.off("scroll", onScroll);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
