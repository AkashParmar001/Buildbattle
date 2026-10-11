"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Trend } from "@/lib/analytics";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Card, CardContent } from "@/components/ui/card";

const SIM_COLOR = "#6366f1";
const LIVE_COLOR = "#10b981";

export function TrendChart({ data }: { data: Trend }) {
  const weeks = new Set<number>();
  for (const p of data.simulated) weeks.add(p.week);
  for (const p of data.live) weeks.add(p.week);
  const simByWeek = new Map(data.simulated.map((p) => [p.week, p.volume]));
  const liveByWeek = new Map(data.live.map((p) => [p.week, p.volume]));
  const chartData = [...weeks]
    .sort((a, b) => a - b)
    .map((week) => ({
      week,
      label: `W${week}`,
      simulated: simByWeek.get(week) ?? null,
      live: liveByWeek.get(week) ?? null,
    }));
  const liveVolume = data.live.reduce((sum, p) => sum + p.volume, 0);

  return (
    <Card>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Feedback volume trend
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Simulated: 12-week demo timeline (seed). Live: real submission
              dates, last 12 weeks.
            </p>
          </div>
          <span className="ml-auto">
            <SimulatedBadge />
          </span>
        </div>
        <figure
          role="img"
          aria-label={`Simulated weekly volumes: ${data.simulated.map((d) => `week ${d.week}: ${d.volume}`).join(", ")}. Live submissions: ${data.live.filter((d) => d.volume > 0).map((d) => `week ${d.week}: ${d.volume}`).join(", ") || "none"}.`}
          className="mt-2 h-64 text-zinc-500 dark:text-zinc-400"
        >
          {chartData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-zinc-400">
              No trend data yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: -8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fill: "currentColor", fontSize: 11 }} />
                <YAxis tick={{ fill: "currentColor", fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString()} reports`,
                    name === "simulated" ? "Simulated" : "Live",
                  ]}
                  labelFormatter={(label) => `Week ${String(label).slice(1)}`}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend
                  formatter={(value) => [
                    value === "simulated" ? "Simulated (demo)" : "Live (real dates)",
                    "text-zinc-500 dark:text-zinc-400",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="simulated"
                  name="simulated"
                  stroke={SIM_COLOR}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="live"
                  name="live"
                  stroke={LIVE_COLOR}
                  strokeWidth={2}
                  strokeDasharray={liveVolume === 0 ? "4 4" : undefined}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </figure>
      </CardContent>
    </Card>
  );
}
