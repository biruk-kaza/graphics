# Audio-reactive Amharic motion graphics (Remotion + GitHub Actions)

Push this repo to GitHub -> **Actions** tab -> *Render Amharic motion graphics* -> download the artifact
`amharic-motion-graphics` (contains `final-amharic-motion-graphics.mp4`, QA stills, the cue sheet).
Tag a commit `v1` (`git tag v1 && git push --tags`) to also get the MP4 attached to a GitHub Release.

## What was measured from your recording (not the 17 s estimate)
`Recording (4).mp3`: **14.464 s, 48 kHz stereo**. Video length = voice + 1.6 s hold = **482 frames @ 30 fps (16.07 s)**.
The rough 17 s timing table did not match the recording, so it was discarded; everything is derived from the audio.

| Line | Speech frames [start, end) |
|---|---|
| 1 ብዙዎች ነገሮችን ማወሳሰብ ያበዛሉ። | 14 – 76 |
| 2 እኛ ግን አቅጣጫውን እንቀይራለን። | 85 – 137 |
| 3 ጥርት ያለ ቅርጽ፣ ትክክለኛ ጊዜ፣ ምንም ትርፍ ነገር የለም። | 148 – 241 |
| 4 ቃሉን ስትናገሩ ስክሪኑ ይንቀሳቀሳል። | 255 – 320 |
| 5 ቀላል ሀሳብ፣ ትልቅ ውጤት። | 329 – 379 |
| 6 አሁን ተዘጋጅተናል። | 390 – 433 |

## Honest timing report
* **Phrase/pause boundaries are measured** from the waveform (confidence `verified`): 8 speech regions, 7 real pauses.
* **Word boundaries are NOT forced-aligned** (no reliable Amharic aligner exists). They come from a Viterbi search that mixes
  syllable (Fidel) counts with real energy dips: 11 words `snapped` to a clear dip, 16 `estimated`.
  Least certain: the fast run **ምንም ትርፍ ነገር የለም** (lines 3, frames ~208-241) and the middle words of lines 1, 2, 4.
* Animations on uncertain words are kept soft (3-frame lead-in/7-frame settle), and big visual hits are placed on the
  better-measured anchors (clause starts, "ግን", "ትክክለኛ", "ስክሪኑ", "ይንቀሳቀሳል", "ትልቅ", "ተዘጋጅተናል").

## Fine-tuning sync (no code needed)
Watch the video, note a word that is early/late, then edit `public/data/timing-overrides.json` (seconds):
```json
{ "3.2.5": { "start": 7.30, "end": 7.55 }, "4.1": { "start": 8.52, "end": 10.70 } }
```
`line.region.word` pins one word; `line.region` moves a whole acoustic region. Then run
`python3 scripts/analyze_audio.py` (needs numpy, scipy, ffmpeg), commit the regenerated `public/data/voiceover-cues.json`, push.
If you **replace the voiceover** (`public/audio/voiceover.mp3`), run the workflow manually with **reanalyze = true**
(or run the script locally). The animation is cue-driven, so it re-syncs automatically; the script stops with an error
if it cannot find the expected 9 speech regions.

## Concept
One continuous world instead of six scenes: 26 SVG strands + 96 particles + a 2.5D camera morph through seven states:
chaos -> direction (strands converge on one point, camera whip) -> grid (lines snap, spring settle) -> removal (everything
unnecessary retracts, leaving 3 lines) -> speech-reactive waveform lines (real loudness + per-word hits) -> seed (3 tiny
rings) -> burst/layered tunnel -> final rings + gold frame. Amharic words are whole units (never split by Fidel), each
animated from its own `startFrame/endFrame`.

## Project map
`src/animation/` frame math, easing, cue engine, world model | `src/components/` strands, particles, typography, camera, light |
`src/scenes/` six events | `public/data/` cue sheet, waveform, overrides | `scripts/` analysis, validation, MP4 verification |
`.github/workflows/render.yml` CI. Local: `npm install && npm run studio` / `npm run render`.

## Not verified here (please read)
The sandbox had no internet, so Remotion itself could not be installed. I validated the cue sheet, bundled the real code
against a tiny Remotion stand-in, rendered **all 482 frames** in Chromium, measured frame-to-frame jumps to find and remove pops
(camera raster-path flicker, an over-sharp burst ease, blur on/off switching, text-ghost and colour pops; see `preview/overview.png`), but **no Remotion render of the full MP4
was run and the audio/video sync could not be listened to**. The first GitHub run is the real test: its job fails on any
cue, font, resolution, fps, codec or audio-stream mismatch, and uploads stills so you can check frames before downloading.
Fonts come from `@fontsource/noto-sans-ethiopic` copied into `public/fonts` at install; the render aborts if they are missing.
