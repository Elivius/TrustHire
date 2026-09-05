"use client";

import { Medusae } from "antigravity-particle";

export function CursorParticles() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <Medusae />
    </div>
  );
}