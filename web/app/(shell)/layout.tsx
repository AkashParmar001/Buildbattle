import type { ReactNode } from "react";
import { Suspense } from "react";

import { getDataSource } from "@/lib/db";
import { OverlayHost } from "@/components/overlay-host";
import { TopBar } from "@/components/top-bar";

// Chrome for the Command Center: sticky top bar + overlay host.
// The landing page and report render outside this group.
export default async function ShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const source = await getDataSource();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="h-14 border-b border-border bg-card"
          />
        }
      >
        <TopBar source={source} />
      </Suspense>

      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 sm:px-6 print:p-0">
        {children}
      </main>

      <footer className="flex items-center gap-1.5 px-4 pb-5 text-xs text-muted-foreground sm:px-6 print:hidden">
        <span
          aria-hidden="true"
          className={
            source === "supabase"
              ? "inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500"
              : "inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500"
          }
        />
        Data source: {source === "supabase" ? "Live database" : "Local snapshot"}
      </footer>

      <Suspense fallback={null}>
        <OverlayHost />
      </Suspense>
    </div>
  );
}
