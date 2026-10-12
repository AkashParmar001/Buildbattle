export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <div className="h-7 w-48 rounded-lg animate-shimmer" />
        <div className="h-4 w-72 rounded-lg animate-shimmer" />
      </div>
      <div className="h-40 rounded-xl border border-border animate-shimmer" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-border animate-shimmer"
          />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-border animate-shimmer" />
    </div>
  );
}
