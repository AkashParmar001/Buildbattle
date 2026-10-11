"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function FeedbackSearch({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(current);

  useEffect(() => {
    if (value === current) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set("q", value);
      else next.delete("q");
      next.delete("page");
      const query = next.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [value, current, pathname, router, searchParams]);

  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs">
      <span className="sr-only">Search feedback</span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search text or topic…"
        aria-label="Search feedback"
        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      />
    </label>
  );
}
