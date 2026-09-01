/**
 * #22 — Chartreuse paper sparks.
 * Fires a burst from the given origin (default: center of viewport).
 * Variety of palette tokens (lime, clay, sage, ink) keeps it on-brand.
 */
export function fireSparks(origin?: { x: number; y: number }) {
  const cx = origin?.x ?? window.innerWidth / 2;
  const cy = origin?.y ?? window.innerHeight / 2;
  const palette = ["", "--clay", "--sage", "--ink"];
  const count = 26;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    const variant = palette[i % palette.length];
    el.className = `spark${variant ? " spark" + variant : ""}`;
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const dist = 90 + Math.random() * 140;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 40;
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    el.style.setProperty("--dx", `${dx}px`);
    el.style.setProperty("--dy", `${dy}px`);
    el.style.width = `${5 + Math.random() * 5}px`;
    el.style.height = el.style.width;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
}