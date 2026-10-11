import { chartColors } from "@/lib/colors";

type SparklineProps = {
  data: number[];
  label: string;
};

// Dependency-free SVG sparkline for cluster cards.
export function Sparkline({ data, label }: SparklineProps) {
  const w = 120;
  const h = 32;
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`)
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label}
    >
      <polyline
        points={points}
        fill="none"
        stroke={chartColors.simulated}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
