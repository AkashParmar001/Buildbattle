"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { Issue, IssueStatus } from "@/lib/issues";
import { onFeedbackChanged } from "@/lib/feedback-refresh";
import { EmptyState } from "@/components/empty-state";
import { IssueCard } from "@/components/issue-card";
import { useCloseOverlay } from "@/components/overlay-utils";

type IssuesPayload = {
  issues: Issue[];
  clusterMeta: { id: number; label: string; priority: number }[];
};

const COLUMNS: { status: IssueStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "in_progress", label: "In progress" },
  { status: "resolved", label: "Resolved" },
];

export function IssuesPanel() {
  const close = useCloseOverlay();
  const [data, setData] = useState<IssuesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIssues = useCallback(async () => {
    try {
      const res = await fetch("/api/issues");
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(json.error ?? "Could not load issues.");
        return;
      }
      setData((await res.json()) as IssuesPayload);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/issues");
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          if (active) setError(json.error ?? "Could not load issues.");
          return;
        }
        const payload = (await res.json()) as IssuesPayload;
        if (active) setData(payload);
      } catch {
        if (active) setError("Network error. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Track/untrack/save anywhere refreshes the panel.
  useEffect(() => onFeedbackChanged(() => void fetchIssues()), [fetchIssues]);

  const metaById = new Map(
    (data?.clusterMeta ?? []).map((m) => [m.id, m]),
  );

  return (
    <div
      className="fixed inset-0 z-40 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Tracked issues"
    >
      <button
        type="button"
        aria-label="Close issues"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-5xl flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">
              Tracked issues
            </h2>
            <p className="text-xs text-muted-foreground">
              Set status and notes per issue — saved to the database (or the
              local snapshot).
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {error ? (
            <EmptyState title="Could not load issues" description={error} />
          ) : loading && !data ? (
            <div
              aria-busy="true"
              aria-label="Loading issues"
              className="grid grid-cols-1 gap-4 md:grid-cols-3"
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : data && data.issues.length === 0 ? (
            <EmptyState
              title="No tracked issues yet"
              description="Track a priority issue from the Command Center to start an investigation here."
            />
          ) : data ? (
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
              {COLUMNS.map(({ status, label }) => {
                const list = data.issues.filter((i) => i.status === status);
                return (
                  <section key={status} className="flex flex-col gap-3">
                    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {label}{" "}
                      <span className="tabular-nums">({list.length})</span>
                    </h3>
                    {list.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                        Nothing here.
                      </p>
                    ) : (
                      list.map((issue) => {
                        const meta = metaById.get(issue.clusterId);
                        return (
                          <IssueCard
                            key={issue.id}
                            issue={issue}
                            clusterLabel={meta?.label ?? `Cluster #${issue.clusterId}`}
                            clusterPriority={meta?.priority ?? null}
                          />
                        );
                      })
                    )}
                  </section>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
