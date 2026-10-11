import { classifyFeedback } from "@/lib/classify";
import { refreshClusterStats } from "@/lib/cluster-stats";
import { getClusterRows, getFeedbackRows, getSupabase } from "@/lib/db";
import {
  addUserFeedback,
  getOverlayRows,
  mergeUserFeedback,
} from "@/lib/feedback-store";

export type ImportResult = { added: number; merged: number; failed: number };

const MAX_ROWS = 2000;
const CLASSIFY_BATCH = 40;
const MIN_LEN = 3;
const MAX_LEN = 2000;

/** Thrown for caller mistakes (bad body, row limits) -> HTTP 400. */
export class ImportValidationError extends Error {}

type NormalRow = { text: string; category: string; extra: number };

function normalizeRows(rawRows: unknown): { rows: NormalRow[]; failed: number } {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new ImportValidationError("Provide a non-empty rows array.");
  }
  if (rawRows.length > MAX_ROWS) {
    throw new ImportValidationError(
      `Import limited to ${MAX_ROWS} rows per batch.`,
    );
  }
  let failed = 0;
  const normalized: NormalRow[] = [];
  for (const row of rawRows) {
    const { text, category } = (row ?? {}) as {
      text?: unknown;
      category?: unknown;
    };
    if (
      typeof text !== "string" ||
      text.trim().length < MIN_LEN ||
      text.length > MAX_LEN ||
      typeof category !== "string" ||
      category.trim().length === 0
    ) {
      failed++;
      continue;
    }
    normalized.push({ text: text.trim(), category: category.trim(), extra: 0 });
  }
  // Dedupe by lower(text) within the batch: first occurrence wins.
  const byKey = new Map<string, NormalRow>();
  for (const r of normalized) {
    const hit = byKey.get(r.text.toLowerCase());
    if (hit) hit.extra++;
    else byKey.set(r.text.toLowerCase(), r);
  }
  return { rows: [...byKey.values()], failed };
}

async function classifyAndInsert(rows: NormalRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const clusters = await getClusterRows();
  let added = 0;
  for (let i = 0; i < rows.length; i += CLASSIFY_BATCH) {
    const batch = rows.slice(i, i + CLASSIFY_BATCH);
    const classifications = await Promise.all(
      batch.map((r) => classifyFeedback(r.text, r.category, clusters)),
    );
    await Promise.all(
      batch.map((r, j) => {
        const c = classifications[j];
        return addUserFeedback({
          text: r.text,
          category: r.category,
          sentiment: c.sentiment,
          score: c.score,
          topic: c.topic,
          cluster: c.cluster,
          llmFailed: c.llmFailed,
          extraCount: r.extra,
          source: "csv",
        });
      }),
    );
    added += batch.length;
  }
  return added;
}

// Shared by POST /api/import and the legacy POST /api/feedback/import.
// Dedupes by lower(text): existing text increments its count (merged),
// new text is classified in batches of 40 and inserted with source='csv'.
export async function importFeedback(rawRows: unknown): Promise<ImportResult> {
  const { rows: unique, failed } = normalizeRows(rawRows);
  const supabase = getSupabase();
  let merged = 0;

  if (supabase) {
    // One table scan; duplicates accumulate per id, applied as batched updates.
    const { data, error } = await supabase
      .from("feedback")
      .select("id,text,duplicate_count")
      .limit(10000);
    if (error) throw new Error(`Supabase feedback read failed: ${error.message}`);
    const existing = new Map<string, { id: string; base: number; next: number }>();
    for (const r of data as { id: string; text: string; duplicate_count: number }[]) {
      existing.set(r.text.trim().toLowerCase(), {
        id: r.id,
        base: r.duplicate_count,
        next: r.duplicate_count,
      });
    }
    const toInsert: NormalRow[] = [];
    for (const r of unique) {
      const hit = existing.get(r.text.toLowerCase());
      if (hit) {
        const times = 1 + r.extra;
        hit.next += times;
        merged += times;
      } else {
        toInsert.push(r);
      }
    }
    const added = await classifyAndInsert(toInsert);
    const changed = [...existing.values()].filter((v) => v.next > v.base);
    for (let i = 0; i < changed.length; i += CLASSIFY_BATCH) {
      const results = await Promise.all(
        changed.slice(i, i + CLASSIFY_BATCH).map((v) =>
          supabase
            .from("feedback")
            .update({ duplicate_count: v.next })
            .eq("id", v.id),
        ),
      );
      const bad = results.find((r) => r.error);
      if (bad?.error) throw new Error(`Supabase merge failed: ${bad.error.message}`);
    }
    await refreshClusterStats();
    return { added, merged, failed };
  }

  // Fallback (seed mode): existing = seed+adjustments and user overlay rows.
  const [seedRows, overlayRows] = await Promise.all([
    getFeedbackRows(),
    getOverlayRows(),
  ]);
  const existingKeys = new Set(
    [...seedRows, ...overlayRows].map((r) => r.text.trim().toLowerCase()),
  );
  const toInsert: NormalRow[] = [];
  for (const r of unique) {
    if (existingKeys.has(r.text.toLowerCase())) {
      const times = 1 + r.extra;
      for (let i = 0; i < times; i++) await mergeUserFeedback(r.text);
      merged += times;
    } else {
      toInsert.push(r);
    }
  }
  const added = await classifyAndInsert(toInsert);
  return { added, merged, failed };
}
