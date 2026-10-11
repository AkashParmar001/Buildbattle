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
  const [busy, setBusy] = useState(false);

  async function recheck() {
    setBusy(true);
    try {
      const res = await fetch("/api/pipeline/recheck", { method: "POST" });
      setResult((await res.json()) as RecheckResult);
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
          className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Re-check pipeline status"}
        </button>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Demo check only — a full re-run needs API keys and runs offline.
        </span>
      </div>
      {result && (
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-300">
          {result.ok ? "✓ " : "✕ "}
          {result.steps.filter((s) => s.present).length}/
          {result.steps.length} artifacts present. {result.note}
        </p>
      )}
    </div>
  );
}
