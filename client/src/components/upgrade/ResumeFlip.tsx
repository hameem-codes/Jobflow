import { motion, AnimatePresence } from "framer-motion";
import { useState, type ReactNode } from "react";
import { RotateCw } from "lucide-react";

/**
 * #21 — Resume page-flip.
 * Two faces that rotate on the Y axis. The "back" face is the live preview;
 * the "front" face is the structured editor. Matches the "career journal"
 * brand essence.
 */
export function ResumeFlip({ editor, preview }: { editor: ReactNode; preview: ReactNode }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="flip-stage" style={{ minHeight: 520 }}>
      <div className={`flip-card ${flipped ? "flipped" : ""}`} style={{ minHeight: 520 }}>
        <div className="flip-face" style={{ backfaceVisibility: "hidden" }}>
          {editor}
        </div>
        <div className="flip-back" style={{ backfaceVisibility: "hidden" }}>
          {preview}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="button"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 5,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
        aria-label="Flip resume preview"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={flipped ? "back" : "front"}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.18 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RotateCw size={14} /> {flipped ? "Back to editor" : "Live preview"}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}