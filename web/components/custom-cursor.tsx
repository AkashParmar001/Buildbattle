"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select";

// Editorial cursor: a bone dot in difference blend that grows over
// interactive elements. Hidden on touch devices and reduced motion.
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;
    let grow = false;
    let raf = 0;
    let shown = false;

    const render = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%) scale(${grow ? 1.8 : 1})`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${grow ? 1.6 : 1})`;
      ring.style.opacity = shown ? "1" : "0";
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const move = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!shown) {
        shown = true;
        document.documentElement.style.cursor = "none";
      }
      const target = e.target as Element | null;
      grow = !!target?.closest?.(INTERACTIVE);
    };
    const leave = () => {
      shown = false;
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.style.cursor = "";
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80] hidden [@media(pointer:fine)]:block print:hidden">
      <div
        ref={ringRef}
        className="absolute top-0 left-0 h-8 w-8 rounded-full transition-[opacity] duration-200"
        style={{
          background: "var(--bone)",
          mixBlendMode: "difference",
          opacity: 0,
        }}
      />
      <div
        ref={dotRef}
        className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--bone)", mixBlendMode: "difference" }}
      />
    </div>
  );
}
