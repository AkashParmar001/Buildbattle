"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Issue, IssueStatus } from "@/lib/issues";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_LABEL: Record<IssueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

export function IssueCard({
  issue,
  clusterLabel,
  clusterPriority,
}: {
  issue: Issue;
  clusterLabel: string;
  clusterPriority: number | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [notes, setNotes] = useState(issue.notes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = status !== issue.status || notes !== issue.notes;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "Could not save changes.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2.5">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{issue.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <Link
              href={`/feedback?cluster=${issue.clusterId}`}
              className="text-accent hover:underline"
            >
              {clusterLabel}
            </Link>
            {clusterPriority !== null &&
              ` · priority ${clusterPriority.toFixed(1)}`}
            {" · "}
            tracked {new Date(issue.createdAt).toLocaleDateString()}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <span className="font-medium text-muted-foreground">
            Status
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as IssueStatus)}
            aria-label={`Status for ${issue.title}`}
            className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-medium"
          >
            {(Object.keys(STATUS_LABEL) as IssueStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Add investigation notes…"
            aria-label={`Notes for ${issue.title}`}
            className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs leading-5"
          />
        </label>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !dirty}
          className="h-8 self-start rounded-lg bg-accent px-3 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {error && (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
