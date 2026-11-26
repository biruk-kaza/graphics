import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, CX, CY } from "../styles/designSystem";
import { getAmp } from "../animation/cueEngine";
import { A, stageU } from "../animation/world";
import { progress, piecewise } from "../animation/frameMath";

/** Atmosphere: deep gradient + drifting coloured light pools whose mood follows the narrative stage. */
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const amp = getAmp(f);
  const u = stageU(f);
  const purple = 0.34 + 0.1 * amp - 0.12 * Math.min(1, Math.max(0, u - 1));
  const cyan = piecewise(f, [{ f: A.but, v: 0 }, { f: A.snap + 10, v: 0.3 }, { f: A.l4Start, v: 0.14 }, { f: A.l6Start, v: 0.2 }]);
  const gold = 0.3 * progress(f, A.l6Start, A.l6Start + 40);
  const blob = (x: number, y: number, r: number, col: string, o: number) => ({
    position: "absolute" as const, left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%",
    background: `radial-gradient(circle, ${col} 0%, transparent 68%)`, opacity: o,
  });
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.navy2} 0%, ${C.navy} 60%, #04060F 100%)` }}>
      <div style={blob(CX - 520 + Math.sin(f * 0.012) * 60, CY - 260 + Math.cos(f * 0.01) * 40, 760, "rgba(139,92,255,.9)", purple)} />
      <div style={blob(CX + 560 + Math.cos(f * 0.011) * 70, CY + 240 + Math.sin(f * 0.013) * 50, 720, "rgba(79,216,255,.9)", cyan)} />
      <div style={blob(CX, CY, 900, "rgba(232,188,99,.9)", gold)} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(2,3,10,.72) 100%)", pointerEvents: "none" }} />
);
