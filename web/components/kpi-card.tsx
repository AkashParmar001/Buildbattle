import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type KpiCardProps = {
  title: string;
  value: ReactNode;
  sub: string;
  icon: LucideIcon;
};

// Editorial KPI: hairline top rule, mono label, oversized serif numeral —
// no card chrome.
export function KpiCard({ title, value, sub, icon: Icon }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-1 border-t border-rule pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] tracking-[0.18em] text-stone uppercase">
          {title}
        </p>
        <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-stone" />
      </div>
      <p className="truncate font-display text-4xl leading-none tracking-tight tabular-nums lg:text-5xl">
        {value}
      </p>
      <p className="truncate text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
