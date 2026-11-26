import React from "react";
import { useCurrentFrame } from "remotion";
import { C, CX, CY, H, W } from "../styles/designSystem";
import { clamp, progress, rng } from "../animation/frameMath";
import { easeOutCubic } from "../animation/easing";
import { A, snapOf } from "../animation/world";
import { CueDrivenText } from "../components/CueDrivenText";
import { LightSweep } from "../components/LightSweep";

const FS = 124, LH = 1.3, GAP = 36;
const PITCH = FS * LH + GAP;
const X0 = 240, X1 = 1680;
const MARKS = (() => {
  const r = rng(8080);
  const pts = [[X0, CY - PITCH / 2], [X1, CY - PITCH / 2], [X0, CY + PITCH / 2], [X1, CY + PITCH / 2], [X0, 190], [X1, 190], [CX, CY]];
  return pts.map(([x, y], i) => ({ x, y, dx: (r() - 0.5) * 90, dy: (r() - 0.5) * 70, rot: (r() - 0.5) * 50, id: 3 + i * 3 }));
})();

/** EVENT 3 - precision: guides, a dimension line and markers that SNAP on "ትክክለኛ", then everything unnecessary is removed on "ምንም ትርፍ ነገር የለም". */
export const PrecisionScene: React.FC = () => {
  const f = useCurrentFrame();
  if (f < A.l3Start - 6 || f > A.l4Start + 6) return null;
  const draw = easeOutCubic(progress(f, A.precise, A.precise + 18));
  const rm = (k: number) => progress(f, A.nothing + k * 3, A.nothing + k * 3 + 9); // staggered removal
  const dims = draw * (1 - rm(0));
  const rule = (y: number, k: number) => {
    const o = draw * (1 - rm(k));
    if (o <= 0) return null;
    return (
      <g key={y} opacity={0.75 * o}>
        <line x1={X0} y1={y} x2={X0 + (X1 - X0) * o} y2={y} stroke={C.cyan} strokeWidth={1.5} />
        <path d={`M${X0} ${y - 10}V${y + 10}`} stroke={C.cyan} strokeWidth={2} />
        <path d={`M${X0 + (X1 - X0) * o} ${y - 10}V${y + 10}`} stroke={C.cyan} strokeWidth={2} />
      </g>
    );
  };
  return (
    <>
      <LightSweep start={A.l3Start + 8} end={A.precise + 4} angle={90} color="rgba(255,255,255,0.8)" width={160} opacity={0.08} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {rule(CY - PITCH / 2, 1)}
        {rule(CY + PITCH / 2, 2)}
        {dims > 0 && (
          <g opacity={0.9 * dims} stroke={C.gold} strokeWidth={2} fill="none">
            <line x1={X0} y1={190} x2={X0 + (X1 - X0) * dims} y2={190} />
            <path d={`M${X0} 176V204M${X1} 176V204M${CX} 182V198`} />
            <path d={`M${X0 + 22} 190l16 -8M${X0 + 22} 190l16 8M${X1 - 22} 190l-16 -8M${X1 - 22} 190l-16 8`} />
          </g>
        )}
        {MARKS.map((m, i) => {
          const s = snapOf(f, m.id), o = clamp(draw * 3) * (1 - rm(i % 4));
          if (o <= 0) return null;
          return (
            <g key={i} transform={`translate(${m.x + m.dx * (1 - s)},${m.y + m.dy * (1 - s)}) rotate(${m.rot * (1 - s)}) scale(${0.4 + 0.6 * o})`} opacity={o}>
              <rect x={-9} y={-9} width={18} height={18} fill="none" stroke={C.gold} strokeWidth={2.5} />
              <circle r={2.5} fill={C.gold} />
            </g>
          );
        })}
      </svg>
      <CueDrivenText lineIndex={2} rows={[[0, 1, 2], [3, 4], [5, 6, 7, 8]]} fontSize={FS} lineHeight={LH} rowGap={GAP} variant="snap" align="left"
        box={{ left: X0 + 40, top: 0, width: W - X0 - 200, height: H }} pop={0.04} underline
        rowOpacity={(row, fr) => (row < 2 ? 1 - 0.55 * progress(fr, A.nothing + 4, A.nothing + 18) : 1)} />
    </>
  );
};
