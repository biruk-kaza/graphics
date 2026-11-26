import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { Background, Vignette } from "./components/ParallaxLayers";
import { CameraRig } from "./components/CameraRig";
import { StrandWorld } from "./components/AnimatedShapes";
import { ParticleSystem } from "./components/ParticleSystem";
import { ComplexityScene } from "./scenes/ComplexityScene";
import { DirectionScene } from "./scenes/DirectionScene";
import { PrecisionScene } from "./scenes/PrecisionScene";
import { ResponsiveScreenScene } from "./scenes/ResponsiveScreenScene";
import { BigResultScene } from "./scenes/BigResultScene";
import { FinalScene } from "./scenes/FinalScene";
import { cues } from "./animation/cueEngine";

/** One continuous world. The voiceover (cue sheet) is the master clock for every layer. */
export const Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#060A18" }}>
    <Audio src={staticFile(cues.audioFile)} />
    <Background />
    <CameraRig>
      <StrandWorld />
      <ParticleSystem />
      <BigResultScene />
      <ComplexityScene />
      <DirectionScene />
      <PrecisionScene />
      <ResponsiveScreenScene />
      <FinalScene />
    </CameraRig>
    <Vignette />
  </AbsoluteFill>
);
