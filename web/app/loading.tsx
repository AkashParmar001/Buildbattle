export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="flex animate-pulse flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <div className="h-7 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-72 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="h-11 w-11 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
