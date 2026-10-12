import type { Variants } from "framer-motion";

// Shared motion vocabulary for the Command Center and landing page.
// All entrance animation is opt-in via <Reveal> / variants below; reduced
// motion is handled by callers via useReducedMotion().

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

export const staggerChildren = (stagger = 0.07, delay = 0.04): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

export const SPRING_SOFT = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.9,
} as const;

export const SPRING_BOUNCY = {
  type: "spring",
  stiffness: 320,
  damping: 24,
  mass: 0.8,
} as const;
