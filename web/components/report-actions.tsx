"use client";

import { useState } from "react";

export function ReportActions({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(url, window.location.origin).toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90"
      >
        Export PDF
      </button>
      <button
        type="button"
        onClick={() => void copy()}
        className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
      >
        {copied ? "Copied!" : "Copy share link"}
      </button>
    </div>
  );
}
