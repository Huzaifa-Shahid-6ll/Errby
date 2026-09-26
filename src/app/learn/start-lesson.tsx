"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function StartLessonButton({
  lessonVersionId,
  title,
}: {
  lessonVersionId: string;
  title: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lesson_version_id: lessonVersionId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          payload?.user_message ??
            "The session could not be opened. Try again from your lesson list.",
        );
        return;
      }
      router.push(`/learn/sessions/${payload.session.id}`);
    } catch {
      setError(
        "The session could not be opened. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        onClick={start}
        disabled={pending}
        aria-label={`Start session: ${title}`}
      >
        {pending ? "Opening…" : "Start session"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-muted-foreground">
          {error}
        </p>
      )}
    </div>
  );
}
