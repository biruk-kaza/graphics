#!/usr/bin/env bash
# Verifies the rendered MP4 with ffprobe. Exits non-zero on any mismatch.
set -euo pipefail
F="${1:-output/final-amharic-motion-graphics.mp4}"
[ -f "$F" ] || { echo "missing $F"; exit 1; }
EXPECT_FRAMES=$(node -e "console.log(require('./public/data/voiceover-cues.json').totalFrames)")
V=$(ffprobe -v error -select_streams v -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames -of default=nw=1 "$F")
A=$(ffprobe -v error -select_streams a -show_entries stream=codec_name,channels,sample_rate -of default=nw=1 "$F")
NA=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$F" | wc -l | tr -d ' ')
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F")
echo "--- video ---"; echo "$V"; echo "--- audio ---"; echo "$A"; echo "audio streams: $NA  duration: $DUR s  (expected frames: $EXPECT_FRAMES)"
echo "$V" | grep -q "codec_name=h264"       || { echo "FAIL: not h264"; exit 1; }
echo "$V" | grep -q "width=1920"            || { echo "FAIL: width"; exit 1; }
echo "$V" | grep -q "height=1080"           || { echo "FAIL: height"; exit 1; }
echo "$V" | grep -q "r_frame_rate=30/1"     || { echo "FAIL: fps"; exit 1; }
[ "$NA" = "1" ]                             || { echo "FAIL: expected exactly 1 audio stream"; exit 1; }
node -e "const d=parseFloat('$DUR'),e=$EXPECT_FRAMES/30; if(Math.abs(d-e)>0.15){console.error('FAIL: duration',d,'expected',e);process.exit(1)}"
echo "VERIFY OK"
