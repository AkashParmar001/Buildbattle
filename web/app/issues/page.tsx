import Link from "next/link";

import { getClusterRows } from "@/lib/db";
import { getIssues, type IssueStatus } from "@/lib/issues";
import { EmptyState } from "@/components/empty-state";
import { IssueCard } from "@/components/issue-card";

const COLUMNS: { status: IssueStatus; title: string }[] = [
  { status: "open", title: "Open" },
  { status: "in_progress", title: "In progress" },
  { status: "resolved", title: "Resolved" },
];

export default async function IssuesPage() {
  const [issues, clusters] = await Promise.all([
    getIssues(),
    getClusterRows(),
  ]);
  const meta = new Map(clusters.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Issues</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {issues.length === 0
              ? "Track clusters as issues from open to resolved."
              : `${issues.length} tracked issue${issues.length === 1 ? "" : "s"} — status and notes persist across refreshes.`}
          </p>
        </div>
        <Link
          href="/recommendations"
          className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          Track from recommendations
        </Link>
      </div>

      {issues.length === 0 ? (
        <EmptyState
          title="No tracked issues"
          description="Prioritized clusters become trackable issues. Head to recommendations and press “Track issue” on anything worth acting on."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const colIssues = issues.filter((i) => i.status === col.status);
            return (
              <section key={col.status} aria-label={`${col.title} issues`}>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight">
                    {col.title}
                  </h2>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {colIssues.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {colIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      clusterLabel={
                        meta.get(issue.clusterId)?.label ??
                        `Cluster ${issue.clusterId}`
                      }
                      clusterPriority={
                        meta.get(issue.clusterId)?.priority ?? null
                      }
                    />
                  ))}
                  {colIssues.length === 0 && (
                    <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                      Nothing here yet.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
