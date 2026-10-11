import type { ReactNode } from "react";
import { Suspense } from "react";

import { getDataSource } from "@/lib/db";
import { MobileNav, SidebarNav } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

function SidebarNavFallback() {
  return <div aria-hidden="true" className="flex flex-1 flex-col gap-1 p-3" />;
}

export async function AppShell({ children }: { children: ReactNode }) {
  const source = await getDataSource();
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex print:hidden">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
            I
          </span>
          <span className="text-base font-semibold tracking-tight">
            InsightFlow
          </span>
        </div>
        <Suspense fallback={<SidebarNavFallback />}>
          <SidebarNav />
        </Suspense>
        <p className="flex items-center gap-1.5 border-t border-border p-4 text-xs leading-5 text-muted-foreground">
          <span
            aria-hidden="true"
            className={
              source === "supabase"
                ? "inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                : "inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500"
            }
          />
          Data source: {source === "supabase" ? "Database" : "Demo fallback"}
        </p>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6 print:hidden">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground md:hidden">
            I
          </span>
          <span className="text-base font-semibold tracking-tight md:hidden">
            InsightFlow
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground sm:inline">
              Frontend Arena Build Battle 2026
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile nav */}
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>

        <main className="min-w-0 flex-1 p-4 sm:p-6 print:p-0">{children}</main>

        <footer className="flex items-center gap-1.5 px-4 pb-4 text-xs text-muted-foreground md:hidden print:hidden">
          <span
            aria-hidden="true"
            className={
              source === "supabase"
                ? "inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                : "inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500"
            }
          />
          Data source: {source === "supabase" ? "Database" : "Demo fallback"}
        </footer>
      </div>
    </div>
  );
}
