"use client";

import {
  forceCollide,
  forceSimulation,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import { scaleSqrt } from "d3-scale";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { InsightCluster } from "@/lib/analytics";
import { sentimentColors } from "@/lib/colors";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BubbleNode = SimulationNodeDatum & {
  id: number;
  r: number;
};

function dominantSentiment(
  c: InsightCluster,
): "positive" | "neutral" | "negative" {
  const { positive, neutral, negative } = c.sentiment;
  if (negative >= positive && negative >= neutral) return "negative";
  if (positive >= neutral) return "positive";
  return "neutral";
}

// Interactive issue map: one focusable bubble per cluster, sized by volume
// (d3-scale), colored by dominant sentiment, floating via d3-force with
// collision. Positions are written imperatively so framer can own
// enter/exit + layoutId on the inner button. Click opens the cluster drawer
// (?cluster=ID) — Esc/close dismisses it.
export function IssueMap({ clusters }: { clusters: InsightCluster[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<number, HTMLDivElement>());
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hoverId, setHoverId] = useState<number | null>(null);

  const radiusOf = useMemo(() => {
    const maxVol = Math.max(...clusters.map((c) => c.volume), 1);
    const scale = scaleSqrt().domain([0, maxVol]).range([24, 64]);
    return (volume: number) => scale(volume);
  }, [clusters]);

  const openCluster = useCallback(
    (id: number) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("cluster", String(id));
      next.delete("overlay");
      router.replace(`/app?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Measure container.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // d3-force simulation → imperative transform writes.
  useEffect(() => {
    if (size.w === 0 || clusters.length === 0) return;

    const nodes: BubbleNode[] = clusters.map((c, i) => {
      const existing = nodeRefs.current.get(c.id);
      const prev = existing?.style.transform.match(
        /translate\(([-\d.]+)px, ([-\d.]+)px\)/,
      );
      const prevX = prev ? Number.parseFloat(prev[1]) + radiusOf(c.volume) : undefined;
      const prevY = prev ? Number.parseFloat(prev[2]) + radiusOf(c.volume) : undefined;
      return {
        id: c.id,
        r: radiusOf(c.volume),
        x: prevX ?? size.w / 2 + ((i % 3) - 1) * 40,
        y: prevY ?? size.h / 2 + ((i % 4) - 1.5) * 32,
      };
    });

    const sim = forceSimulation(nodes)
      .force("x", forceX<BubbleNode>(size.w / 2).strength(0.07))
      .force("y", forceY<BubbleNode>(size.h / 2).strength(0.09))
      .force("collide", forceCollide<BubbleNode>((d) => d.r + 8).iterations(2))
      .alpha(reduce ? 0.25 : 0.9)
      .alphaDecay(reduce ? 0.15 : 0.02)
      .on("tick", () => {
        for (const n of nodes) {
          const el = nodeRefs.current.get(n.id);
          if (!el || n.x === undefined || n.y === undefined) continue;
          n.x = Math.max(n.r, Math.min(size.w - n.r, n.x));
          n.y = Math.max(n.r, Math.min(size.h - n.r, n.y));
          el.style.transform = `translate(${n.x - n.r}px, ${n.y - n.r}px)`;
        }
      });

    // Gentle perpetual float.
    let t = 0;
    let raf = 0;
    const float = () => {
      t += 0.005;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!n) continue;
        n.vx = (n.vx ?? 0) + Math.sin(t + i) * 0.008;
        n.vy = (n.vy ?? 0) + Math.cos(t * 0.8 + i) * 0.008;
      }
      sim.alpha(Math.max(sim.alpha(), 0.04));
      raf = requestAnimationFrame(float);
    };
    if (!reduce) raf = requestAnimationFrame(float);

    return () => {
      sim.stop();
      cancelAnimationFrame(raf);
    };
  }, [clusters, size, reduce, radiusOf]);

  return (
    <Card>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Issue map</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Bubble size = volume share · color = dominant sentiment · pulse =
              priority ≥ 70. Click a bubble for the full breakdown.
            </p>
          </div>
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            {clusters.length} clusters
          </span>
        </div>

        <div
          ref={wrapRef}
          className="relative mt-3 h-80 w-full overflow-hidden rounded-xl border border-border bg-background sm:h-96"
        >
          {clusters.length === 0 ? (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              No clusters match these filters.
            </p>
          ) : (
            <AnimatePresence>
              {clusters.map((c) => {
                const color = sentimentColors[dominantSentiment(c)];
                const r = radiusOf(c.volume);
                return (
                  <div
                    key={c.id}
                    ref={(el) => {
                      if (el) nodeRefs.current.set(c.id, el);
                      else nodeRefs.current.delete(c.id);
                    }}
                    className="absolute left-0 top-0"
                    style={{ width: 2 * r, height: 2 * r }}
                  >
                    <motion.button
                      type="button"
                      layoutId={`cluster-bubble-${c.id}`}
                      onClick={() => openCluster(c.id)}
                      onMouseEnter={() => setHoverId(c.id)}
                      onMouseLeave={() =>
                        setHoverId((h) => (h === c.id ? null : h))
                      }
                      onFocus={() => setHoverId(c.id)}
                      onBlur={() => setHoverId((h) => (h === c.id ? null : h))}
                      initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduce ? undefined : { opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      aria-label={`${c.label}: ${c.volume.toLocaleString()} reports, ${(c.negativity * 100).toFixed(0)}% negative, priority ${c.priority.toFixed(1)}. Open details.`}
                      className="group relative flex h-full w-full items-center justify-center rounded-full border-2 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      style={{
                        backgroundColor: `${color}26`,
                        borderColor: color,
                      }}
                    >
                      {c.priority >= 70 && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full opacity-30 motion-safe:animate-ping"
                          style={{ boxShadow: `0 0 0 1px ${color}` }}
                        />
                      )}
                      <span className="max-w-[86%] truncate px-1 text-[10px] font-semibold leading-tight text-foreground sm:text-[11px]">
                        {c.label}
                      </span>

                      <span
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute left-1/2 z-20 w-48 -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-2 text-left text-[11px] leading-4 shadow-lg transition-opacity",
                          hoverId === c.id ? "opacity-100" : "opacity-0",
                        )}
                        style={{ top: "calc(100% + 8px)" }}
                      >
                        <span className="block font-semibold text-foreground">
                          {c.label}
                        </span>
                        <span className="mt-1 block tabular-nums text-muted-foreground">
                          {c.volume.toLocaleString()} reports ·{" "}
                          {(c.negativity * 100).toFixed(0)}% negative
                          <br />
                          Priority {c.priority.toFixed(1)} · {c.owner}
                        </span>
                      </span>
                    </motion.button>
                  </div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {(
            [
              ["positive", "Mostly positive"],
              ["neutral", "Mostly neutral"],
              ["negative", "Mostly negative"],
            ] as const
          ).map(([key, label]) => (
            <li
              key={key}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: sentimentColors[key] }}
              />
              {label}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
