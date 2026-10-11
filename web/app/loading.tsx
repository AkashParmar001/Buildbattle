export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="flex animate-pulse flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <div className="h-7 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-72 rounded-lg bg-muted" />
      </div>
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="h-11 w-11 rounded-xl bg-muted" />
          <div className="h-5 w-40 rounded-lg bg-muted" />
          <div className="h-4 w-64 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
