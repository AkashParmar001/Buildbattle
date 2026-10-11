"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { SentimentSlice } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";

const COLORS: Record<SentimentSlice["sentiment"], string> = {
  positive: "#10b981",
  neutral: "#a1a1aa",
  negative: "#f43f5e",
};

export function SentimentDonut({ data }: { data: SentimentSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.volume, 0);
  return (
    <Card>
      <CardContent>
        <h2 className="text-sm font-semibold tracking-tight">
          Sentiment mix
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Share of feedback volume
        </p>
        <figure
          role="img"
          aria-label={`Sentiment: ${data.map((d) => `${d.sentiment} ${(d.share * 100).toFixed(1)} percent`).join(", ")}`}
          className="mt-2 h-56"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="volume"
                nameKey="sentiment"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((d) => (
                  <Cell key={d.sentiment} fill={COLORS[d.sentiment]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  `${Number(value).toLocaleString()} reports`,
                  String(name),
                ]}
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderColor: "var(--background)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </figure>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {data.map((d) => (
            <li
              key={d.sentiment}
              className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300"
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[d.sentiment] }}
              />
              <span className="font-medium capitalize">{d.sentiment}</span>
              <span className="tabular-nums">
                {d.volume.toLocaleString()} ({(d.share * 100).toFixed(1)}%)
              </span>
            </li>
          ))}
        </ul>
        <p className="sr-only">Total {total.toLocaleString()} reports.</p>
      </CardContent>
    </Card>
  );
}
