// Editorial Noir semantic palette — the ONLY place hex colors are defined
// (globals.css owns the neutral theme tokens: ink, charcoal, bone, stone,
// hairline, accent). Components must import from here; never hardcode hex.

export type Sentiment = "positive" | "neutral" | "negative";

/** Solid hues for chart fills, dots and areas (non-text). */
export const sentimentColors: Record<Sentiment, string> = {
  positive: "#5DD6A2",
  neutral: "#8B867B",
  negative: "#FF5A4E",
};

/** AA-safe text/tint classes for sentiment badges (label always shown too). */
export const sentimentBadgeClass: Record<Sentiment, string> = {
  positive: "bg-[#5DD6A2]/15 text-[#1D7A55] dark:text-[#5DD6A2]",
  neutral: "bg-[#8B867B]/15 text-[#5F5A51] dark:text-[#A5A093]",
  negative: "bg-[#FF5A4E]/12 text-[#B32B1F] dark:text-[#FF8074]",
};

export const categoryColors: Record<string, string> = {
  "Operational Issues": "#2B7BB8",
  "Fraud and Scam": "#C96A2B",
  "Product Feedback": "#6D5BD0",
  "Customer Service": "#1F9B8E",
};

export const fallbackCategoryColor = "#8B867B";

export function categoryColor(category: string): string {
  return categoryColors[category] ?? fallbackCategoryColor;
}

/** Solid hues for priority swatches (bars, dots, badge fills). */
export const priorityColors = {
  low: "#8B867B",
  medium: "#5F5A51",
  high: "#FF5A4E",
} as const;

export type PriorityTier = keyof typeof priorityColors;

export const priorityTierLabel: Record<PriorityTier, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

// 0-39 low, 40-69 medium, 70-100 high (scores clamp at 100).
export function priorityTier(score: number): PriorityTier {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/** AA-safe priority text classes — pair with the word label, never color alone. */
export const priorityTextClass: Record<PriorityTier, string> = {
  low: "text-[#5F5A51] dark:text-[#A5A093]",
  medium: "text-[#3D3A33] dark:text-[#D6D1C4]",
  high: "text-[#B32B1F] dark:text-[#FF8074]",
};

/** Hex with alpha (0-1) — for inline chart gradients and tinted dots. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Static chart hues that stay legible on both bone and charcoal cards. */
export const chartColors = {
  /** Primary series uses `currentColor` (theme foreground) in charts. */
  simulated: "#0C0C0B",
  /** Secondary overlay line (dashed) — stone reads on either surface. */
  live: "#8B867B",
  /** Neutral ranking bars — categories carry their own colors elsewhere. */
  bar: "#2A2925",
} as const;
