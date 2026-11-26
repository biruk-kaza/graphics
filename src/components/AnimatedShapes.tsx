import React from "react";
import { useCurrentFrame } from "remotion";
import { H, W } from "../styles/designSystem";
import { K, N_STRANDS, smoothPath, strandDrawIn, strandPoints, strandRetract, strandStyle, stageU } from "../animation/world";
import { cameraAt } from "../animation/world";
import { MotionBlurFilter } from "./MotionBlur";


/** The persistent strand system: 26 SVG paths that physically morph chaos -> direction -> grid -> waveform -> seed -> burst -> final rings. */
export const StrandWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const camV = cameraAt(frame).tx - cameraAt(frame - 1).tx;
  const sv = Math.abs(stageU(frame) - stageU(frame - 1));
  const bx = Math.min(12, Math.max(0, Math.abs(camV) * 0.5 + sv * 90 - 0.15));
  const strands = [];
  for (let i = 0; i < N_STRANDS; i++) {
    const draw = strandDrawIn(frame, i);
    const ret = strandRetract(frame, i);
    if (draw <= 0.001 || ret >= 0.999) continue;
    const st = strandStyle(i, frame);
    if (st.opacity <= 0.01) continue;
    const d = smoothPath(strandPoints(i, frame));
    const off = 1 - draw + ret;
    const dash = off > 0.0005 ? { strokeDasharray: "1 1", strokeDashoffset: off } : {};
    const col = st.color;
    strands.push(
      <g key={i}>
        <path d={d} pathLength={1} fill="none" stroke={col} strokeWidth={st.width * 5} strokeOpacity={st.opacity * 0.14} strokeLinecap="round" {...dash} />
        <path d={d} pathLength={1} fill="none" stroke={col} strokeWidth={st.width} strokeOpacity={st.opacity} strokeLinecap="round" {...dash} />
      </g>
    );
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <defs><MotionBlurFilter id="mb" bx={bx} /></defs>
      <g filter={bx > 0.02 ? "url(#mb)" : undefined}>{strands}</g>
    </svg>
  );
};
export const STRAND_POINTS = K;
