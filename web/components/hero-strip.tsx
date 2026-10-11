"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  "Import feedback",
  "AI analysis",
  "Dashboard",
  "Recommendations",
  "Track & share",
];

const STORAGE_KEY = "insightflow-hero-dismissed";

function subscribe() {
  return () => {};
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

// First-run strip: the 5-step story in ~10 seconds. Dismiss persists.
export function HeroStrip() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [closed, setClosed] = useState(false);

  function dismiss() {
    setClosed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private mode — dismiss for this session only.
    }
  }

  if (stored || closed) return null;

  return (
    <Card className="border-accent/30 bg-accent/[0.04]">
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <p className="text-sm font-semibold tracking-tight">
          From raw reviews to decisions in 5 steps:
        </p>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">→</span>}
              <span className="font-medium">{step}</span>
            </li>
          ))}
        </ol>
        <span className="ml-auto flex items-center gap-2">
          <Link
            href="/pipeline"
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-medium text-white hover:opacity-90"
          >
            See how it works <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss introduction"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </span>
      </CardContent>
    </Card>
  );
}
