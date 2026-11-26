import React from "react";
import { useCurrentFrame } from "remotion";
import { C, FONT, H, W } from "../styles/designSystem";
import { rng, progress } from "../animation/frameMath";
import { dampedSpring } from "../animation/easing";
import { A } from "../animation/world";
import { line } from "../animation/cueEngine";
import { CueDrivenText } from "../components/CueDrivenText";

const N = 24;
const SHAPES = (() => {
  const r = rng(909);
  return Array.from({ length: N }, (_, i) => ({ x: 120 + r() * (W - 240), y: 100 + r() * (H - 200), size: 26 + r() * 70, kind: i % 5, ph: r() * 6.28, spin: (r() - 0.5) * 0.05, col: [C.cyan, C.purple, C.white, C.gold][i % 4] }));
})();
const GHOSTS = (() => {
  const r = rng(31);
  return [0, 1, 2, 3].map(() => ({ x: 160 + r() * (W - 700), y: 120 + r() * (H - 380), rot: (r() - 0.5) * 24 }));
})();

const Shape: React.FC<{ kind: number; s: number; col: string }> = ({ kind, s, col }) => {
  const sw = 2;
  switch (kind) {
    case 0: return <polygon points={`0,${-s} ${s * 0.87},${s * 0.5} ${-s * 0.87},${s * 0.5}`} fill="none" stroke={col} strokeWidth={sw} />;
    case 1: return <circle r={s * 0.8} fill="none" stroke={col} strokeWidth={sw} />;
    case 2: return <path d={`M${-s} 0H${s}M0 ${-s}V${s}`} stroke={col} strokeWidth={sw} />;
    case 3: return <rect x={-s * 0.7} y={-s * 0.7} width={s * 1.4} height={s * 1.4} fill="none" stroke={col} strokeWidth={sw} />;
    default: return <circle r={s * 0.9} fill="none" stroke={col} strokeWidth={sw} strokeDasharray={`${s * 0.5} ${s * 0.35}`} />;
  }
};

/** EVENT 1 - complexity builds with the sentence and peaks on the last word, then is torn away at "ግን". */
export const ComplexityScene: React.FC = () => {
  const f = useCurrentFrame();
  if (f > A.snap + 20) return null;
  const out = progress(f, A.but, A.snap + 6);
  const l1 = line(0);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {SHAPES.map((s, i) => {
          const st = 4 + Math.round((i * (A.l1End - 18)) / N);
          const a = dampedSpring(progress(f, st, st + 14));
          if (a <= 0 || out >= 1) return null;
          const speed = 1 + f / 40;
          return (
            <g key={i} transform={`translate(${s.x + Math.sin(f * 0.05 + s.ph) * 18},${s.y + Math.cos(f * 0.04 + s.ph) * 14}) rotate(${(s.ph * 57 + f * s.spin * 57 * speed) % 360}) scale(${a * (1 - out * 0.6)})`} opacity={0.75 * (1 - out)}>
              <Shape kind={s.kind} s={s.size} col={s.col} />
            </g>
          );
        })}
      </svg>
      {/* oversized outlined fragments of the spoken words: typography interacting with the composition */}
      {GHOSTS.map((g, i) => {
        const w = l1.words[i];
        const a = progress(f, w.startFrame, w.startFrame + 10) * (1 - out);
        if (a <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", left: g.x, top: g.y, fontFamily: FONT, fontWeight: 900, fontSize: 300, whiteSpace: "nowrap", color: "transparent",
            WebkitTextStroke: `2px ${i % 2 ? C.cyan : C.purple}`, opacity: 0.22 * a, transform: `rotate(${g.rot + Math.sin(f * 0.05 + i) * 3}deg) translateX(${(1 - a) * -80}px)` }}>{w.text.replace("።", "")}</div>
        );
      })}
      <CueDrivenText lineIndex={0} rows={[[0, 1], [2, 3]]} fontSize={150} variant="rise" glitch pop={0.08} exitAt={A.l1End + 4} exitFrames={9} />
    </>
  );
};
