"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { CopyIcon } from "@phosphor-icons/react/dist/ssr/Copy";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { Button } from "@/components/ui/button";
import "./chat-content.css";

export function CopyMessage({
  text,
  speaker,
}: {
  text: string;
  speaker: string;
}) {
  const [notice, setNotice] = useState("");
  const [copying, setCopying] = useState(false);
  const inFlight = useRef(false);
  const Icon =
    notice === "Copied" ? CheckIcon : notice ? WarningCircleIcon : CopyIcon;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Button
        type="button"
        variant="ghost"
        className="chat-copy-button min-h-11"
        aria-label={`Copy ${speaker} message`}
        aria-busy={copying}
        aria-disabled={copying}
        data-state={notice === "Copied" ? "copied" : notice ? "error" : "idle"}
        onClick={async () => {
          if (inFlight.current) return;
          inFlight.current = true;
          setCopying(true);
          setNotice("");
          try {
            await navigator.clipboard.writeText(text);
            setNotice("Copied");
          } catch {
            setNotice("Could not copy. Select the message text to copy it.");
          } finally {
            inFlight.current = false;
            setCopying(false);
          }
        }}
      >
        <Icon size={16} weight="duotone" aria-hidden="true" />
        <span aria-hidden="true">
          {copying
            ? "Copying…"
            : notice === "Copied"
              ? "Copied"
              : notice
                ? "Try again"
                : "Copy"}
        </span>
      </Button>
      <span
        aria-live="polite"
        className={notice === "Copied" ? "sr-only" : undefined}
      >
        {notice === "Copied" ? "Message copied to clipboard." : notice}
      </span>
    </div>
  );
}

export function ConversationEnd({ revision }: { revision: string | number }) {
  const bottom = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const [showLatest, setShowLatest] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      follow.current =
        !bottom.current ||
        bottom.current.getBoundingClientRect().bottom <=
          window.innerHeight + 80;
      setShowLatest(!follow.current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (follow.current)
      bottom.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [revision]);

  return (
    <>
      <div ref={bottom} />
      {showLatest && (
        <Button
          type="button"
          variant="outline"
          className="fixed bottom-6 right-6 z-20 min-h-11 rounded-full shadow-md"
          onClick={() => {
            follow.current = true;
            setShowLatest(false);
            bottom.current?.scrollIntoView({
              block: "end",
              behavior: "instant",
            });
          }}
        >
          <ArrowDown size={16} aria-hidden="true" /> Latest message
        </Button>
      )}
    </>
  );
}
