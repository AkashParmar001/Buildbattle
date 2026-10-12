import { Info } from "lucide-react";

// Marks any chart/table built on the simulated 12-week timeline.
// Required by the project data rules — do not remove.
export function SimulatedBadge() {
  return (
    <span
      title="Feedback has no real dates, so the 12-week timeline is simulated."
      className="inline-flex shrink-0 items-center gap-1 border border-rule px-2.5 py-0.5 font-mono text-[11px] tracking-[0.14em] text-stone uppercase"
    >
      <Info className="h-3 w-3" />
      Simulated demo timeline
    </span>
  );
}
