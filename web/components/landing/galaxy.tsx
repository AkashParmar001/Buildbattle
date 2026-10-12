"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

import { sentimentColors } from "@/lib/colors";
import type { SentimentSlice } from "@/lib/analytics";

export type GalaxyCluster = { label: string; volume: number };

// Hero galaxy: ~400 canvas particles drifting into labelled cluster bubbles
// (labels = real top clusters). Mouse gently repels particles. Pauses when
// off-screen or the tab is hidden. Under reduced motion, renders a static
// SVG constellation instead — no canvas, no rAF.
export function Galaxy({
  clusters,
  sentimentMix,
}: {
  clusters: GalaxyCluster[];
  sentimentMix: SentimentSlice[];
}) {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Stable bubble targets laid out in a loose ring.
  const targets = clusters.slice(0, 8).map((c, i, arr) => {
    const n = arr.length;
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      label: c.label,
      volume: c.volume,
      x: 0.5 + Math.cos(angle) * 0.32,
      y: 0.5 + Math.sin(angle) * 0.26,
    };
  });

  useEffect(() => {
    if (reduce) return;
    const canvasEl = canvasRef.current;
    const wrapEl = wrapRef.current;
    if (!canvasEl || !wrapEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    const isMobile = window.innerWidth < 640;
    const COUNT = isMobile ? 200 : 400;
    const colors = sentimentMix
      .filter((s) => s.volume > 0)
      .map((s) => sentimentColors[s.sentiment]);
    const colorPool = colors.length > 0 ? colors : ["#94a3b8"];

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;
    let inView = true;
    let mx = -9999;
    let my = -9999;
    let t = 0;

    type Particle = {
      x: number;
      y: number;
      tx: number;
      ty: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
      seed: number;
    };
    const particles: Particle[] = [];

    const seedParticles = () => {
      particles.length = 0;
      for (let i = 0; i < COUNT; i++) {
        const target = targets[i % Math.max(1, targets.length)];
        const cx = (target?.x ?? 0.5) * width;
        const cy = (target?.y ?? 0.5) * height;
        particles.push({
          x: cx + (Math.random() - 0.5) * 40,
          y: cy + (Math.random() - 0.5) * 40,
          tx: cx,
          ty: cy,
          vx: 0,
          vy: 0,
          r: 1 + Math.random() * 1.6,
          color: colorPool[i % colorPool.length],
          seed: Math.random() * 1000,
        });
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrapEl.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvasEl.width = Math.round(width * dpr);
      canvasEl.height = Math.round(height * dpr);
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles();
    };

    const step = () => {
      if (!running) return;
      t += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Soft cluster halos.
      for (const g of targets) {
        const gx = g.x * width;
        const gy = g.y * height;
        const grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, 56);
        grd.addColorStop(0, "rgba(129,140,248,0.10)");
        grd.addColorStop(1, "rgba(129,140,248,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(gx, gy, 56, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of particles) {
        const driftX = Math.sin(t * 1.4 + p.seed) * 0.35;
        const driftY = Math.cos(t * 1.1 + p.seed * 0.7) * 0.35;
        p.vx += (p.tx - p.x) * 0.004 + driftX * 0.02;
        p.vy += (p.ty - p.y) * 0.004 + driftY * 0.02;
        const dx = p.x - mx;
        const dy = p.y - my;
        const distSq = dx * dx + dy * dy;
        if (distSq < 8100) {
          const dist = Math.sqrt(distSq) || 1;
          const force = (90 - dist) / 90;
          p.vx += (dx / dist) * force * 1.4;
          p.vy += (dy / dist) * force * 1.4;
        }
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvasEl.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    };
    const onLeave = () => {
      mx = -9999;
      my = -9999;
    };

    resize();
    step();

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !running) {
          running = true;
          raf = requestAnimationFrame(step);
        } else if (!inView && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.05 },
    );
    io.observe(wrapEl);

    const onVisibility = () => {
      if (document.hidden && running) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!document.hidden && inView && !running) {
        running = true;
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(() => resize());
    ro.observe(wrapEl);
    wrapEl.addEventListener("pointermove", onMove);
    wrapEl.addEventListener("pointerleave", onLeave);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      wrapEl.removeEventListener("pointermove", onMove);
      wrapEl.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  if (reduce) {
    return (
      <div ref={wrapRef} className="relative h-full w-full" aria-hidden="true">
        <svg
          viewBox="0 0 800 400"
          className="h-full w-full"
          role="img"
          aria-label="Static constellation of feedback clusters"
        >
          <defs>
            <radialGradient id="g1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(129,140,248,0.25)" />
              <stop offset="100%" stopColor="rgba(129,140,248,0)" />
            </radialGradient>
          </defs>
          {targets.map((g, i) => (
            <g key={i}>
              <circle cx={g.x * 800} cy={g.y * 400} r="46" fill="url(#g1)" />
              <circle cx={g.x * 800} cy={g.y * 400} r="7" fill="#818cf8" />
              <text
                x={g.x * 800}
                y={g.y * 400 + 24}
                textAnchor="middle"
                fill="currentColor"
                fontSize="11"
                opacity="0.75"
              >
                {g.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {targets.map((g, i) => (
        <span
          key={i}
          className="pointer-events-none absolute -translate-x-1/2 translate-y-4 rounded-full bg-card/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm"
          style={{ left: `${g.x * 100}%`, top: `${g.y * 100}%` }}
        >
          {g.label}
        </span>
      ))}
    </div>
  );
}
