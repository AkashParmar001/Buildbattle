"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { EASE_OUT } from "@/lib/motion";

// Page-transition curtain: an ink panel lifts off the viewport on every
// navigation (template remounts per route). Query-param-only updates inside
// a route don't re-trigger it. Skipped under reduced motion / print.
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[95] origin-top bg-[var(--charcoal)] print:hidden"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.25 }}
      >
        {children}
      </motion.div>
    </>
  );
}
