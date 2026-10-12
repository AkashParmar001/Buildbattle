"use client";

import { useState } from "react";

type RecheckResult = {
  mode: string;
  ok: boolean;
  steps: { file: string; present: boolean }[];
  note: string;
};

export function RecheckButton() {
  const [result, setResult] = useState<RecheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function recheck() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pipeline/recheck", { method: "POST" });
      const json = (await res.json()) as RecheckResult & { error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? "Re-check failed.");
        return;
      }
      setResult(json);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void recheck()}
          disabled={busy}
          className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Checking…" : "Re-check pipeline status"}
        </button>
        <span className="text-xs text-muted-foreground">
          Demo check only — a full re-run needs API keys and runs offline.
        </span>
      </div>
      {result && (
        <p role="status" className="text-sm text-muted-foreground">
          {result.ok ? "✓ " : "✕ "}
          {result.steps.filter((s) => s.present).length}/
          {result.steps.length} artifacts present. {result.note}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
