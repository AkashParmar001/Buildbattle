import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
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
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
          <p
            className={cn(
              "rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500",
              "dark:border-zinc-800 dark:text-zinc-400",
            )}
          >
            Coming in the next build stage
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
