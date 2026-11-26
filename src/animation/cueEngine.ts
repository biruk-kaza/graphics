import cuesJson from "../../public/data/voiceover-cues.json";
import waveJson from "../../public/data/waveform.json";
import { clamp, progress } from "./frameMath";
import { pulse } from "./easing";

export type Confidence = "verified" | "snapped" | "estimated" | "manual";
export type CueWord = {
  text: string; clause: number; region: number;
  startFrame: number; endFrame: number; confidence: Confidence; emphasis: "none" | "minor" | "major";
};
export type CueClause = { index: number; startFrame: number; endFrame: number };
export type CueLine = { index: number; text: string; startFrame: number; endFrame: number; clauses: CueClause[]; words: CueWord[] };
export type Cues = { fps: number; audioFile: string; audioDurationSeconds: number; audioFrames: number; totalFrames: number; lines: CueLine[] };

export const cues = cuesJson as unknown as Cues;
export const FPS = cues.fps;
export const TOTAL_FRAMES = cues.totalFrames;

/** 0-indexed accessors: line(0) is the first spoken line. */
export const line = (li: number) => cues.lines[li];
export const word = (li: number, wi: number) => cues.lines[li].words[wi];
export const ws = (li: number, wi: number) => word(li, wi).startFrame;
export const we = (li: number, wi: number) => word(li, wi).endFrame;

export const getActiveLine = (frame: number): CueLine | null =>
  cues.lines.find((l) => frame >= l.startFrame && frame < l.endFrame) ?? null;
export const getActiveCue = (frame: number): CueWord | null => {
  for (const l of cues.lines) for (const w of l.words) if (frame >= w.startFrame && frame < w.endFrame) return w;
  return null;
};
/** 0..1 through the spoken word */
export const getWordProgress = (frame: number, w: CueWord) => progress(frame, w.startFrame, w.endFrame);
export const getLineProgress = (frame: number, l: CueLine) => progress(frame, l.startFrame, l.endFrame);
/** attack/decay state used for typographic and geometric emphasis */
export const getEmphasisState = (frame: number, w: CueWord) => {
  const active = frame >= w.startFrame && frame < w.endFrame;
  const strength = w.emphasis === "major" ? 1 : w.emphasis === "minor" ? 0.55 : 0.25;
  return { active, hit: pulse(frame, w.startFrame, w.emphasis === "major" ? 16 : 9) * strength, strength };
};
export const getTransitionProgress = progress;

/** Real measured loudness of the narration (0..1) for subtle reactive glow. Precomputed => deterministic. */
export const getAmp = (frame: number) => {
  const v = waveJson.values as number[];
  return v[clamp(Math.round(frame), 0, v.length - 1)] ?? 0;
};
