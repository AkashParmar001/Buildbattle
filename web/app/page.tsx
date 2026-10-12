import Link from "next/link";

// Landing placeholder — replaced by the hero galaxy + scroll story in Phase C.
export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-lg font-bold text-accent-foreground">
        I
      </span>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Know which customer problem to fix first.
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          InsightFlow turns 7,000 raw feedback rows into deduped, Adaption-
          refined insights, 10 explainable clusters, and a ranked action queue
          — every number traceable to source data.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/app"
          className="inline-flex h-11 items-center rounded-lg bg-accent px-6 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          Open the Command Center
        </Link>
        <a
          href="#"
          className="inline-flex h-11 items-center rounded-lg border border-border px-6 text-sm font-medium hover:bg-muted"
        >
          How it works
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        Frontend Arena Build Battle 2026 · demo data, no keys required
      </p>
    </main>
  );
}
