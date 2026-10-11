import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Server-side only. Never import this module from client components.

export type Sentiment = "positive" | "neutral" | "negative";

export type AnalyticsFilters = {
  category?: string;
  sentiment?: Sentiment;
  cluster?: number;
};

export type FeedbackRecord = {
  id: string;
  text: string;
  adaptedText: string | null;
  category: string;
  /** Duplicate count — every metric must weight by this, never by row. */
  count: number;
  sentiment: Sentiment;
  score: number;
  topic: string;
  cluster: number;
  weekly: number[];
};

export type ClusterRecord = {
  id: number;
  label: string;
  summary: string;
  volume: number;
  share: number;
  negativity: number;
  growth: number;
  priority: number;
  recommendation: string;
  owner: string;
  why: string;
  weekly: number[];
  examples: string[];
};

export type AnalysisMeta = {
  total_rows: number;
  unique: number;
  source: string;
  weeks: number;
  dates_simulated: boolean;
};

export type AnalysisData = {
  meta: AnalysisMeta;
  feedback: FeedbackRecord[];
  clusters: ClusterRecord[];
};

export function isSupabaseConfigured(): boolean {
  return (
    !!process.env.SUPABASE_URL &&
    !!(
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY
    )
  );
}

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (!isSupabaseConfigured()) {
    client = null;
    return client;
  }
  client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_ANON_KEY!,
  );
  return client;
}

// Bundled seed for demo safety (and for Vercel builds with root = web/).
// Never shipped to the client — only read here, server-side.
let seedPromise: Promise<AnalysisData> | undefined;

export function loadSeedAnalysis(): Promise<AnalysisData> {
  seedPromise ??= readFile(
    path.join(process.cwd(), "data", "analysis.json"),
    "utf8",
  ).then((raw) => JSON.parse(raw) as AnalysisData);
  return seedPromise;
}

// Merge adjustments: in fallback mode a duplicate submission of a seed text
// increments its volume. The committed seed file stays untouched; deltas live
// in a gitignored overlay and are applied on read (read fresh each call —
// not memoised — so later increments show up).
const MERGE_FILE = path.join(process.cwd(), "data", "user-merges.json");

export async function loadMergeAdjustments(): Promise<Record<string, number>> {
  try {
    return JSON.parse(await readFile(MERGE_FILE, "utf8")) as Record<
      string,
      number
    >;
  } catch {
    return {};
  }
}

export async function addMergeAdjustment(text: string): Promise<void> {
  const key = text.trim().toLowerCase();
  const current = await loadMergeAdjustments();
  current[key] = (current[key] ?? 0) + 1;
  await mkdir(path.dirname(MERGE_FILE), { recursive: true });
  await writeFile(MERGE_FILE, JSON.stringify(current, null, 1));
}

export type FeedbackRow = {
  id: string;
  text: string;
  adapted_text: string | null;
  category: string;
  duplicate_count: number;
  sentiment: Sentiment;
  sentiment_score: number;
  topic: string;
  cluster_id: number;
  weekly: number[];
};

export function mapFeedbackRow(row: FeedbackRow): FeedbackRecord {
  return {
    id: row.id,
    text: row.text,
    adaptedText: row.adapted_text,
    category: row.category,
    count: row.duplicate_count,
    sentiment: row.sentiment,
    score: row.sentiment_score,
    topic: row.topic,
    cluster: row.cluster_id,
    weekly: row.weekly,
  };
}

export async function getFeedbackRows(): Promise<FeedbackRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    // Explicit limit: PostgREST defaults to 1000 rows otherwise.
    const { data, error } = await supabase
      .from("feedback")
      .select(
        "id,text,adapted_text,category,duplicate_count,sentiment,sentiment_score,topic,cluster_id,weekly",
      )
      .limit(10000);
    if (error) throw new Error(`Supabase feedback read failed: ${error.message}`);
    return (data as FeedbackRow[]).map(mapFeedbackRow);
  }
  const seed = await loadSeedAnalysis();
  const adjustments = await loadMergeAdjustments();
  const keys = Object.keys(adjustments);
  if (keys.length === 0) return seed.feedback;
  // Apply volume merges onto matching seed texts (count only — seed weekly
  // arrays stay simulated; live volume is shown as the separate Live series).
  return seed.feedback.map((r) => {
    const delta = adjustments[r.text.trim().toLowerCase()];
    return delta ? { ...r, count: r.count + delta } : r;
  });
}

export async function getClusterRows(): Promise<ClusterRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("clusters").select(
      "id,label,summary,volume,share,negativity,growth,priority,recommendation,owner,why,weekly,examples",
    );
    if (error) throw new Error(`Supabase clusters read failed: ${error.message}`);
    return data as ClusterRecord[];
  }
  return (await loadSeedAnalysis()).clusters;
}

export async function getDataSource(): Promise<"supabase" | "seed"> {
  return getSupabase() ? "supabase" : "seed";
}
