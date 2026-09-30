"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import { ImageGeneration } from "img-fx";

// A decorative shader must never take down the composer on unsupported GPUs.
class RevealFallback extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function WelcomeReveal({ theme }: { theme: "light" | "dark" }) {
  return (
    <RevealFallback>
      <Reveal theme={theme} />
    </RevealFallback>
  );
}

function Reveal({ theme }: { theme: "light" | "dark" }) {
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    // One decorative reveal, never an endless image-generation indicator.
    const timer = setTimeout(() => setFinished(true), 4000);
    return () => clearTimeout(timer);
  }, []);
  if (finished) return null;
  return (
    <ImageGeneration
      className="welcome-reveal"
      preset="pixels-organic"
      theme={theme}
      images={["/images/errby-mascot.png"]}
      autoReveal
      revealDelayRange={[0.1, 0.1]}
      cardBg={theme === "dark" ? "#121722" : "#F7F9FC"}
      colors={["#4F46E5", "#A5B4FC", "#EEF2FF"]}
      onCycle={({ phase }) => {
        if (phase === "visible") setFinished(true);
      }}
    >
      <div style={{ width: 112, height: 112 }} />
    </ImageGeneration>
  );
}
