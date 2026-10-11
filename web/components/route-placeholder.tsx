import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type RoutePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function RoutePlaceholder({
  title,
  description,
  icon: Icon,
}: RoutePlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <p className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            Coming in the next build stage
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
