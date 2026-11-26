#!/usr/bin/env python3
"""
Voiceover analysis -> public/data/voiceover-cues.json (+ waveform.json)

What this does (and does NOT do), honestly:
  * Speech/pause regions ("clauses") are measured from the real waveform
    (speech-band RMS envelope, adaptive threshold)  -> confidence "verified".
  * Word boundaries INSIDE a clause are NOT forced-aligned (no reliable Amharic
    forced aligner exists). They are found with a Viterbi search that combines
      - syllable-proportional expectations from the Fidel character counts of the
        authoritative script, and
      - the real acoustic energy dips of the recording (word edges tend to sit
        on dips).
    Boundaries snapped to a clear dip -> "snapped", otherwise -> "estimated".

Re-run:  python3 scripts/analyze_audio.py   (needs ffmpeg, numpy, scipy)
Fine-tune by hand:  public/data/timing-overrides.json (see README)
"""
import json, os, subprocess, sys, tempfile
import numpy as np
import scipy.io.wavfile as wavfile
import scipy.signal as sg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, "public", "audio", "voiceover.mp3")
OUT = os.path.join(ROOT, "public", "data", "voiceover-cues.json")
WAVE_OUT = os.path.join(ROOT, "public", "data", "waveform.json")
OVERRIDES = os.path.join(ROOT, "public", "data", "timing-overrides.json")
FPS = 30
HOLD_SECONDS = 1.6  # intentional silent hold after the voice ends

# NOTE: "clauses" here are ACOUSTIC regions (separated by real silence). A word ending in "፣"
# opens a new logical clause inside the region (used for layout), see build below.
SCRIPT = [
    {"text": "ብዙዎች ነገሮችን ማወሳሰብ ያበዛሉ።", "clauses": [["ብዙዎች", "ነገሮችን", "ማወሳሰብ", "ያበዛሉ።"]]},
    {"text": "እኛ ግን አቅጣጫውን እንቀይራለን።", "clauses": [["እኛ", "ግን", "አቅጣጫውን", "እንቀይራለን።"]]},
    {"text": "ጥርት ያለ ቅርጽ፣ ትክክለኛ ጊዜ፣ ምንም ትርፍ ነገር የለም።",
     "clauses": [["ጥርት", "ያለ", "ቅርጽ፣"], ["ትክክለኛ", "ጊዜ፣", "ምንም", "ትርፍ", "ነገር", "የለም።"]]},  # 2nd acoustic region has no audible pause at the comma
    {"text": "ቃሉን ስትናገሩ ስክሪኑ ይንቀሳቀሳል።", "clauses": [["ቃሉን", "ስትናገሩ", "ስክሪኑ", "ይንቀሳቀሳል።"]]},
    {"text": "ቀላል ሀሳብ፣ ትልቅ ውጤት።", "clauses": [["ቀላል", "ሀሳብ፣"], ["ትልቅ", "ውጤት።"]]},
    {"text": "አሁን ተዘጋጅተናል።", "clauses": [["አሁን", "ተዘጋጅተናል።"]]},
]
MAJOR = {"ማወሳሰብ", "እንቀይራለን።", "አቅጣጫውን", "ትክክለኛ", "የለም።", "ይንቀሳቀሳል።", "ትልቅ", "ተዘጋጅተናል።"}
MINOR = {"ብዙዎች", "ግን", "ጥርት", "ቅርጽ፣", "ጊዜ፣", "ምንም", "ቃሉን", "ቀላል", "ውጤት።", "ሀሳብ፣", "አሁን"}


def syllables(word):
    return max(1, sum(1 for c in word if 0x1200 <= ord(c) <= 0x135A))


def decode():
    tmp = os.path.join(tempfile.mkdtemp(), "m.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", AUDIO, "-ac", "1", "-ar", "16000", tmp], check=True)
    sr, x = wavfile.read(tmp)
    return sr, x.astype(np.float32) / 32768.0


def fr(sec):
    return int(round(sec * FPS))


def main():
    sr, x = decode()
    dur = len(x) / sr
    b, a = sg.butter(4, [250, 3800], btype="band", fs=sr)
    y = sg.filtfilt(b, a, x)
    HOP = 0.005
    hop, win = int(HOP * sr), int(0.02 * sr)
    n = (len(y) - win) // hop
    env = np.array([np.sqrt(np.mean(y[i * hop:i * hop + win] ** 2)) for i in range(n)])
    db = 20 * np.log10(env + 1e-9)
    sm = np.convolve(db, np.ones(6) / 6, mode="same")

    # 1. coarse speech regions
    h10, w25 = int(0.01 * sr), int(0.025 * sr)
    m = (len(x) - w25) // h10
    rms = np.array([np.sqrt(np.mean(x[i * h10:i * h10 + w25] ** 2)) for i in range(m)])
    d = 20 * np.log10(rms + 1e-9)
    act = d > (np.percentile(d, 5) + 12)
    segs, s = [], None
    for i, v in enumerate(act):
        if v and s is None:
            s = i
        if (not v) and s is not None:
            segs.append([s, i]); s = None
    if s is not None:
        segs.append([s, m])
    merged = [segs[0]]
    for p, q in segs[1:]:
        if p - merged[-1][1] < 10:
            merged[-1][1] = q
        else:
            merged.append([p, q])
    coarse = [(p / 100, q / 100) for p, q in merged if (q - p) >= 40]

    clause_words = [(li, ci, c) for li, L in enumerate(SCRIPT) for ci, c in enumerate(L["clauses"])]
    if len(coarse) != len(clause_words):
        sys.exit(f"Expected {len(clause_words)} speech regions, found {len(coarse)}: {coarse}")

    # 2. refine clause edges relative to each region's own peak
    refined, prev_end = [], 0.0
    for (a0, b0) in coarse:
        lo, hi = max(a0 - 0.12, prev_end + 0.03), b0 + 0.12
        i0, i1 = int(lo / HOP), min(int(hi / HOP), len(sm))
        seg = sm[i0:i1]
        idx = np.where(seg > seg.max() - 35)[0]
        t0, t1 = (i0 + idx[0]) * HOP, (i0 + idx[-1]) * HOP
        refined.append((t0, t1))
        prev_end = t1

    # 3. word boundaries inside a clause
    def dp_boundaries(t0, t1, weights, commas):
        K = len(weights)
        if K == 1:
            return []
        cum = np.cumsum(weights)[:-1] / sum(weights)
        expect = t0 + (t1 - t0) * cum
        grid = np.arange(t0 + 0.08, t1 - 0.08, 0.01)
        e = np.array([sm[min(int(t / HOP), len(sm) - 1)] for t in grid])
        e = (e - e.min()) / (e.max() - e.min() + 1e-9)
        INF = 1e18
        cost = np.full((K - 1, len(grid)), INF)
        back = np.zeros((K - 1, len(grid)), int)
        for j in range(K - 1):
            for gi, t in enumerate(grid):
                ew, sig = (5.0, 0.30) if commas[j] else (1.6, 0.16)   # a comma = micro-pause: trust the dip more
                local = ew * e[gi] + ((t - expect[j]) / sig) ** 2
                if j == 0:
                    cost[j, gi] = local
                else:
                    ok = np.where(grid <= t - 0.16)[0]
                    if len(ok):
                        k = ok[np.argmin(cost[j - 1, ok])]
                        cost[j, gi] = cost[j - 1, k] + local
                        back[j, gi] = k
        gi = int(np.argmin(cost[-1]))
        path = [gi]
        for j in range(K - 2, 0, -1):
            gi = back[j, gi]
            path.append(gi)
        path = path[::-1]
        med = np.median(sm[int(t0 / HOP):int(t1 / HOP)])
        out = []
        for gidx in path:
            t = float(grid[gidx])
            snapped = bool(e[gidx] < 0.22 and (med - sm[int(t / HOP)]) > 6)
            out.append((t, "snapped" if snapped else "estimated"))
        return out

    overrides = json.load(open(OVERRIDES)) if os.path.exists(OVERRIDES) else {}

    lines = []
    for li, L in enumerate(SCRIPT):
        words_out = []
        for ci, c in enumerate(L["clauses"]):
            ri = [k for k, (l2, c2, _) in enumerate(clause_words) if l2 == li and c2 == ci][0]
            t0, t1 = refined[ri]
            ov = overrides.get(f"{li+1}.{ci+1}", {})
            t0, t1 = ov.get("start", t0), ov.get("end", t1)
            bounds = dp_boundaries(t0, t1, [syllables(w) for w in c], [w.endswith("፣") for w in c[:-1]])
            edges = [(t0, "verified")] + bounds + [(t1, "verified")]
            for wi, w in enumerate(c):
                s_t, s_c = edges[wi]
                e_t, e_c = edges[wi + 1]
                sf, ef = fr(s_t), fr(e_t)
                if ef <= sf:
                    ef = sf + 1
                conf = "verified" if (s_c == "verified" and e_c == "verified") else (
                    "snapped" if "estimated" not in (s_c, e_c) else "estimated")
                ow = overrides.get(f"{li+1}.{ci+1}.{wi+1}")
                if ow:
                    sf, ef, conf = fr(ow["start"]), fr(ow["end"]), "manual"
                words_out.append({"text": w, "region": ci + 1, "startFrame": sf, "endFrame": ef,
                                  "startSeconds": round(s_t, 3), "endSeconds": round(e_t, 3),
                                  "confidence": conf,
                                  "emphasis": "major" if w in MAJOR else ("minor" if w in MINOR else "none")})
        for k in range(1, len(words_out)):
            if words_out[k]["region"] == words_out[k - 1]["region"]:
                words_out[k - 1]["endFrame"] = words_out[k]["startFrame"]
                if words_out[k - 1]["endFrame"] <= words_out[k - 1]["startFrame"]:
                    words_out[k]["startFrame"] = words_out[k - 1]["startFrame"] + 1
                    words_out[k - 1]["endFrame"] = words_out[k]["startFrame"]
        # logical clauses: a word ending with "፣" or "።" closes a clause
        clauses_out, cur, cidx = [], [], 1
        for w in words_out:
            w["clause"] = cidx
            cur.append(w)
            if w["text"].endswith("፣") or w["text"].endswith("።"):
                clauses_out.append({"index": cidx, "startFrame": cur[0]["startFrame"], "endFrame": cur[-1]["endFrame"],
                                    "startSeconds": cur[0]["startSeconds"], "endSeconds": cur[-1]["endSeconds"]})
                cur, cidx = [], cidx + 1
        lines.append({"index": li + 1, "text": L["text"],
                      "startFrame": clauses_out[0]["startFrame"], "endFrame": clauses_out[-1]["endFrame"],
                      "clauses": clauses_out, "words": words_out})

    audio_frames = int(np.ceil(dur * FPS))
    total = max(audio_frames, lines[-1]["endFrame"]) + int(round(HOLD_SECONDS * FPS))
    data = {
        "fps": FPS, "audioFile": "audio/voiceover.mp3",
        "audioDurationSeconds": round(dur, 3), "audioFrames": audio_frames,
        "totalFrames": total, "language": "am",
        "timingMethod": "waveform-verified clause boundaries; word boundaries = acoustic-dip + syllable-weighted Viterbi (not forced alignment)",
        "intervals": "half-open [startFrame, endFrame)",
        "lines": lines,
    }
    json.dump(data, open(OUT, "w"), ensure_ascii=False, indent=2)

    amp = []
    for f_ in range(total):
        i0, i1 = int(f_ / FPS / HOP), int((f_ + 1) / FPS / HOP)
        seg = sm[i0:i1] if (i1 <= len(sm) and i1 > i0) else np.array([-90.0])
        amp.append(float(seg.max()))
    amp = np.array(amp)
    lo, hi = -60.0, float(np.percentile(amp, 98))
    amp = np.clip((amp - lo) / (hi - lo), 0, 1)
    json.dump({"fps": FPS, "values": [round(float(v), 3) for v in amp]}, open(WAVE_OUT, "w"))

    print(f"audio {dur:.3f}s  total frames {total} ({total/FPS:.2f}s)")
    for L in lines:
        print(f"L{L['index']}  {L['startFrame']:>3}-{L['endFrame']:>3}")
        for w in L["words"]:
            print(f"    {w['text']:<12} {w['startFrame']:>3}-{w['endFrame']:>3}  {w['confidence']:<9} {w['emphasis']}")


if __name__ == "__main__":
    main()
