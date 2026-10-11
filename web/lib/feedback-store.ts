import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getSupabase, type FeedbackRecord } from "@/lib/db";

// User-submitted/imported feedback. With Supabase configured it lives in the
// `feedback` table; otherwise it is appended to data/user-feedback.json next
// to the seed (with an in-memory fallback when the filesystem is read-only,
// e.g. serverless). Seed fallback keeps every metric demo-safe.
export type UserFeedbackInput = {
  text: string;
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  topic: string;
  cluster: number;
};

const OVERLAY_FILE = path.join(process.cwd(), "data", "user-feedback.json");

// Session-only fallback when the overlay file cannot be written.
const memoryOverlay: FeedbackRecord[] = [];

function toRecord(input: UserFeedbackInput & { id: string }): FeedbackRecord {
  return {
    id: input.id,
    text: input.text,
    adaptedText: null,
    category: input.category,
    count: 1,
    sentiment: input.sentiment,
    score: input.score,
    topic: input.topic,
    cluster: input.cluster,
    // Real user feedback uses real timestamps, not the simulated timeline:
    // attribute its unit of volume to the latest week.
    weekly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  };
}

async function readOverlayFile(): Promise<FeedbackRecord[]> {
  try {
    const raw = await readFile(OVERLAY_FILE, "utf8");
    return JSON.parse(raw) as FeedbackRecord[];
  } catch {
    return [];
  }
}

export async function getOverlayRows(): Promise<FeedbackRecord[]> {
  if (getSupabase()) return [];
  const file = await readOverlayFile();
  return [...file, ...memoryOverlay];
}

export async function keyOfExisting(): Promise<Set<string>> {
  const { getFeedbackRows } = await import("@/lib/db");
  const rows = await getFeedbackRows();
  const overlay = await getOverlayRows();
  return new Set(
    [...rows, ...overlay].map(
      (r) => `${r.text.trim().toLowerCase()}|||${r.category}`,
    ),
  );
}

export async function addUserFeedback(
  input: UserFeedbackInput,
): Promise<FeedbackRecord> {
  const record = toRecord({ ...input, id: `user-${randomUUID()}` });
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("feedback").insert({
      id: record.id,
      text: record.text,
      adapted_text: null,
      category: record.category,
      source: "user",
      is_simulated_date: false,
      sentiment: record.sentiment,
      sentiment_score: record.score,
      topic: record.topic,
      cluster_id: record.cluster,
      duplicate_count: 1,
      weekly: record.weekly,
    });
    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
    return record;
  }
  try {
    await mkdir(path.dirname(OVERLAY_FILE), { recursive: true });
    const file = await readOverlayFile();
    file.push(record);
    await writeFile(OVERLAY_FILE, JSON.stringify(file, null, 1));
  } catch {
    memoryOverlay.push(record);
  }
  return record;
}
