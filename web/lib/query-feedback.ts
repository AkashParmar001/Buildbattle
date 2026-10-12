import { getOverlayRows } from "@/lib/feedback-store";
import { getFeedbackRows, type FeedbackRecord, type Sentiment } from "@/lib/db";

export type FeedbackSort = "volume_desc" | "volume_asc" | "text_asc" | "text_desc";

export type FeedbackQuery = {
  q?: string;
  category?: string;
  sentiment?: Sentiment;
  cluster?: number;
  sort?: FeedbackSort;
  page?: number;
};

export type FeedbackQueryResult = {
  rows: FeedbackRecord[];
  page: number;
  totalPages: number;
  totalRows: number;
  totalVolume: number;
  categories: string[];
};

const PAGE_SIZE = 15;

// Shared search/filter/sort/paginate used by GET /api/feedback (Feedback
// drawer). Weights nothing — each row is a unique text; volume lives in count.
export async function queryFeedback(
  params: FeedbackQuery,
): Promise<FeedbackQueryResult> {
  const [base, overlay] = await Promise.all([
    getFeedbackRows(),
    getOverlayRows(),
  ]);
  const all = [...overlay, ...base];
  const categories = [...new Set(all.map((r) => r.category))].sort();

  const q = params.q?.trim() ?? "";
  const qLow = q.toLowerCase();
  const filtered = all.filter(
    (r) =>
      (!params.category || r.category === params.category) &&
      (!params.sentiment || r.sentiment === params.sentiment) &&
      (params.cluster === undefined || r.cluster === params.cluster) &&
      (!qLow ||
        r.text.toLowerCase().includes(qLow) ||
        r.topic.toLowerCase().includes(qLow)),
  );
  const sort = params.sort ?? "volume_desc";
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "volume_asc":
        return a.count - b.count;
      case "text_asc":
        return a.text.localeCompare(b.text);
      case "text_desc":
        return b.text.localeCompare(a.text);
      case "volume_desc":
      default:
        return b.count - a.count;
    }
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page || 1), totalPages);
  const start = (page - 1) * PAGE_SIZE;

  return {
    rows: sorted.slice(start, start + PAGE_SIZE),
    page,
    totalPages,
    totalRows: sorted.length,
    totalVolume: filtered.reduce((sum, r) => sum + r.count, 0),
    categories,
  };
}
