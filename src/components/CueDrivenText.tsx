import React from "react";
import { useCurrentFrame } from "remotion";
import { C, FONT, H, W } from "../styles/designSystem";
import { CueWord, cues, getEmphasisState, line } from "../animation/cueEngine";
import { clamp, progress, rng } from "../animation/frameMath";
import { dampedSpring, easeOutCubic } from "../animation/easing";
import { READ_SHADOW, extrusion, mix } from "../animation/animationPresets";

export type Variant = "rise" | "slide" | "snap" | "scale";
export type CueTextProps = {
  lineIndex: number;           // 0-based index into the cue sheet
  rows: number[][];            // word indices per visual row; words are NEVER split inside
  fontSize: number;
  variant: Variant;
  align?: "center" | "left";
  offset?: { x?: number; y?: number };
  box?: { left: number; top: number; width: number; height: number };
  weight?: number;
  gap?: number;                // between words, in em
  rowGap?: number;             // px
  lineHeight?: number;
  rotate?: number;
  exitAt?: number;             // frame the whole block starts leaving (default: after the line, before the next)
  exitFrames?: number;
  underline?: boolean;
  glitch?: boolean;
  pop?: number;                // scale kick on emphasised words
  extrude?: boolean;
  shineStart?: number;
  rowOpacity?: (row: number, frame: number) => number;
};

const defaultExit = (li: number) => {
  const l = line(li), next = cues.lines[li + 1];
  return next ? Math.min(l.endFrame + 14, next.startFrame - 6) : Infinity;
};

const WordView: React.FC<{ w: CueWord; li: number; wi: number; frame: number; p: CueTextProps }> = ({ w, li, wi, frame, p }) => {
  const e = progress(frame, w.startFrame - 3, w.startFrame + 7);
  const ee = easeOutCubic(e);
  const emph = getEmphasisState(frame, w);
  const after = frame >= w.endFrame ? progress(frame, w.endFrame, w.endFrame + 12) : 0;
  const hot = emph.active ? 1 : frame >= w.endFrame ? 1 - after : 0;
  const major = w.emphasis === "major";
  const color = mix(C.mist, major ? C.goldSoft : C.white, hot);
  const r = rng(li * 100 + wi * 7 + 3);
  const sx = (r() - 0.5) * 0.9, sy = (r() - 0.5) * 0.7, sr = (r() - 0.5) * 16;
  const snap = dampedSpring(progress(frame, w.startFrame - 2, w.startFrame + 12));
  const kick = 1 + emph.hit * (p.pop ?? 0.05);

  const xf = (k: number) => {
    // k = 1 for the main layer; ghosts use k>1 to trail behind the motion (cheap motion blur)
    const q = 1 - ee * (k === 1 ? 1 : 1 / k) ;
    switch (p.variant) {
      case "rise": return `translateY(${q * 0.95 * (k === 1 ? 1 : k)}em) scale(${kick})`;
      case "slide": return `translateX(${-q * 0.9 * (k === 1 ? 1 : k)}em) skewX(${-q * 14}deg) scale(${kick})`;
      case "snap": return `translate(${sx * (1 - snap)}em, ${sy * (1 - snap)}em) rotate(${sr * (1 - snap)}deg) scale(${kick})`;
      default: return `scale(${(0.7 + 0.3 * ee) * kick})`;
    }
  };
  const opacity = p.variant === "snap" ? clamp(e * 2) : ee;
  const clip = e < 1 && p.variant !== "snap";
  const glow = major && emph.active ? `, 0 0 44px rgba(139,92,255,${0.55 * hot}), 0 0 18px rgba(232,188,99,${0.45 * hot})` : "";
  const shadow = (p.extrude ? extrusion() + ", " : "") + READ_SHADOW + glow;
  const spanStyle: React.CSSProperties = { display: "inline-block", whiteSpace: "nowrap", color, textShadow: shadow, willChange: "transform" };
  const ghosts = e > 0 && e < 1 && p.variant !== "snap" ? [2, 3] : [];
  const gl = p.glitch && major && emph.active ? 7 * emph.hit * Math.sin(frame * 2.7) : 0;

  const shineP = p.shineStart != null ? progress(frame, p.shineStart, p.shineStart + 28) : 0;
  return (
    <span style={{ position: "relative", display: "inline-block", overflow: clip ? "hidden" : "visible", padding: "0.14em 0.06em", margin: "-0.14em -0.06em" }}>
      {ghosts.map((k) => (
        <span key={k} style={{ ...spanStyle, position: "absolute", left: "0.06em", top: "0.14em", opacity: opacity * 0.22 * (1 - e) / (k - 1), transform: xf(k), textShadow: "none", color: C.cyan }} aria-hidden>{w.text}</span>
      ))}
      {gl !== 0 && (<>
        <span aria-hidden style={{ ...spanStyle, position: "absolute", left: "0.06em", top: "0.14em", color: C.cyan, textShadow: "none", mixBlendMode: "screen", transform: `translateX(${gl}px)`, opacity: 0.8 }}>{w.text}</span>
        <span aria-hidden style={{ ...spanStyle, position: "absolute", left: "0.06em", top: "0.14em", color: C.purple, textShadow: "none", mixBlendMode: "screen", transform: `translateX(${-gl}px)`, opacity: 0.8 }}>{w.text}</span>
      </>)}
      <span style={{ ...spanStyle, opacity, transform: xf(1) }}>{w.text}</span>
      {p.shineStart != null && shineP > 0 && shineP < 1 && (
        <span aria-hidden style={{ position: "absolute", left: "0.06em", top: "0.14em", display: "inline-block", whiteSpace: "nowrap", color: "transparent",
          backgroundImage: "linear-gradient(100deg, transparent 35%, rgba(255,255,255,.95) 50%, transparent 65%)", backgroundSize: "300% 100%",
          backgroundPosition: `${100 * (1 - shineP)}% 0`, WebkitBackgroundClip: "text", backgroundClip: "text", transform: xf(1) }}>{w.text}</span>
      )}
      {p.underline && frame >= w.startFrame - 1 && (
        <span aria-hidden style={{ position: "absolute", left: "0.06em", right: "0.06em", bottom: "0.1em", height: "0.045em", borderRadius: 4,
          background: major ? C.gold : C.cyan, transformOrigin: "left center",
          transform: `scaleX(${frame >= w.endFrame ? 1 : progress(frame, w.startFrame, w.endFrame)})`, opacity: 0.55 + 0.45 * hot }} />
      )}
    </span>
  );
};

/** Renders words of one cue-sheet line, each word driven by its own startFrame/endFrame. */
export const CueDrivenText: React.FC<CueTextProps> = (p) => {
  const frame = useCurrentFrame();
  const L = line(p.lineIndex);
  const first = Math.min(...p.rows.flat().map((wi) => L.words[wi].startFrame));
  if (frame < first - 8) return null;
  const exitAt = p.exitAt ?? defaultExit(p.lineIndex);
  const ex = progress(frame, exitAt, exitAt + (p.exitFrames ?? 10));
  if (ex >= 1) return null;
  const box = p.box ?? { left: 0, top: 0, width: W, height: H };
  const align = p.align ?? "center";
  return (
    <div style={{ position: "absolute", ...box, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: align === "center" ? "center" : "flex-start",
      transform: `translate(${p.offset?.x ?? 0}px, ${(p.offset?.y ?? 0) - ex * 36}px) rotate(${p.rotate ?? 0}deg)`, opacity: 1 - ex, filter: ex > 0 ? `blur(${ex * 10}px)` : undefined }}>
      {p.rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex", gap: `${p.gap ?? 0.34}em`, fontFamily: FONT, fontWeight: p.weight ?? 800, fontSize: p.fontSize, lineHeight: p.lineHeight ?? 1.3,
          marginTop: ri === 0 ? 0 : p.rowGap ?? 10, opacity: p.rowOpacity ? p.rowOpacity(ri, frame) : 1, letterSpacing: "0.01em" }}>
          {row.map((wi) => <WordView key={wi} w={L.words[wi]} li={p.lineIndex} wi={wi} frame={frame} p={p} />)}
        </div>
      ))}
    </div>
  );
};
