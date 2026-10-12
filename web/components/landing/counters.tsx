"use client";

import { motion, useReducedMotion } from "framer-motion";

import { AnimatedNumber } from "@/components/animated-number";
import { SectionLabel } from "@/components/section-label";

type Counter = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  note?: string;
};

// Scroll-into-view counters band. Reduced motion → values shown instantly.
export function Counters({ items }: { items: Counter[] }) {
  const reduce = useReducedMotion();

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
      <SectionLabel index={5} label="By the numbers" className="mb-10" />
      <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-5">
        {items.map((item) => (
          <motion.div
            key={item.label}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="border-t border-rule pt-4"
          >
            <p className="font-display text-4xl tracking-tight tabular-nums sm:text-5xl">
              <AnimatedNumber
                value={item.value}
                prefix={item.prefix}
                suffix={item.suffix}
              />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
            {item.note && (
              <p className="mt-0.5 font-mono text-[11px] text-stone">
                {item.note}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
