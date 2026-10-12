"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "if-preloaded";
const MAX_MS = 1600;

// Editorial preloader: a 0→100 counter that resolves in at most 1.6s, is
// skippable (click / key / scroll), and shows once per session.
// Skipped entirely under prefers-reduced-motion.
export function Preloader() {
  const [count, setCount] = useState(0);
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(false);
  const skipRef = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || sessionStorage.getItem(KEY)) return;

    let raf = 0;
    let closeTimer = 0;
    const finish = () => {
      if (closeTimer) return;
      setClosing(true);
      closeTimer = window.setTimeout(() => setVisible(false), 700);
    };

    raf = requestAnimationFrame((now) => {
      setVisible(true);
      sessionStorage.setItem(KEY, "1");
      const ease = (t: number) => 1 - (1 - t) * (1 - t);
      const step = (t0: number) => {
        const t = Math.min(1, (t0 - now) / MAX_MS);
        setCount(Math.round(ease(t) * 100));
        if (t < 1 && !skipRef.current) raf = requestAnimationFrame(step);
        else finish();
      };
      raf = requestAnimationFrame(step);
    });

    const skip = () => {
      skipRef.current = true;
      finish();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip();
    };
    window.addEventListener("click", skip, { once: true });
    window.addEventListener("keydown", onKey, { once: true });
    window.addEventListener("wheel", skip, { once: true, passive: true });
    window.addEventListener("touchstart", skip, { once: true, passive: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(closeTimer);
      window.removeEventListener("click", skip);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
    };
  }, []);

  if (!visible) return null;
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[90] flex items-end justify-end bg-[var(--background)] p-6 transition-all duration-500 ease-out sm:p-10 ${
        closing
          ? "pointer-events-none translate-y-[-4%] opacity-0"
          : "opacity-100"
      }`}
    >
      <span className="font-mono text-5xl tracking-tight text-[var(--foreground)] tabular-nums sm:text-7xl">
        {count}
      </span>
    </div>
  );
}
