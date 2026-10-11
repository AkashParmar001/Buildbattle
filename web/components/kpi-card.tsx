import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type KpiCardProps = {
  title: string;
  value: string;
  sub: string;
  icon: LucideIcon;
};

export function KpiCard({ title, value, sub, icon: Icon }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {title}
          </p>
          <p className="mt-1 truncate text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {sub}
          </p>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </CardContent>
    </Card>
  );
}
