import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { progress } from "../animation/frameMath";
import { easeInOutCubic } from "../animation/easing";

/** A soft band of light crossing the frame. */
export const LightSweep: React.FC<{ start: number; end: number; angle?: number; color?: string; width?: number; opacity?: number }> = ({
  start, end, angle = 18, color = "rgba(255,255,255,0.9)", width = 380, opacity = 0.35,
}) => {
  const f = useCurrentFrame();
  if (f < start || f > end) return null;
  const p = easeInOutCubic(progress(f, start, end));
  const x = -2400 + p * 4800;
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none", mixBlendMode: "screen" }}>
      <div style={{ position: "absolute", left: 960 + x - width / 2, top: -800, width, height: 2700, transform: `rotate(${angle}deg)`, transformOrigin: "50% 50%",
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: opacity * Math.sin(Math.PI * p) }} />
    </AbsoluteFill>
  );
};
