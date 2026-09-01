import { motion } from "framer-motion";
import { type ReactNode } from "react";

/**
 * #8 — Editorial page-transition curtain.
 * Wraps a route view; on mount it does the 8px upward drift + fade your
 * design doc specifies. Respects reduced-motion via CSS media query.
 */
export function PageTransition({ children, k }: { children: ReactNode; k: string }) {
  return (
    <motion.div
      key={k}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}