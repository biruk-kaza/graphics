import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { cameraAt } from "../animation/world";

/** 2.5D camera: pan / yaw / push-in driven only by the frame. */
export const CameraRig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const c = cameraAt(useCurrentFrame());
  return (
    <AbsoluteFill style={{ transform: `perspective(2400px) translate3d(${c.tx}px, ${c.ty}px, 0) rotateY(${c.rotY}deg) rotateX(${c.rotX}deg) scale(${c.scale})`, transformOrigin: "50% 50%" }}>
      {children}
    </AbsoluteFill>
  );
};
