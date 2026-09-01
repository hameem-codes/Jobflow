/**
 * #23 — Sound design (opt-in).
 * Tiny WebAudio "thunk" for saves and "scratch" for AI finish.
 * Sounds are synthesised so no audio assets to ship.
 */
let ctx: AudioContext | null = null;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function tone({ freq = 220, dur = 0.18, type = "triangle", vol = 0.06, sweep = 0 }: { freq?: number; dur?: number; type?: OscillatorType; vol?: number; sweep?: number }) {
  try {
    const a = ac();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (sweep) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), a.currentTime + dur);
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur);
  } catch {/* audio blocked */}
}

export const sound = {
  thunk: () => tone({ freq: 320, sweep: -120, dur: 0.14, type: "triangle", vol: 0.05 }),
  stamp: () => tone({ freq: 540, sweep: -240, dur: 0.18, type: "square", vol: 0.04 }),
  sparkle: () => {
    tone({ freq: 720, dur: 0.08, type: "sine", vol: 0.04 });
    setTimeout(() => tone({ freq: 960, dur: 0.10, type: "sine", vol: 0.04 }), 60);
  },
  scratch: () => tone({ freq: 180, sweep: 320, dur: 0.22, type: "sawtooth", vol: 0.025 }),
};

/**
 * Drop-in component. Reads `settings.soundEnabled` from JobflowContext and
 * exposes the same `sound` object on `window.__jobflowSound` for non-React callers.
 */
import { useJobflow } from "@/contexts/JobflowContext";
import { useEffect } from "react";
export function Sounds() {
  const c = useJobflow() as any;
  const enabled = !!c?.soundEnabled;
  useEffect(() => {
    (window as any).__jobflowSound = enabled ? sound : null;
  }, [enabled]);
  return null;
}