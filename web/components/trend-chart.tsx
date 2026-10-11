"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrendPoint } from "@/lib/analytics";
import { SimulatedBadge } from "@/components/simulated-badge";
import { Card, CardContent } from "@/components/ui/card";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const chartData = data.map((d) => ({ ...d, label: `W${d.week}` }));
  return (
    <Card>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Feedback volume trend
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Weekly report volume over 12 weeks
            </p>
          </div>
          <span className="ml-auto">
            <SimulatedBadge />
          </span>
        </div>
        <figure
          role="img"
          aria-label={`Weekly volumes: ${data.map((d) => `week ${d.week}: ${d.volume}`).join(", ")}`}
          className="mt-2 h-64 text-zinc-500 dark:text-zinc-400"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: -8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.2} />
              <XAxis dataKey="label" tick={{ fill: "currentColor", fontSize: 11 }} />
              <YAxis tick={{ fill: "currentColor", fontSize: 11 }} />
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toLocaleString()} reports`,
                  "Volume",
                ]}
                labelFormatter={(label) => `Week ${String(label).slice(1)}`}
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </figure>
      </CardContent>
    </Card>
  );
}
