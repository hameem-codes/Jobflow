import { motion } from "framer-motion";
import { type ReactNode } from "react";

/**
 * #3 — Staggered word-in animation for Fraunces display headlines.
 * Each word rises 8px + fades, 40ms apart.
 */
export function HeadlineStagger({ children, delay = 0 }: { children: string; delay?: number }) {
  const words = children.split(" ");
  return (
    <motion.h1
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04, delayChildren: delay } },
      }}
    >
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          style={{ display: "inline-block", marginRight: "0.28em" }}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 0.61, 0.36, 1] } },
          }}
        >
          {w}
        </motion.span>
      ))}
    </motion.h1>
  );
}

/**
 * Same idea but applied to an arbitrary element (eyebrow text, etc.)
 */
export function Stagger({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] as const } },
};