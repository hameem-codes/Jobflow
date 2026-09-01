import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

/**
 * #2 / #18 — Animated number counter.
 * Counts from 0 → `value` with eased motion. Re-runs each time `value` changes.
 * Uses tabular-nums + a CSS class so digits don't jiggle width.
 */
export function CountUp({
  value,
  duration = 0.9,
  format = (n: number) => Math.round(n).toLocaleString(),
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(() => format(0));

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 0.61, 0.36, 1],
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
  }, [value, duration, format]);

  return (
    <span ref={ref} className="count-flip" aria-live="polite">
      {display}
    </span>
  );
}