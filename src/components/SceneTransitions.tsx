import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { pulse } from "../animation/easing";

/** Brief radial flash on a hit; a transition accent, not a fade. */
export const ImpactFlash: React.FC<{ at: number; color?: string; peak?: number; decay?: number }> = ({ at, color = "255,255,255", peak = 0.22, decay = 12 }) => {
  const o = pulse(useCurrentFrame(), at, decay, 3) * peak;
  if (o < 0.005) return null;
  return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(${color},${o}) 0%, rgba(${color},${o * 0.35}) 45%, transparent 75%)`, mixBlendMode: "screen", pointerEvents: "none" }} />;
};
