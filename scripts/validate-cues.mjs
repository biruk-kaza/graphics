// Automated validation of public/data/voiceover-cues.json (fails the CI build on any problem).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cues = JSON.parse(fs.readFileSync(path.join(root, "public/data/voiceover-cues.json"), "utf8"));
const REQUIRED = [
  "ብዙዎች ነገሮችን ማወሳሰብ ያበዛሉ።",
  "እኛ ግን አቅጣጫውን እንቀይራለን።",
  "ጥርት ያለ ቅርጽ፣ ትክክለኛ ጊዜ፣ ምንም ትርፍ ነገር የለም።",
  "ቃሉን ስትናገሩ ስክሪኑ ይንቀሳቀሳል።",
  "ቀላል ሀሳብ፣ ትልቅ ውጤት።",
  "አሁን ተዘጋጅተናል።",
];
const errs = [];
const err = (m) => errs.push(m);
const isInt = Number.isInteger;

if (cues.fps !== 30) err(`fps must be 30, got ${cues.fps}`);
if (!isInt(cues.totalFrames) || cues.totalFrames < cues.audioFrames) err("totalFrames must be an integer >= audioFrames");
if (cues.lines.length !== REQUIRED.length) err(`expected ${REQUIRED.length} lines`);
let prevEnd = -1;
cues.lines.forEach((L, li) => {
  if (L.text !== REQUIRED[li]) err(`line ${li + 1}: text differs from authoritative script`);
  const joined = L.words.map((w) => w.text).join(" ");
  if (joined !== L.text) err(`line ${li + 1}: words (${joined}) do not rebuild the line text`);
  if (![L.startFrame, L.endFrame].every(isInt) || L.startFrame >= L.endFrame) err(`line ${li + 1}: bad start/end`);
  if (L.startFrame < prevEnd) err(`line ${li + 1}: overlaps previous line`);
  if (L.endFrame > cues.audioFrames) err(`line ${li + 1}: ends after the audio`);
  prevEnd = L.endFrame;
  let wEnd = L.startFrame;
  L.words.forEach((w, wi) => {
    if (![w.startFrame, w.endFrame].every(isInt)) err(`L${li + 1}W${wi + 1}: non-integer frames`);
    if (w.startFrame >= w.endFrame) err(`L${li + 1}W${wi + 1}: non-positive duration`);
    if (w.startFrame < wEnd) err(`L${li + 1}W${wi + 1}: overlaps previous word`);
    if (w.startFrame < L.startFrame || w.endFrame > L.endFrame) err(`L${li + 1}W${wi + 1}: outside its line`);
    if (wi > 0 && w.startFrame - wEnd > 0) console.log(`  pause ${w.startFrame - wEnd}f before L${li + 1}W${wi + 1} "${w.text}" (legit gap)`);
    wEnd = w.endFrame;
  });
});
const counts = {};
cues.lines.forEach((L) => L.words.forEach((w) => (counts[w.confidence] = (counts[w.confidence] || 0) + 1)));
console.log("confidence summary:", counts);
if (errs.length) { console.error("\nCUE VALIDATION FAILED:\n - " + errs.join("\n - ")); process.exit(1); }
console.log(`Cue sheet OK: ${cues.lines.length} lines, ${cues.lines.reduce((a, l) => a + l.words.length, 0)} words, ${cues.totalFrames} frames @ ${cues.fps}fps`);
