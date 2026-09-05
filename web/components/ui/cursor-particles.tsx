"use client";

import { Medusae } from "antigravity-particle";

export function CursorParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <Medusae
        config={{
          background: {
            color: "transparent",
          },

          cursor: {
            radius: 0.065,
            strength: 3,
            dragFactor: 0.015,
          },

          particles: {
            baseSize: 0.016,
            activeSize: 0.044,

            blobScaleX: 1,
            blobScaleY: 0.6,

            rotationSpeed: 0.1,
            rotationJitter: 0.2,

            cursorFollowStrength: 1,
            oscillationFactor: 1,

            // Original Google-like colors
            colorBase: "#0000ff",
            colorOne: "#4285f5",
            colorTwo: "#eb4236",
            colorThree: "#faba03",
          },

          halo: {
            outerOscFrequency: 2.6,
            outerOscAmplitude: 0.76,

            outerOscJitterStrength: 0.025,
            outerOscJitterSpeed: 0.3,

            radiusBase: 2.4,
            radiusAmplitude: 0.5,

            shapeAmplitude: 0.75,
            rimWidth: 1.8,

            outerStartOffset: 0.4,
            outerEndOffset: 2.2,

            scaleX: 1.3,
            scaleY: 1,
          },
        }}
      />
    </div>
  );
}