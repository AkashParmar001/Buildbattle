import { Info } from "lucide-react";

// Marks any chart/table built on the simulated 12-week timeline.
// Required by the project data rules — do not remove.
export function SimulatedBadge() {
  return (
    <span
      title="Feedback has no real dates, so the 12-week timeline is simulated."
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
    >
      <Info className="h-3 w-3" />
      Simulated demo timeline
    </span>
  );
}
