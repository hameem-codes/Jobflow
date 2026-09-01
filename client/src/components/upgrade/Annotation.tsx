import { type ReactNode } from "react";

/**
 * #25 — Hover-reveal annotation pill.
 * Wrap any element; the `data-note` text appears as an ink tooltip.
 */
export function Annotation({ note, children }: { note: string; children: ReactNode }) {
  return (
    <span className="annot" data-note={note}>
      {children}
    </span>
  );
}