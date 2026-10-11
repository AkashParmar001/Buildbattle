"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TopIssue } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";

export function TopIssuesChart({ data }: { data: TopIssue[] }) {
  const chartData = data.map((d) => ({
    ...d,
    shortLabel:
      d.label.length > 22 ? `${d.label.slice(0, 21)}…` : d.label,
  }));
  return (
    <Card>
      <CardContent>
        <h2 className="text-sm font-semibold tracking-tight">
          Top issues by volume
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Ranked by priority score
        </p>
        <figure
          role="img"
          aria-label={`Top issues: ${data.map((d) => `${d.label}, ${d.volume} reports`).join("; ")}`}
          className="mt-2 h-64 text-zinc-500 dark:text-zinc-400"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" opacity={0.2} />
              <XAxis type="number" tick={{ fill: "currentColor", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="shortLabel"
                width={110}
                tick={{ fill: "currentColor", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "volume")
                    return [`${Number(value).toLocaleString()} reports`, "Volume"];
                  return [value, name];
                }}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.label ?? ""
                }
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="volume" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </figure>
      </CardContent>
    </Card>
  );
}
