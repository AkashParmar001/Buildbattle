"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-5 py-24 text-center">
      <p className="font-mono text-[11px] tracking-[0.18em] text-stone uppercase">
        Something interrupted the signal
      </p>
      <h1 className="font-display text-5xl leading-tight tracking-tight sm:text-6xl">
        This section couldn&apos;t load.
      </h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        {error.message || "Your data is safe — try again."}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
        <Link
          href="/app"
          className="inline-flex h-11 items-center border border-rule px-6 text-sm hover:bg-muted"
        >
          Back to Command Center
        </Link>
      </div>
    </div>
  );
}
