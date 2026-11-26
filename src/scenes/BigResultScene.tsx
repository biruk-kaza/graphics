import React from "react";
import { useCurrentFrame } from "remotion";
import { C, CX, CY, H, W } from "../styles/designSystem";
import { progress } from "../animation/frameMath";
import { dampedSpring, easeInOutCubic, easeOutCubic, easeOutQuart } from "../animation/easing";
import { A } from "../animation/world";
import { mix } from "../animation/animationPresets";
import { CueDrivenText } from "../components/CueDrivenText";
import { ImpactFlash } from "../components/SceneTransitions";

const LAYERS = 14;
const RAYS = 28;

/** EVENT 5 - one tiny square unfolds into a layered, perspective structure. gs = how far the layers have "spread". */
export const BigResultScene: React.FC = () => {
  const f = useCurrentFrame();
  if (f < A.l5Start - 4) return null;
  const appear = dampedSpring(progress(f, A.small, A.small + 16));
  const turn = easeOutCubic(progress(f, A.l5Start + 15, A.big)); // "ሀሳብ": the seed turns
  const gs = easeOutQuart(progress(f, A.big, A.big + 34));
  const wind = easeInOutCubic(progress(f, A.big - 8, A.big)); // anticipation: the seed draws in a breath before it unfolds
  const settle = progress(f, A.l6Start, A.l6Start + 36);
  const tilt = 62 + settle * 4;
  const layers = [];
  for (let i = LAYERS - 1; i >= 0; i--) {
    const side = 46 * Math.pow(1.4, i * gs);
    const col = mix(C.cyan, i > 6 ? C.gold : C.purple, i / (LAYERS - 1));
    const op = (i === 0 ? 1 : gs * (1 - i / (LAYERS + 2))) * 0.9;
    if (op <= 0.01) continue;
    layers.push(<rect key={i} x={-side / 2} y={-side / 2} width={side} height={side} rx={side * 0.06} fill="none" stroke={col} strokeWidth={i === 0 ? 4 : 2.2} strokeOpacity={op} transform={`rotate(${i * 3.2 * gs})`} />);
  }
  const seedVis = appear * (1 - 0.22 * wind * (1 - gs));
  const rayP = easeOutQuart(progress(f, A.big, A.big + 34));
  const rayFade = 1 - progress(f, A.big + 6, A.big + 34);
  return (
    <>
      <ImpactFlash at={A.big} color="255,244,214" peak={0.2} decay={16} />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `perspective(1500px) rotateX(${tilt * gs + 0.02}deg) scale(${0.9 + 0.1 * gs})`, transformOrigin: "50% 52%" }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <g transform={`translate(${CX},${CY}) rotate(${45 * turn + (f - A.big > 0 ? (f - A.big) * 0.18 : 0)}) scale(${seedVis})`}>{layers}</g>
        </svg>
      </div>
      {rayFade > 0 && rayP > 0 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: RAYS }, (_, i) => {
            const a = (i / RAYS) * Math.PI * 2 + 0.1;
            const r0 = 90 + 260 * rayP, r1 = r0 + 150 + 650 * rayP;
            return <line key={i} x1={CX + Math.cos(a) * r0} y1={CY + Math.sin(a) * r0 * 0.7} x2={CX + Math.cos(a) * r1} y2={CY + Math.sin(a) * r1 * 0.7} stroke={i % 3 ? C.white : C.gold} strokeWidth={i % 3 ? 1.5 : 3} strokeOpacity={0.55 * rayFade} strokeLinecap="round" />;
          })}
        </svg>
      )}
      <CueDrivenText lineIndex={4} rows={[[0, 1]]} fontSize={112} variant="rise" offset={{ y: -330 }} pop={0.08} exitAt={A.l5End + 4} />
      <CueDrivenText lineIndex={4} rows={[[2, 3]]} fontSize={210} variant="scale" offset={{ y: 300 }} pop={0.1} exitAt={A.l5End + 4} />
    </>
  );
};
