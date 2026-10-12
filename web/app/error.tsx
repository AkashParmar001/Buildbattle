"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-lg font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-sm leading-6 text-muted-foreground">
        {error.message || "This section could not be loaded. Your data is safe — try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
      >
        Try again
      </button>
    </div>
  );
}
