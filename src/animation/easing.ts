import { clamp } from "./frameMath";
export const linear = (t: number) => t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutExpo = (t: number) =>
  t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
export const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
/** Closed-form damped spring (deterministic, no state). 0 -> ~1 with a small overshoot, exactly 1 at t>=1. */
export const dampedSpring = (t: number) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.exp(-6 * t) * Math.cos(7 * t);
};
/** Quick attack then exponential decay: a "hit" envelope, 0..1 */
export const pulse = (frame: number, start: number, decayFrames = 10, attack = 2) => {
  if (frame < start) return 0;
  const d = frame - start;
  if (d < attack) return d / attack;
  return clamp(Math.exp(-(d - attack) / (decayFrames / 3)));
};
