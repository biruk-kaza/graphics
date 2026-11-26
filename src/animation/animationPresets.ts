import { lerp } from "./frameMath";
/** mix two #rrggbb colours */
export const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
};
export const READ_SHADOW = "0 0 26px rgba(6,10,24,.95), 0 0 7px rgba(6,10,24,.9)";
export const extrusion = (n = 9) =>
  Array.from({ length: n }, (_, i) => `${i + 1}px ${i + 1}px 0 rgba(${60 - i * 4},${34 - i * 2},${150 - i * 8},${0.95 - i * 0.05})`).join(",");
