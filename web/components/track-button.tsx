"use client";

import Link from "next/link";
import { useState } from "react";

export function TrackButton({
  clusterId,
  initialTracked,
}: {
  clusterId: number;
  initialTracked: boolean;
}) {
  const [tracked, setTracked] = useState(initialTracked);
  const [busy, setBusy] = useState(false);

  if (tracked) {
    return (
      <Link
        href="/issues"
        className="inline-flex h-9 items-center rounded-lg border border-emerald-300 px-4 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
      >
        ✓ Tracked — view issues
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        fetch("/api/issues", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ clusterId }),
        })
          .then(() => setTracked(true))
          .catch(() => undefined)
          .finally(() => setBusy(false));
      }}
      className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {busy ? "Tracking…" : "Track issue"}
    </button>
  );
}
