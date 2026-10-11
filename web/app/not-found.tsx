import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-lg font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="text-sm leading-6 text-muted-foreground">
        This link may be mistyped — or a shared report token that no longer
        exists on this device.
      </p>
      <Link
        href="/"
        className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
