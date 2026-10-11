import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getSupabase } from "@/lib/db";
import type {
  Kpis,
  Recommendation,
  SentimentSlice,
  Trend,
} from "@/lib/analytics";

// Report snapshots. Supabase `reports` table when configured, otherwise a
// local JSON overlay (same pattern as feedback/issues overlays).
export type ReportFilters = {
  category?: string;
  sentiment?: "positive" | "neutral" | "negative";
};

export type ReportSnapshot = {
  filters: ReportFilters;
  meta: {
    total_rows: number;
    unique: number;
    source: string;
    weeks: number;
    dates_simulated: boolean;
  };
  kpis: Kpis;
  sentiment: SentimentSlice[];
  recommendations: Recommendation[];
  trend: Trend;
  createdAt: string;
};

export type StoredReport = {
  token: string;
  snapshot: ReportSnapshot;
  createdAt: string;
};

const OVERLAY_FILE = path.join(process.cwd(), "data", "user-reports.json");
const memoryOverlay: StoredReport[] = [];

async function readOverlayFile(): Promise<StoredReport[]> {
  try {
    return JSON.parse(await readFile(OVERLAY_FILE, "utf8")) as StoredReport[];
  } catch {
    return [];
  }
}

export async function createReport(
  snapshot: ReportSnapshot,
): Promise<StoredReport> {
  const token = randomBytes(12).toString("hex");
  const createdAt = new Date().toISOString();
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("reports").insert({
      share_token: token,
      snapshot: snapshot as unknown as Record<string, unknown>,
    });
    if (error) throw new Error(`Supabase report insert failed: ${error.message}`);
    return { token, snapshot, createdAt };
  }
  const report: StoredReport = { token, snapshot, createdAt };
  try {
    await mkdir(path.dirname(OVERLAY_FILE), { recursive: true });
    const file = await readOverlayFile();
    file.push(report);
    await writeFile(OVERLAY_FILE, JSON.stringify(file, null, 1));
  } catch {
    memoryOverlay.push(report);
  }
  return report;
}

export async function getReport(token: string): Promise<StoredReport | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("reports")
      .select("share_token,snapshot,created_at")
      .eq("share_token", token)
      .maybeSingle();
    if (error) throw new Error(`Supabase report read failed: ${error.message}`);
    if (!data) return null;
    const row = data as {
      share_token: string;
      snapshot: ReportSnapshot;
      created_at: string;
    };
    return {
      token: row.share_token,
      snapshot: row.snapshot,
      createdAt: row.created_at,
    };
  }
  const all = [...(await readOverlayFile()), ...memoryOverlay];
  return all.find((r) => r.token === token) ?? null;
}
