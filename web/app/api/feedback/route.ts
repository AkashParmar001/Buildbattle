import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";

import { classifyFeedback } from "@/lib/classify";
import { refreshClusterStats } from "@/lib/cluster-stats";
import { getClusterRows, type Sentiment } from "@/lib/db";
import { addUserFeedback, mergeUserFeedback } from "@/lib/feedback-store";
import { queryFeedback, type FeedbackSort } from "@/lib/query-feedback";

// Simple in-memory per-IP rate limit (per-instance; documented limitation).
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const rateHits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateHits.get(key);
  if (!entry || now > entry.resetAt) {
    rateHits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX;
}

const VALID_SORTS: FeedbackSort[] = [
  "volume_desc",
  "volume_asc",
  "text_asc",
  "text_desc",
];
const VALID_SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];

// Feedback drawer search/filter/sort/paginate.
export async function GET(req: NextRequest) {
  await connection();
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim() || undefined;
    const category = sp.get("category") || undefined;
    const sentimentRaw = sp.get("sentiment");
    const sentiment =
      sentimentRaw && VALID_SENTIMENTS.includes(sentimentRaw as Sentiment)
        ? (sentimentRaw as Sentiment)
        : undefined;
    const clusterRaw = Number(sp.get("cluster"));
    const cluster =
      sp.get("cluster") !== null &&
      Number.isInteger(clusterRaw) &&
      clusterRaw >= -1
        ? clusterRaw
        : undefined;
    const sortRaw = sp.get("sort");
    const sort =
      sortRaw && VALID_SORTS.includes(sortRaw as FeedbackSort)
        ? (sortRaw as FeedbackSort)
        : "volume_desc";
    const page = Number(sp.get("page")) || 1;

    const result = await queryFeedback({ q, category, sentiment, cluster, sort, page });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load feedback." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  await connection();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { text, category } = (body ?? {}) as {
    text?: unknown;
    category?: unknown;
  };
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (trimmed.length < 10) {
    return NextResponse.json(
      { error: "Review text must be at least 10 characters." },
      { status: 400 },
    );
  }
  if (trimmed.length > 1000) {
    return NextResponse.json(
      { error: "Review text must be at most 1000 characters." },
      { status: 400 },
    );
  }
  if (typeof category !== "string" || category.trim().length === 0) {
    return NextResponse.json(
      { error: "Category is required." },
      { status: 400 },
    );
  }

  try {
    // Duplicate handling first: lower(text) already exists -> increment.
    const merged = await mergeUserFeedback(trimmed);
    if (merged) {
      await refreshClusterStats();
      revalidatePath("/");
      revalidatePath("/app");

      return NextResponse.json(
        { record: merged, merged: true, llmFallback: false },
        { status: 200 },
      );
    }

    const clusters = await getClusterRows();
    const classification = await classifyFeedback(
      trimmed,
      category.trim(),
      clusters,
    );
    const record = await addUserFeedback({
      text: trimmed,
      category: category.trim(),
      sentiment: classification.sentiment,
      score: classification.score,
      topic: classification.topic,
      cluster: classification.cluster,
      llmFailed: classification.llmFailed,
    });

    await refreshClusterStats();
    revalidatePath("/");
    revalidatePath("/app");

    return NextResponse.json(
      { record, merged: false, llmFallback: classification.llmFailed },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: `Could not save feedback: ${err instanceof Error ? err.message : "unknown error"}`,
      },
      { status: 500 },
    );
  }
}
