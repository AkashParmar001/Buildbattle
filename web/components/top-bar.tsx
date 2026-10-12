"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Inbox, Sparkles, Tags } from "lucide-react";

import { overlayHref } from "@/components/overlay-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const OVERLAY_ITEMS = [
  { overlay: "feedback", label: "Feedback", icon: Inbox },
  { overlay: "issues", label: "Issues", icon: Tags },
  { overlay: "hood", label: "Under the hood", icon: Sparkles },
] as const;

export function TopBar({ source }: { source: "supabase" | "seed" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("overlay");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="InsightFlow home"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
            I
          </span>
          <span className="hidden text-base font-semibold tracking-tight sm:inline">
            InsightFlow
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="ml-2 flex min-w-0 items-center gap-1 overflow-x-auto"
        >
          <Link
            href="/app"
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
              pathname === "/app" && !active && "bg-muted text-foreground",
            )}
          >
            Command Center
          </Link>
          <span
            aria-hidden="true"
            className="mx-1 hidden h-5 w-px shrink-0 bg-border sm:block"
          />
          {OVERLAY_ITEMS.map(({ overlay, label, icon: Icon }) => (
            <Link
              key={overlay}
              href={overlayHref(searchParams, overlay)}
              aria-current={active === overlay ? "true" : undefined}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                active === overlay && "bg-muted text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground lg:inline-flex">
            <span
              aria-hidden="true"
              className={
                source === "supabase"
                  ? "inline-block h-2 w-2 rounded-full bg-emerald-500"
                  : "inline-block h-2 w-2 rounded-full bg-amber-500"
              }
            />
            {source === "supabase" ? "Database" : "Demo fallback"}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
