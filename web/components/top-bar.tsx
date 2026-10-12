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
  { overlay: "hood", label: "How it works", icon: Sparkles },
] as const;

export function TopBar({ source }: { source: "supabase" | "seed" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("overlay");

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-background/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="InsightFlow home"
        >
          <span className="font-display text-xl leading-none tracking-tight">
            InsightFlow
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="ml-4 flex min-w-0 items-center gap-1 overflow-x-auto"
        >
          <Link
            href="/app"
            className={cn(
              "inline-flex h-9 shrink-0 items-center border-b-2 border-transparent px-3 text-sm text-muted-foreground hover:text-foreground",
              pathname === "/app" && !active && "border-foreground text-foreground",
            )}
          >
            Command Center
          </Link>
          <span
            aria-hidden="true"
            className="mx-1 hidden h-5 w-px shrink-0 bg-rule sm:block"
          />
          {OVERLAY_ITEMS.map(({ overlay, label, icon: Icon }) => (
            <Link
              key={overlay}
              href={overlayHref(searchParams, overlay)}
              aria-current={active === overlay ? "true" : undefined}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 text-sm text-muted-foreground hover:text-foreground",
                active === overlay && "border-foreground text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 border border-rule px-3 py-1 font-mono text-[11px] text-muted-foreground lg:inline-flex">
            <span
              aria-hidden="true"
              className={
                source === "supabase"
                  ? "inline-block h-2 w-2 rounded-full bg-[#5DD6A2]"
                  : "inline-block h-2 w-2 rounded-full bg-[#8B867B]"
              }
            />
            {source === "supabase" ? "Live database" : "Local snapshot"}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
