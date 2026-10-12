"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Scroll-into-view fade-up. Renders plain children under reduced motion so
// nothing is ever hidden waiting for an animation that will not run.
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={cn(className)}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -64px 0px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
