// Pure, deterministic helpers. Everything is a function of an integer frame number.
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const secondsToFrames = (s: number, fps = 30) => Math.round(s * fps);
export const framesToSeconds = (f: number, fps = 30) => f / fps;
/** 0..1 progress of `frame` through [start, end) */
export const progress = (frame: number, start: number, end: number) =>
  end <= start ? (frame >= end ? 1 : 0) : clamp((frame - start) / (end - start));
export const inRange = (frame: number, start: number, end: number) => frame >= start && frame < end;

/** mulberry32 - tiny seeded RNG so every render (and every render thread) is identical */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type Ease = (t: number) => number;
export type Key = { f: number; v: number; e?: Ease };
/** Piecewise value across keyframes; `e` on a key eases the segment that ENDS at that key. */
export const piecewise = (frame: number, keys: Key[]): number => {
  if (frame <= keys[0].f) return keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    if (frame < keys[i].f) {
      const k0 = keys[i - 1], k1 = keys[i];
      const t = (frame - k0.f) / Math.max(1, k1.f - k0.f);
      return lerp(k0.v, k1.v, (k1.e ?? ((x) => x))(t));
    }
  }
  return keys[keys.length - 1].v;
};
