import { type ReactNode, type MouseEvent } from "react";

/**
 * #1 — Cursor-following chartreuse spotlight.
 * Wrap any element; on mousemove it sets CSS vars that paint a lime glow.
 * Pure CSS does the rendering, this just wires the pointer position.
 */
export function Spotlight({ children, className = "" }: { children: ReactNode; className?: string }) {
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div onMouseMove={onMove} className={`spotlight-wrap ${className}`}>
      {children}
    </div>
  );
}