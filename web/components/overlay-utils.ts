"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Close the current overlay (feedback/issues/hood) while keeping filters
// (category/sentiment) intact. Esc closes whatever overlay is open.
export function useCloseOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const close = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("overlay");
    next.delete("cluster");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [router, pathname, searchParams]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return close;
}

// href that opens an overlay from the top bar, preserving current filters.
export function overlayHref(
  searchParams: URLSearchParams,
  overlay: string,
): string {
  const next = new URLSearchParams(searchParams.toString());
  next.set("overlay", overlay);
  return `?${next.toString()}`;
}
