"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { EASE_OUT } from "@/lib/motion";

// Runs on every /app navigation: a quick fade-up so filter changes and
// overlay-driven route updates feel like one continuous surface.
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
