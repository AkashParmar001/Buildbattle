// Ink and Indigo semantic palette — the ONLY place hex colors are defined
// (globals.css owns the neutral theme tokens). Components must import from
// here; never hardcode hex in components.

export type Sentiment = "positive" | "neutral" | "negative";

/** Solid hues for chart fills, dots and areas (non-text). */
export const sentimentColors: Record<Sentiment, string> = {
  positive: "#10B981",
  neutral: "#94A3B8",
  negative: "#F43F5E",
};

/** AA-safe text/tint classes for sentiment badges (label always shown too). */
export const sentimentBadgeClass: Record<Sentiment, string> = {
  positive: "bg-[#10B981]/10 text-[#047857] dark:text-[#34D399]",
  neutral: "bg-[#94A3B8]/15 text-[#475569] dark:text-[#94A3B8]",
  negative: "bg-[#F43F5E]/10 text-[#BE123C] dark:text-[#FDA4AF]",
};

export const categoryColors: Record<string, string> = {
  "Operational Issues": "#0EA5E9",
  "Fraud and Scam": "#F97316",
  "Product Feedback": "#8B5CF6",
  "Customer Service": "#14B8A6",
};

export const fallbackCategoryColor = "#64748B";

export function categoryColor(category: string): string {
  return categoryColors[category] ?? fallbackCategoryColor;
}

/** Solid hues for priority swatches (bars, dots, badge fills). */
export const priorityColors = {
  low: "#94A3B8",
  medium: "#F59E0B",
  high: "#EF4444",
} as const;

export type PriorityTier = keyof typeof priorityColors;

export const priorityTierLabel: Record<PriorityTier, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

// 0-39 low, 40-69 medium, 70-100 high (fraud-boosted scores can exceed 100).
export function priorityTier(score: number): PriorityTier {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/** AA-safe priority text classes — pair with the word label, never color alone. */
export const priorityTextClass: Record<PriorityTier, string> = {
  low: "text-[#475569] dark:text-[#94A3B8]",
  medium: "text-[#B45309] dark:text-[#F59E0B]",
  high: "text-[#DC2626] dark:text-[#EF4444]",
};

/** Hex with alpha (0-1) — for inline chart gradients and tinted dots. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Static chart hues that stay legible (>=3:1) on both light and dark cards. */
export const chartColors = {
  /** Mid accent tone — readable on #F8FAFC and #121830 alike. */
  simulated: "#6366F1",
  /** Foreground-neutral overlay line (dashed, secondary to simulated). */
  live: "#64748B",
  /** Neutral ranking bars — categories carry their own colors elsewhere. */
  bar: "#64748B",
} as const;
