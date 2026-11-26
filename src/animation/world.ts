// The single "visual world" model. Every value is a pure function of the integer frame + cue sheet.
import { CX, CY, H, W } from "../styles/designSystem";
import { Key, clamp, lerp, piecewise, progress, rng } from "./frameMath";
import { dampedSpring, easeInOutCubic, easeOutCubic, easeOutQuart, pulse } from "./easing";
import { getAmp, line, ws } from "./cueEngine";
import { mix } from "./animationPresets";
import { C } from "../styles/designSystem";

/* ------------------------------------------------------------------ anchors (all from the cue sheet) */
export const A = {
  l1Start: line(0).startFrame, l1End: line(0).endFrame, l1Hard: ws(0, 2), l1Last: ws(0, 3),
  l2Start: line(1).startFrame, but: ws(1, 1), bend: ws(1, 2), snap: ws(1, 3), l2End: line(1).endFrame,
  l3Start: line(2).startFrame, precise: ws(2, 3), nothing: ws(2, 5), l3End: line(2).endFrame,
  l4Start: line(3).startFrame, l4Screen: ws(3, 2), l4Moves: ws(3, 3), l4End: line(3).endFrame,
  l5Start: line(4).startFrame, small: ws(4, 0), big: ws(4, 2), l5End: line(4).endFrame,
  l6Start: line(5).startFrame, ready: ws(5, 1), l6End: line(5).endFrame,
};

/* ------------------------------------------------------------------ stage timeline u: 0 chaos | 1 direction | 2 grid | 3 speech | 4 seed | 5 burst | 6 final */
const STAGE_KEYS: Key[] = [
  { f: 0, v: 0 },
  { f: A.but, v: 0 },
  { f: A.snap + 6, v: 1, e: easeInOutCubic },
  { f: A.l3Start, v: 1 },
  { f: A.precise, v: 2, e: easeInOutCubic },
  { f: A.l4Start, v: 2 },
  { f: A.l4Start + 16, v: 3, e: easeInOutCubic },
  { f: A.l5Start, v: 3 },
  { f: A.l5Start + 16, v: 4, e: easeInOutCubic },
  { f: A.big, v: 4 },
  { f: A.big + 28, v: 5, e: easeOutQuart },
  { f: A.l6Start, v: 5 },
  { f: A.l6Start + 34, v: 6, e: dampedSpring },
];
export const stageU = (frame: number) => piecewise(frame, STAGE_KEYS);
const stageSplit = (u: number) => {
  const i = clamp(Math.floor(u), 0, 5);
  return { i, t: u - i };
};

/* ------------------------------------------------------------------ strands */
export const N_STRANDS = 26;
export const K = 13;
export type P = { x: number; y: number };
const KEEPERS = [1, 13, 20]; // x=240 vertical, x=1680 vertical, y=540 horizontal
export const keeperIndex = (i: number) => KEEPERS.indexOf(i);

const CHAOS: P[][] = [];
const BEND: P[][] = [];
const JIT: { off: number; tilt: number }[] = [];
(() => {
  for (let i = 0; i < N_STRANDS; i++) {
    const r = rng(1000 + i * 17);
    let x = r() * W, y = r() * H, ang = r() * Math.PI * 2;
    const pts: P[] = [];
    for (let k = 0; k < K; k++) {
      pts.push({ x, y });
      ang += (r() - 0.5) * 2.1;
      const step = 110 + r() * 250;
      x = clamp(x + Math.cos(ang) * step, -120, W + 120);
      y = clamp(y + Math.sin(ang) * step, -120, H + 120);
    }
    CHAOS.push(pts);
    const rb = rng(5000 + i * 31);
    BEND.push(Array.from({ length: K }, () => { const a = rb() * 6.283; return { x: Math.cos(a), y: Math.sin(a) }; }));
    JIT.push({ off: (rb() < 0.5 ? -1 : 1) * (12 + rb() * 18), tilt: (rb() - 0.5) * 70 });
  }
})();
const BEND_AMP = [170, 70, 0, 30, 0, 0]; // only the chaos->direction and grid-arrival moves bend; the rest travel in clean straight morphs

const TH = (-16 * Math.PI) / 180;
const DIR = { x: Math.cos(TH), y: Math.sin(TH) };
const NRM = { x: -DIR.y, y: DIR.x };
const DIR_C = { x: CX - 60, y: CY + 40 };

const dirPoint = (i: number, k: number): P => {
  const tt = k / (K - 1);
  const s = -1100 + tt * 2000;
  const o = (i - (N_STRANDS - 1) / 2) * 46;
  const conv = 1 - 0.9 * Math.pow(tt, 1.4);
  const bend = 70 * Math.sin(k * 0.55 + i * 0.21) * (1 - 0.6 * tt);
  const d = o * conv + bend;
  return { x: DIR_C.x + DIR.x * s + NRM.x * d, y: DIR_C.y + DIR.y * s + NRM.y * d };
};

/** snap progress of a grid line: lines arrive slightly misaligned and snap one by one on "ትክክለኛ" */
export const snapOf = (frame: number, i: number) => dampedSpring(progress(frame, A.precise + ((i * 7) % 16), A.precise + ((i * 7) % 16) + 14));
const gridPoint = (i: number, k: number, frame: number): P => {
  const tt = k / (K - 1);
  const j = JIT[i], mis = 1 - snapOf(frame, i);
  if (i < 15) return { x: 120 + 120 * i + (j.off + (tt - 0.5) * j.tilt) * mis, y: lerp(-20, H + 20, tt) };
  return { x: lerp(-20, W + 20, tt), y: 90 + 90 * (i - 15) + (j.off + (tt - 0.5) * j.tilt) * mis };
};

export const hitL4 = (frame: number) => {
  let h = 0;
  for (let w = 0; w < 4; w++) h = Math.max(h, pulse(frame, ws(3, w), 16));
  return h;
};
const SPEECH_Y = [330, 540, 750];
const speechPoint = (m: number, k: number, frame: number): P => {
  const tt = k / (K - 1);
  const taper = Math.sin(Math.PI * tt);
  const amp = getAmp(frame - Math.round(k * 1.2));
  const disp = (55 * amp + 120 * hitL4(frame)) * Math.sin(k * 1.7 + frame * 0.33 + m * 2.1) * taper * (m === 1 ? 1.2 : 0.8);
  return { x: lerp(110, 1810, tt), y: SPEECH_Y[m] + disp };
};
const ringPoint = (m: number, k: number, rx: number, ry: number, rot: number): P => {
  const a = (2 * Math.PI * k) / (K - 1) + rot;
  return { x: CX + Math.cos(a) * rx, y: CY + Math.sin(a) * ry };
};
const SEED_R = [18, 32, 46], BURST_RX = [1100, 1400, 1700], FINAL_RX = [840, 930, 1020], FINAL_RY = [380, 430, 480];

const statePts = (s: number, i: number, frame: number): P[] => {
  const m = keeperIndex(i);
  const out: P[] = [];
  for (let k = 0; k < K; k++) {
    if (s === 0) out.push(CHAOS[i][k]);
    else if (s === 1) out.push(dirPoint(i, k));
    else if (s === 2 || m < 0) out.push(gridPoint(i, k, frame));
    else if (s === 3) out.push(speechPoint(m, k, frame));
    else if (s === 4) out.push(ringPoint(m, k, SEED_R[m], SEED_R[m], frame * 0.02 + m));
    else if (s === 5) out.push(ringPoint(m, k, BURST_RX[m], BURST_RX[m] * 0.62, 0));
    else out.push(ringPoint(m, k, FINAL_RX[m], FINAL_RY[m], 0));
  }
  return out;
};

/** how violently the chaos shimmers: builds with the sentence, peaks right before the change of direction */
export const wobbleAmp = (frame: number) =>
  piecewise(frame, [
    { f: 0, v: 0 }, { f: A.l1Last, v: 26, e: easeOutCubic }, { f: A.l1End + 6, v: 38 },
    { f: A.snap, v: 30 }, { f: A.snap + 26, v: 0, e: easeOutCubic },
  ]);

export const strandPoints = (i: number, frame: number): P[] => {
  const u = stageU(frame);
  const { i: si, t } = stageSplit(u);
  const a = statePts(si, i, frame), b = statePts(si + 1, i, frame);
  const bendA = BEND_AMP[si] * Math.sin(Math.PI * clamp(t));
  const wob = wobbleAmp(frame);
  return a.map((p, k) => {
    let x = lerp(p.x, b[k].x, t) + BEND[i][k].x * bendA;
    let y = lerp(p.y, b[k].y, t) + BEND[i][k].y * bendA;
    if (wob > 0.01) {
      x += Math.sin(frame * 0.17 + i * 1.3 + k * 0.9) * wob;
      y += Math.cos(frame * 0.15 + i * 0.7 + k * 1.1) * wob;
    }
    return { x, y };
  });
};

export const smoothPath = (pts: P[]): string => {
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    d += `C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
};

/* strand draw-on (chaos builds with the sentence) and retraction ("nothing unnecessary") */
const NON_KEEPERS = Array.from({ length: N_STRANDS }, (_, i) => i).filter((i) => keeperIndex(i) < 0);
const PERM = (() => { const r = rng(77); const a = [...NON_KEEPERS]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; })();
export const retractStart = (i: number) => {
  const pos = PERM.indexOf(i);
  return A.nothing + Math.round((pos / PERM.length) * (A.l3End - A.nothing - 8));
};
export const strandDrawIn = (frame: number, i: number) => {
  const st = 2 + Math.round((i * (A.l1End - 24)) / N_STRANDS);
  return easeOutCubic(progress(frame, st, st + 18));
};
export const strandRetract = (frame: number, i: number) => (keeperIndex(i) >= 0 ? 0 : progress(frame, retractStart(i), retractStart(i) + 8));

export type StrandStyle = { opacity: number; width: number; color: string };
const STAGE_OP = [0.6, 0.85, 0.3, 0, 0, 0, 0];
export const strandStyle = (i: number, frame: number): StrandStyle => {
  const u = stageU(frame);
  const { i: si, t } = stageSplit(u);
  const m = keeperIndex(i);
  const kinds = [C.cyan, C.purple, C.mist];
  if (m < 0) {
    const w0 = [1.2 + (i % 4) * 0.9, 2.2, 1.4, 1.4, 1.4, 1.4, 1.4];
    return { opacity: lerp(STAGE_OP[si], STAGE_OP[si + 1], t), width: lerp(w0[si], w0[si + 1], t), color: kinds[i % 3] };
  }
  const op = [0.6, 0.85, 0.95, 0.95, 0.95, 0.9, 0.7], w = [2.2, 2.6, 3.2, 3.6, 3.2, 3.2, 2.4];
  return { opacity: lerp(op[si], op[si + 1], t), width: lerp(w[si], w[si + 1], t), color: mix(kinds[i % 3], m === 1 ? C.gold : C.cyan, clamp((u - 1.3) / 0.7)) };
};

/* ------------------------------------------------------------------ particles */
export const N_PARTICLES = 96;
type Part = { hx: number; hy: number; z: number; ph: number; sp: number };
const PARTS: Part[] = (() => {
  const r = rng(424242);
  return Array.from({ length: N_PARTICLES }, () => ({ hx: r() * W, hy: r() * H, z: 0.35 + 0.65 * r(), ph: r() * 6.283, sp: 5 + r() * 10 }));
})();
const mod = (a: number, b: number) => ((a % b) + b) % b;
// state vectors: [x, y, len, angle(rad), opacity, size]
const partState = (s: number, i: number, frame: number): number[] => {
  const p = PARTS[i];
  switch (s) {
    case 0: return [p.hx + Math.sin(frame * 0.03 * p.z + p.ph) * 60 * p.z, p.hy + Math.cos(frame * 0.027 * p.z + p.ph * 1.3) * 60 * p.z, 0.1, 0, 0.25 + 0.5 * p.z, 1.5 + 2.5 * p.z];
    case 1: { const ft = clamp(frame, A.but, A.l3Start) - A.but; return [p.hx - 450 + ft * p.sp * 0.96, p.hy - ft * p.sp * 0.276, 20 + 70 * p.z, TH, 0.2 + 0.7 * p.z, 1.6]; }
    case 2: return [clamp(Math.round((p.hx - 120) / 120) * 120 + 120, 120, 1800), clamp(Math.round((p.hy - 90) / 90) * 90 + 90, 90, 990), 0.1, 0, 0.85 * p.z + 0.1, 3.2];
    case 3: { const d = Math.max(0, frame - A.l4Start); return [p.hx, p.hy - d * (0.5 + 1.4 * p.z) - getAmp(frame) * 40 * p.z, 8 + getAmp(frame) * 60 * p.z, -Math.PI / 2, 0.3 + 0.5 * p.z, 2.2]; }
    case 4: return [CX + (p.hx - CX) * 0.04, CY + (p.hy - CY) * 0.04, 0.1, 0, 0.5, 2];
    case 5: { const a = Math.atan2(p.hy - CY, p.hx - CX); const r = 520 + p.z * 900; return [CX + Math.cos(a) * r, CY + Math.sin(a) * r * 0.62, 30 + 60 * p.z, a, 0.6, 2.4]; }
    default: { const j = i % 3; const a = p.ph + frame * 0.004 * (0.5 + p.z); return [CX + Math.cos(a) * FINAL_RX[j], CY + Math.sin(a) * FINAL_RY[j], 0.1, 0, 0.5 + 0.4 * p.z, 2 + 2 * p.z]; }
  }
};
export const particleAt = (i: number, frame: number) => {
  const { i: si, t } = stageSplit(stageU(frame));
  const a = partState(si, i, frame), b = partState(si + 1, i, frame);
  const v = a.map((x, k) => lerp(x, b[k], t));
  const vis = (frame < 250 ? 1 - progress(frame, A.nothing + (i % 24), A.nothing + (i % 24) + 9) : progress(frame, A.l4Start, A.l4Start + 26)) * progress(frame, 0, 24);
  return { x: v[0], y: v[1], len: v[2], ang: v[3], op: v[4] * vis, size: v[5] };
};

/* ------------------------------------------------------------------ camera */
export const cameraAt = (frame: number) => {
  const lean = piecewise(frame, [{ f: A.but, v: 0 }, { f: A.snap, v: -90, e: easeInOutCubic }, { f: A.snap + 30, v: 0, e: dampedSpring }]);
  const swing = piecewise(frame, [{ f: A.l4Moves - 2, v: 0 }, { f: A.l4Moves + 12, v: 1, e: easeOutCubic }, { f: A.l4End + 26, v: 0, e: dampedSpring }]);
  const push = piecewise(frame, [{ f: A.big - 2, v: 0 }, { f: A.big + 30, v: 1, e: easeOutQuart }, { f: A.l6Start + 40, v: 0, e: easeInOutCubic }]);
  const tension = progress(frame, 0, A.l1End) * 0.03 * (1 - progress(frame, A.snap, A.snap + 20));
  const screenPulse = pulse(frame, A.l4Screen, 12) * 0.025;
  return {
    tx: Math.sin(frame * 0.011) * 14 + lean + swing * 110,
    ty: Math.cos(frame * 0.013) * 8,
    rotY: 0.03 + swing * -12 + (lean / -90) * 3, // constant 0.03deg tilt: keeps Chrome on one raster path (no sharpness pop)
    rotX: 0.02 + swing * 2,
    scale: 1 + 0.012 * Math.sin(frame * 0.017) + tension + screenPulse + push * 0.09,
  };
};
