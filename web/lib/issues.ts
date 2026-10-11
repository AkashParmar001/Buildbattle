import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getSupabase } from "@/lib/db";

// Tracked issues. Supabase `issues` table when configured, otherwise a local
// JSON overlay (same pattern as user feedback). Track creation is idempotent
// per cluster: tracking the same cluster twice returns the existing issue.
export type IssueStatus = "open" | "in_progress" | "resolved";

export type Issue = {
  id: string;
  clusterId: number;
  title: string;
  status: IssueStatus;
  notes: string;
  createdAt: string;
};

const OVERLAY_FILE = path.join(process.cwd(), "data", "user-issues.json");
const memoryOverlay: Issue[] = [];

type IssueRow = {
  id: string;
  cluster_id: number;
  title: string;
  status: IssueStatus;
  notes: string | null;
  created_at: string;
};

function mapRow(row: IssueRow): Issue {
  return {
    id: row.id,
    clusterId: row.cluster_id,
    title: row.title,
    status: row.status,
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

async function readOverlayFile(): Promise<Issue[]> {
  try {
    return JSON.parse(await readFile(OVERLAY_FILE, "utf8")) as Issue[];
  } catch {
    return [];
  }
}

async function writeOverlayFile(issues: Issue[]): Promise<boolean> {
  try {
    await mkdir(path.dirname(OVERLAY_FILE), { recursive: true });
    await writeFile(OVERLAY_FILE, JSON.stringify(issues, null, 1));
    return true;
  } catch {
    return false;
  }
}

export async function getIssues(): Promise<Issue[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("issues")
      .select("id,cluster_id,title,status,notes,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Supabase issues read failed: ${error.message}`);
    return (data as IssueRow[]).map(mapRow);
  }
  return [...(await readOverlayFile()), ...memoryOverlay].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function getIssueTrackedClusterIds(): Promise<number[]> {
  return (await getIssues()).map((i) => i.clusterId);
}

export async function trackIssue(
  clusterId: number,
  title: string,
): Promise<{ issue: Issue; created: boolean }> {
  const existing = (await getIssues()).find((i) => i.clusterId === clusterId);
  if (existing) return { issue: existing, created: false };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("issues")
      .insert({ cluster_id: clusterId, title, status: "open", notes: "" })
      .select("id,cluster_id,title,status,notes,created_at")
      .single();
    if (error) throw new Error(`Supabase issue insert failed: ${error.message}`);
    return { issue: mapRow(data as IssueRow), created: true };
  }

  const issue: Issue = {
    id: `issue-${randomUUID()}`,
    clusterId,
    title,
    status: "open",
    notes: "",
    createdAt: new Date().toISOString(),
  };
  const ok = await writeOverlayFile([...(await readOverlayFile()), issue]);
  if (!ok) memoryOverlay.push(issue);
  return { issue, created: true };
}

export async function updateIssue(
  id: string,
  patch: { status?: IssueStatus; notes?: string },
): Promise<Issue> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("issues")
      .update({ ...(patch.status ? { status: patch.status } : {}), ...(patch.notes !== undefined ? { notes: patch.notes } : {}) })
      .eq("id", id)
      .select("id,cluster_id,title,status,notes,created_at");
    if (error) throw new Error(`Supabase issue update failed: ${error.message}`);
    const rows = data as IssueRow[];
    if (!rows.length) throw new Error("Issue not found.");
    return mapRow(rows[0]);
  }
  const file = await readOverlayFile();
  const all = [...file, ...memoryOverlay];
  const issue = all.find((i) => i.id === id);
  if (!issue) throw new Error("Issue not found.");
  if (patch.status) issue.status = patch.status;
  if (patch.notes !== undefined) issue.notes = patch.notes;
  const inFile = file.some((i) => i.id === id);
  if (inFile) await writeOverlayFile(file);
  return issue;
}
