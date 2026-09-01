import { useMemo } from "react";

/**
 * #10 — Skill gap constellation.
 * Renders nodes in a loose arc and connects related ones with hairlines.
 * `skills`: { label, has?: boolean, gap?: boolean }[]
 */
export function Constellation({
  skills,
}: {
  skills: { label: string; has?: boolean; gap?: boolean }[];
}) {
  const layout = useMemo(() => {
    const n = skills.length;
    const w = 360;
    const h = 240;
    return skills.map((_, i) => {
      const t = i / Math.max(1, n - 1);
      const x = 40 + (w - 80) * t + (i % 2 === 0 ? 0 : 14);
      const y = h / 2 + Math.sin(t * Math.PI * 1.6) * (h / 3.2);
      return { x, y };
    });
  }, [skills]);

  const lines = useMemo(() => {
    const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < layout.length - 1; i++) {
      out.push({
        x1: layout[i].x,
        y1: layout[i].y,
        x2: layout[i + 1].x,
        y2: layout[i + 1].y,
      });
    }
    return out;
  }, [layout]);

  return (
    <div className="constellation" style={{ height: 240, width: "100%" }}>
      <svg className="lines" viewBox="0 0 360 240" preserveAspectRatio="none">
        {lines.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="var(--rule)"
            strokeWidth="1"
            strokeDasharray="3 4"
          ></line>
        ))}
      </svg>
      {skills.map((s, i) => {
        const cls = `node${s.has ? " has" : ""}${s.gap ? " gap" : ""}`;
        return (
          <span
            key={s.label}
            className={cls}
            style={{
              position: "absolute",
              left: layout[i].x - 27,
              top: layout[i].y - 27,
            }}
            title={s.label}
          >
            {s.label.split(" ").slice(0, 2).join(" ")}
          </span>
        );
      })}
    </div>
  );
}
