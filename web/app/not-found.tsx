import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-5 py-24 text-center">
      <p className="font-mono text-[11px] tracking-[0.18em] text-stone uppercase">
        404 — off the map
      </p>
      <h1 className="font-display text-5xl leading-tight tracking-tight sm:text-6xl">
        This page got lost in the noise.
      </h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        The link may be mistyped — or a shared report token that no longer
        exists on this device.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/app"
          className="inline-flex h-11 items-center bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          Open the Command Center →
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center border border-rule px-6 text-sm hover:bg-muted"
        >
          Back to intro
        </Link>
      </div>
    </div>
  );
}
