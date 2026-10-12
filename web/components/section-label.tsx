import { cn } from "@/lib/utils";

// Mono eyebrow label — "01 — Collect". Static markup; safe to render
// on the server.
export function SectionLabel({
  index,
  label,
  className,
  rule = true,
}: {
  index: number;
  label: string;
  className?: string;
  rule?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="font-mono text-[11px] tracking-[0.18em] text-stone uppercase tabular-nums">
        {String(index).padStart(2, "0")} — {label}
      </span>
      {rule && <span aria-hidden="true" className="h-px flex-1 bg-rule" />}
    </div>
  );
}
