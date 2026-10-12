"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

// Magnetic hover: the button leans toward the cursor within a small radius.
// Purely decorative — no layout shift, disabled under reduced motion.
export function MagneticButton({
  children,
  className,
  strength = 0.3,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);

  if (reduce) return <span className={className}>{children}</span>;

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      animate={{ x: dx, y: dy }}
      transition={{ type: "spring", stiffness: 260, damping: 20, mass: 0.6 }}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        setDx((e.clientX - cx) * strength);
        setDy((e.clientY - cy) * strength);
      }}
      onPointerLeave={() => {
        setDx(0);
        setDy(0);
      }}
    >
      {children}
    </motion.span>
  );
}
