"use client";

import {
  lazy,
  Suspense,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { ThinkingOrb, type OrbState } from "thinking-orbs";
import { BorderBeam } from "border-beam";
import { BotAvatar } from "bot-avatars";
import { Liquid } from "liquid-gooey";
import { VoiceBeam } from "voice-glow";
import { MetalFx } from "metal-fx";
import { useAppTheme } from "@/components/landing/landing-controls";
import { Button } from "./button";
import "./learning-effects.css";

const WelcomeReveal = lazy(() =>
  import("./welcome-reveal").catch(() => ({ default: () => <></> })),
);
const motionQuery = "(prefers-reduced-motion: reduce)";
let manualPause = false;

function motionSnapshot() {
  return (
    (manualPause ? 1 : 0) |
    (window.matchMedia(motionQuery).matches ? 2 : 0) |
    (document.hidden ? 4 : 0)
  );
}
function subscribeMotion(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  const sync = () => {
    try {
      manualPause = localStorage.getItem("errby-pause-motion") === "true";
    } catch {
      /* Optional preference storage. */
    }
    onChange();
  };
  sync();
  media.addEventListener("change", onChange);
  document.addEventListener("visibilitychange", onChange);
  window.addEventListener("errby-motion", onChange);
  window.addEventListener("storage", sync);
  return () => {
    media.removeEventListener("change", onChange);
    document.removeEventListener("visibilitychange", onChange);
    window.removeEventListener("errby-motion", onChange);
    window.removeEventListener("storage", sync);
  };
}
function useMotion() {
  return useSyncExternalStore(subscribeMotion, motionSnapshot, () => 7);
}

export function MotionToggle() {
  const motion = useMotion();
  const reduced = Boolean(motion & 2);
  const paused = Boolean(motion & 1);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="motion-toggle"
      disabled={reduced}
      aria-label={
        reduced
          ? "Reduced motion enabled"
          : paused
            ? "Resume animations"
            : "Pause animations"
      }
      title={
        reduced
          ? "Your system prefers reduced motion"
          : paused
            ? "Resume animations"
            : "Pause animations"
      }
      onClick={() => {
        manualPause = !paused;
        try {
          localStorage.setItem("errby-pause-motion", String(manualPause));
        } catch {
          /* Preference still works in this tab. */
        }
        window.dispatchEvent(new Event("errby-motion"));
      }}
    >
      {paused || reduced ? (
        <Play aria-hidden="true" />
      ) : (
        <Pause aria-hidden="true" />
      )}
    </Button>
  );
}

export function Thinking({ state = "working" }: { state?: OrbState }) {
  const paused = Boolean(useMotion());
  const theme = useAppTheme();
  return (
    <span
      className="learning-orb"
      aria-hidden="true"
      data-state={state}
      data-paused={paused}
    >
      <ThinkingOrb
        state={state}
        size={20}
        theme={theme}
        color={theme === "dark" ? "#A5B4FC" : "#4F46E5"}
        paused={paused}
      />
    </span>
  );
}

export function ErrbyAvatar() {
  const theme = useAppTheme();
  return (
    <span className="errby-avatar" aria-hidden="true">
      <BotAvatar
        type="droid"
        size={24}
        theme={theme}
        color={theme === "dark" ? "#A5B4FC" : "#4F46E5"}
        shading="crisp"
        paused
        interactive={false}
      />
    </span>
  );
}

export function ComposerBeam({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const paused = Boolean(useMotion());
  const theme = useAppTheme();
  return (
    <BorderBeam
      className="composer-beam"
      size="pulse-inner"
      colorVariant="ocean"
      staticColors
      theme={theme}
      strength={0.45}
      active={active && !paused}
      borderRadius={20}
    >
      {children}
    </BorderBeam>
  );
}

export function ReplyGlow({ children }: { children: ReactNode }) {
  const paused = Boolean(useMotion());
  const theme = useAppTheme();
  return (
    <VoiceBeam
      className="reply-glow"
      theme={theme}
      colorVariant="ocean"
      staticColors
      processing
      active={!paused}
      paused={paused}
      distortion={0}
      bands={false}
      strength={0.35}
      scale={0.45}
    >
      {children}
    </VoiceBeam>
  );
}

export function SourceActions({ children }: { children: ReactNode }) {
  const paused = Boolean(useMotion());
  return (
    <Liquid
      className="chat-source-actions"
      fill="var(--errby-surface)"
      blur={paused ? 0 : 4}
    >
      {children}
    </Liquid>
  );
}
export function SourceAction({ children }: { children: ReactNode }) {
  const paused = Boolean(useMotion());
  return (
    <Liquid.Item
      morph={{ shape: !paused, contentBlur: 0 }}
      transition={{ duration: paused ? 0 : 180 }}
    >
      {children}
    </Liquid.Item>
  );
}

export function SendAccent({ children }: { children: ReactNode }) {
  const paused = Boolean(useMotion());
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <span
      className="send-accent"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPointerEnter={() => setFocused(true)}
      onPointerLeave={() => setFocused(false)}
    >
      {children}
      {!paused && focused && (
        <MetalFx
          className="send-shine"
          aria-hidden="true"
          preset="silver"
          theme={theme}
          strength={0.5}
          normalizeHostStyles={false}
          disableGlow
        >
          <span className="send-shine-surface" />
        </MetalFx>
      )}
    </span>
  );
}

export function WelcomeArt() {
  const paused = Boolean(useMotion());
  const theme = useAppTheme();
  const [reveal, setReveal] = useState(0);
  return (
    <button
      type="button"
      className="welcome-art"
      aria-label="Animate Errby"
      title="Animate Errby"
      disabled={paused}
      onClick={() => setReveal((value) => value + 1)}
    >
      <Image
        src="/images/errby-mascot.png"
        alt=""
        width={112}
        height={112}
        priority
      />
      {reveal > 0 && !paused && (
        <Suspense fallback={null}>
          <WelcomeReveal key={reveal} theme={theme} />
        </Suspense>
      )}
    </button>
  );
}
