"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Sentiment } from "@/lib/db";

export function ReportButton({
  filters,
}: {
  filters: { category?: string; sentiment?: Sentiment };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(filters),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "Could not generate the report.");
        return;
      }
      router.push(json.url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => void generate()}
        disabled={busy}
        className="inline-flex h-9 shrink-0 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
      >
        {busy ? "Generating…" : "Share report"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </span>
      )}
    </span>
  );
}
