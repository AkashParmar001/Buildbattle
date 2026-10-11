"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SAMPLES = [
  {
    text: "The delivery driver left my package in the rain and everything inside was soaked.",
    category: "Operational Issues",
  },
  {
    text: "Someone called pretending to be support and asked for my card number. I hung up immediately.",
    category: "Fraud and Scam",
  },
  {
    text: "Battery life is outstanding, easily two days of heavy use. Best purchase this year.",
    category: "Product Feedback",
  },
  {
    text: "The agent stayed on the line until my refund was confirmed. Genuinely impressive service.",
    category: "Customer Service",
  },
  {
    text: "Checkout kept rejecting my valid coupon code three times before it finally worked.",
    category: "Operational Issues",
  },
  {
    text: "Setup took five minutes and the instructions were crystal clear. Very happy so far.",
    category: "Product Feedback",
  },
];

export function LoadSampleButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    setDone(null);
    try {
      const res = await fetch("/api/feedback/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: SAMPLES }),
      });
      const json = (await res.json()) as {
        error?: string;
        inserted?: number;
        skippedDuplicates?: number;
      };
      if (!res.ok) {
        setDone(json.error ?? "Could not load samples.");
        return;
      }
      setDone(
        json.inserted === 0
          ? "Samples already loaded — nothing new to add."
          : `Loaded ${json.inserted} sample reviews.`,
      );
      router.refresh();
    } catch {
      setDone("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => void load()}
        disabled={busy}
        className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        {busy ? "Loading…" : "Load sample data"}
      </button>
      {done && (
        <span role="status" className="text-xs text-zinc-500 dark:text-zinc-400">
          {done}
        </span>
      )}
    </span>
  );
}
