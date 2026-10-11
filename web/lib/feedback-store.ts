import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  addMergeAdjustment,
  getSupabase,
  loadSeedAnalysis,
  mapFeedbackRow,
  type FeedbackRecord,
  type FeedbackRow,
} from "@/lib/db";

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
  /** True when an LLM was configured but the classification call failed. */
  llmFailed?: boolean;
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

const SELECT_COLUMNS =
  "id,text,adapted_text,category,duplicate_count,sentiment,sentiment_score,topic,cluster_id,weekly";

// Duplicate handling: if lower(text) already exists, increment its volume
// instead of inserting. Returns the updated record, or null when no match.
export async function mergeUserFeedback(
  text: string,
): Promise<FeedbackRecord | null> {
  const key = text.trim().toLowerCase();
  const supabase = getSupabase();
  if (supabase) {
    // Scan (fetch) and match case-insensitively in JS: avoids SQL LIKE
    // escaping pitfalls; row counts here are small (hundreds to low thousands).
    const { data, error } = await supabase
      .from("feedback")
      .select(SELECT_COLUMNS)
      .limit(10000);
    if (error) throw new Error(`Supabase feedback read failed: ${error.message}`);
    const match = (data as FeedbackRow[])
      .map(mapFeedbackRow)
      .find((r) => r.text.trim().toLowerCase() === key);
    if (!match) return null;
    const { data: updated, error: updateError } = await supabase
      .from("feedback")
      .update({ duplicate_count: match.count + 1 })
      .eq("id", match.id)
      .select(SELECT_COLUMNS)
      .single();
    if (updateError) {
      throw new Error(`Supabase duplicate merge failed: ${updateError.message}`);
    }
    return mapFeedbackRow(updated as FeedbackRow);
  }

  // Fallback: duplicate of an overlay row -> bump it in place.
  const file = await readOverlayFile();
  const inFile = file.find((r) => r.text.trim().toLowerCase() === key);
  if (inFile) {
    inFile.count += 1;
    try {
      await mkdir(path.dirname(OVERLAY_FILE), { recursive: true });
      await writeFile(OVERLAY_FILE, JSON.stringify(file, null, 1));
    } catch (err) {
      throw new Error(
        `Could not persist duplicate merge: ${err instanceof Error ? err.message : "write failed"}`,
      );
    }
    return inFile;
  }
  const inMemory = memoryOverlay.find((r) => r.text.trim().toLowerCase() === key);
  if (inMemory) {
    inMemory.count += 1;
    return inMemory;
  }

  // Fallback: duplicate of a seed text -> delta overlay (seed file untouched).
  const seed = await loadSeedAnalysis();
  const seedMatch = seed.feedback.find(
    (r) => r.text.trim().toLowerCase() === key,
  );
  if (seedMatch) {
    await addMergeAdjustment(key);
    return { ...seedMatch, count: seedMatch.count + 1 };
  }
  return null;
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
      source: "manual",
      is_simulated_date: false,
      sentiment: record.sentiment,
      sentiment_score: record.score,
      topic: record.topic,
      cluster_id: record.cluster,
      duplicate_count: 1,
      weekly: record.weekly,
      // quality_score doubles as the LLM-failure marker: 0 = flagged.
      quality_score: input.llmFailed ? 0 : null,
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
