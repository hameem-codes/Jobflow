/**
 * #19 — Copilot "thinking" indicator. Three breathing lime dots.
 */
export function ThinkingDots() {
  return (
    <span className="thinking-dots" role="status" aria-label="Thinking">
      <span /><span /><span />
    </span>
  );
}

/**
 * Word-by-word streaming text with a typewriter cursor.
 * Use for AI streaming responses (already have `streamdown` in deps too).
 */
export function Typewriter({ text, speed = 18 }: { text: string; speed?: number }) {
  const words = text.split(" ");
  return (
    <span>
      {words.map((w, i) => (
        <span
          key={i}
          style={{ display: "inline-block", marginRight: "0.28em" }}
        >
          {w}
        </span>
      ))}
      <span className="tw-cursor" aria-hidden />
    </span>
  );
}