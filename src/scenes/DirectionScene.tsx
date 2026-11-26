import React from "react";
import { useCurrentFrame } from "remotion";
import { C, H, W } from "../styles/designSystem";
import { progress } from "../animation/frameMath";
import { easeOutQuart } from "../animation/easing";
import { A } from "../animation/world";
import { CueDrivenText } from "../components/CueDrivenText";
import { LightSweep } from "../components/LightSweep";
import { ImpactFlash } from "../components/SceneTransitions";

const TH = (-16 * Math.PI) / 180;
const D = { x: Math.cos(TH), y: Math.sin(TH) };

/** EVENT 2 - the change of direction: a sweep, a forward-pointing chevron train and a slanted slide of type. */
export const DirectionScene: React.FC = () => {
  const f = useCurrentFrame();
  if (f < A.l2Start - 10 || f > A.l3Start + 30) return null;
  const t0 = A.snap;
  const chev = Array.from({ length: 6 }, (_, i) => {
    const p = easeOutQuart(progress(f, t0 + i * 3, t0 + i * 3 + 16));
    const fade = 1 - progress(f, A.l2End + 4, A.l3Start + 24);
    const s = -420 + i * 170 + (f - t0) * 4;
    const cx = 900 + D.x * s, cy = 560 + D.y * s;
    return { p, fade, cx, cy, i };
  });
  return (
    <>
      <LightSweep start={A.snap - 4} end={A.snap + 20} angle={16} color="rgba(79,216,255,0.95)" width={420} opacity={0.5} />
      <ImpactFlash at={A.snap} color="79,216,255" peak={0.16} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {chev.map((c) => (
          c.p > 0 && (
            <g key={c.i} transform={`translate(${c.cx},${c.cy}) rotate(-16) scale(${0.6 + 0.4 * c.p})`} opacity={c.p * c.fade * (0.35 + 0.65 * (c.i / 5))}>
              <path d="M-34 -64 L34 0 L-34 64" fill="none" stroke={c.i === 5 ? C.gold : C.cyan} strokeWidth={c.i === 5 ? 9 : 5} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )
        ))}
      </svg>
      <CueDrivenText lineIndex={1} rows={[[0, 1], [2, 3]]} fontSize={140} variant="slide" rotate={-3} offset={{ x: -90, y: 70 }} underline pop={0.07} />
    </>
  );
};
