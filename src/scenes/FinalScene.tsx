import React from "react";
import { useCurrentFrame } from "remotion";
import { C, CX, CY, H, W } from "../styles/designSystem";
import { progress } from "../animation/frameMath";
import { easeInOutCubic, easeOutCubic } from "../animation/easing";
import { A } from "../animation/world";
import { CueDrivenText } from "../components/CueDrivenText";
import { LightSweep } from "../components/LightSweep";

const IN = 64, PER = 2 * (W - 2 * IN + H - 2 * IN);

/** EVENT 6 - everything resolves: ring system settles, a gold frame and rule draw in, the statement lands and is held. */
export const FinalScene: React.FC = () => {
  const f = useCurrentFrame();
  if (f < A.l6Start - 6) return null;
  const frameDraw = easeInOutCubic(progress(f, A.ready - 4, A.ready + 40));
  const rule = easeOutCubic(progress(f, A.ready + 8, A.ready + 34));
  const glow = progress(f, A.ready, A.ready + 30);
  const breath = 1 + 0.012 * Math.sin(f * 0.06);
  const ry = CY + 168;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, background: `radial-gradient(ellipse 55% 38% at 50% 50%, rgba(232,188,99,${0.16 * glow}), transparent 70%)` }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <rect x={IN} y={IN} width={W - 2 * IN} height={H - 2 * IN} rx={6} fill="none" stroke={C.gold} strokeWidth={1.6} strokeOpacity={0.8}
          pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - frameDraw} />
        {[[IN, IN, 1, 1], [W - IN, IN, -1, 1], [IN, H - IN, 1, -1], [W - IN, H - IN, -1, -1]].map(([x, y, sx, sy], i) => (
          <path key={i} d={`M${x + sx * 46} ${y}H${x}V${y + sy * 46}`} fill="none" stroke={C.goldSoft} strokeWidth={4} strokeLinecap="round" opacity={frameDraw} />
        ))}
        <g opacity={rule > 0 ? 1 : 0}>
          <line x1={CX - 460 * rule} y1={ry} x2={CX + 460 * rule} y2={ry} stroke={C.gold} strokeWidth={3} strokeLinecap="round" />
          <rect x={CX - 7} y={ry - 7} width={14} height={14} transform={`rotate(45 ${CX} ${ry})`} fill={C.gold} opacity={rule} />
        </g>
      </svg>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${breath})` }}>
        <CueDrivenText lineIndex={5} rows={[[0, 1]]} fontSize={176} weight={900} variant="scale" extrude shineStart={A.ready} pop={0.06} offset={{ y: -20 }} />
      </div>
      <LightSweep start={A.ready} end={A.ready + 30} angle={14} color="rgba(255,236,190,0.95)" width={300} opacity={0.4} />
    </>
  );
};
export const FINAL_PERIM = PER;
