import React, { useEffect, useState } from "react";
import { Composition, cancelRender, continueRender, delayRender } from "remotion";
import { Main } from "./Composition";
import { cues } from "./animation/cueEngine";
import { loadEthiopicFonts } from "./fonts";
import "./styles/global.css";

export const Root: React.FC = () => {
  const [handle] = useState(() => delayRender("Loading local Noto Sans Ethiopic"));
  useEffect(() => {
    loadEthiopicFonts().then(() => continueRender(handle)).catch((e) => cancelRender(e));
  }, [handle]);
  return <Composition id="AmharicMotion" component={Main} durationInFrames={cues.totalFrames} fps={cues.fps} width={1920} height={1080} />;
};
