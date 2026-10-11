import type { ReactNode } from "react";
import { Suspense } from "react";

import { MobileNav, SidebarNav } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

function SidebarNavFallback() {
  return <div aria-hidden="true" className="flex flex-1 flex-col gap-1 p-3" />;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-950 print:hidden">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-5 dark:border-zinc-800">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            I
          </span>
          <span className="text-base font-semibold tracking-tight">
            InsightFlow
          </span>
        </div>
        <Suspense fallback={<SidebarNavFallback />}>
          <SidebarNav />
        </Suspense>
        <p className="border-t border-zinc-200 p-4 text-xs leading-5 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          Demo seed data — works with all APIs down.
        </p>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/90 print:hidden">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white md:hidden">
            I
          </span>
          <span className="text-base font-semibold tracking-tight md:hidden">
            InsightFlow
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 sm:inline dark:border-zinc-800 dark:text-zinc-400">
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
      </div>
    </div>
  );
}
