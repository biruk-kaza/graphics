import React from "react";
/** Directional gaussian blur filter. Use <defs><MotionBlurFilter id=.. bx={..}/></defs> and filter="url(#id)". */
export const MotionBlurFilter: React.FC<{ id: string; bx: number; by?: number }> = ({ id, bx, by = 0 }) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
  </filter>
);
