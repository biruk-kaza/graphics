import React from "react";
import { useCurrentFrame } from "remotion";
import { C, H, W } from "../styles/designSystem";
import { N_PARTICLES, particleAt } from "../animation/world";

const COLS = [C.white, C.cyan, C.purple, C.gold];
export const ParticleSystem: React.FC = () => {
  const frame = useCurrentFrame();
  const els = [];
  for (let i = 0; i < N_PARTICLES; i++) {
    const p = particleAt(i, frame);
    if (p.op < 0.02) continue;
    const dx = Math.cos(p.ang) * p.len, dy = Math.sin(p.ang) * p.len;
    els.push(<line key={i} x1={p.x - dx} y1={p.y - dy} x2={p.x} y2={p.y} stroke={COLS[i % 4]} strokeOpacity={Math.min(1, p.op)} strokeWidth={p.size} strokeLinecap="round" />);
  }
  return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>{els}</svg>;
};
