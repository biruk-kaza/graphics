import React from "react";
import { useCurrentFrame } from "remotion";
import { C, CX, CY, H, W } from "../styles/designSystem";
import { progress } from "../animation/frameMath";
import { easeOutCubic, easeOutQuart } from "../animation/easing";
import { A, hitL4 } from "../animation/world";
import { cameraAt } from "../animation/world";
import { ws } from "../animation/cueEngine";
import { CueDrivenText } from "../components/CueDrivenText";
import { LightSweep } from "../components/LightSweep";

const FX = 180, FY = 110, FW = 1560, FH = 860;
const PERIM = 2 * (FW + FH);

/** EVENT 4 - the screen answers speech. Each word triggers its own, different reaction. */
export const ResponsiveScreenScene: React.FC = () => {
  const f = useCurrentFrame();
  if (f < A.l4Start - 8 || f > A.l5Start + 14) return null;
  const w0 = ws(3, 0), w1 = ws(3, 1), w2 = ws(3, 2), w3 = ws(3, 3);
  // "ቃሉን": a ripple leaves the point of speech
  const rp = progress(f, w0, w0 + 30);
  // "ስትናገሩ": bars of light expand outward from the centre
  const bar = easeOutQuart(progress(f, w1, w1 + 18));
  const barFade = 1 - progress(f, A.l4End, A.l4End + 20);
  // "ስክሪኑ": the screen frame draws itself
  const draw = easeOutCubic(progress(f, w2, w2 + 16));
  const fade = 1 - progress(f, A.l5Start - 2, A.l5Start + 12);
  const frameOpacity = draw * fade;
  // "ይንቀሳቀሳል": the frame moves - trailing ghosts follow the camera velocity
  const v = cameraAt(f).tx - cameraAt(f - 1).tx;
  const ghosts = [1, 2, 3];
  const rect = (o: number, sw: number, col: string, dx = 0, dash?: boolean) => (
    <rect x={FX + dx} y={FY} width={FW} height={FH} rx={28} fill="none" stroke={col} strokeWidth={sw} strokeOpacity={o}
      {...(dash ? { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - draw } : {})} />
  );
  return (
    <>
      <LightSweep start={w3} end={w3 + 22} angle={12} color="rgba(139,92,255,0.95)" width={340} opacity={0.45} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {rp > 0 && rp < 1 && (
          <>
            <circle cx={CX} cy={CY} r={40 + 980 * easeOutCubic(rp)} fill="none" stroke={C.cyan} strokeWidth={3.5 * (1 - rp) + 0.5} strokeOpacity={0.85 * (1 - rp)} />
            <circle cx={CX} cy={CY} r={20 + 760 * easeOutCubic(rp)} fill="none" stroke={C.white} strokeWidth={1.5} strokeOpacity={0.5 * (1 - rp)} />
          </>
        )}
        {bar > 0 && barFade > 0 && (
          <g opacity={barFade}>
            <rect x={CX - 760 * bar} y={CY + 212} width={1520 * bar} height={4} rx={2} fill={C.gold} />
            <rect x={CX - 520 * bar} y={CY - 226} width={1040 * bar} height={2} rx={1} fill={C.cyan} opacity={0.8} />
          </g>
        )}
        {draw > 0 && fade > 0 && (
          <g>
            <rect x={FX} y={FY} width={FW} height={FH} rx={28} fill="url(#scr)" opacity={0.5 * frameOpacity} />
            {ghosts.map((k) => <g key={k}>{rect(0.18 / k, 2, C.cyan, -v * 5 * k)}</g>)}
            {rect(frameOpacity * (0.75 + 0.25 * hitL4(f)), 3, C.gold, 0, true)}
            {[[FX, FY], [FX + FW, FY], [FX, FY + FH], [FX + FW, FY + FH]].map(([x, y], i) => (
              <path key={i} d={`M${x + (i % 2 ? -44 : 44)} ${y}H${x}V${y + (i < 2 ? 44 : -44)}`} fill="none" stroke={C.white} strokeWidth={4} strokeLinecap="round" opacity={frameOpacity} />
            ))}
          </g>
        )}
        <defs>
          <linearGradient id="scr" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(139,92,255,0.18)" /><stop offset="1" stopColor="rgba(79,216,255,0.06)" />
          </linearGradient>
        </defs>
      </svg>
      <CueDrivenText lineIndex={3} rows={[[0, 1], [2, 3]]} fontSize={124} variant="scale" underline pop={0.12} offset={{ y: -10 }} exitAt={A.l5Start - 8} />
    </>
  );
};
export const SCREEN_PERIM = PERIM;
