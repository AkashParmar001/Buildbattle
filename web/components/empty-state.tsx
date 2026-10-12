import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function EmptyState({
  title,
  description,
  icon: Icon = SearchX,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-lg tracking-tight">{title}</h2>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
