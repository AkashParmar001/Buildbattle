"use client";

import Link from "next/link";
import { useState } from "react";

import { notifyFeedbackChanged } from "@/lib/feedback-refresh";

export function TrackButton({
  clusterId,
  initialTracked,
}: {
  clusterId: number;
  initialTracked: boolean;
}) {
  const [tracked, setTracked] = useState(initialTracked);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (tracked) {
    return (
      <Link
        href="/app?overlay=issues"
        className="inline-flex h-9 items-center rounded-lg border border-emerald-300 px-4 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
      >
        ✓ Tracked — view issues
      </Link>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError(null);
          fetch("/api/issues", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ clusterId }),
          })
            .then(async (res) => {
              if (res.ok) {
                setTracked(true);
                notifyFeedbackChanged();
                return;
              }
              const json = (await res.json().catch(() => ({}))) as {
                error?: string;
              };
              setError(json.error ?? "Could not track this issue.");
            })
            .catch(() => setError("Network error. Please try again."))
            .finally(() => setBusy(false));
        }}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
      >
        {busy ? "Tracking…" : "Track issue"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </span>
      )}
    </span>
  );
}
