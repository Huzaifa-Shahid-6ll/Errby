"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  TURN_CHARACTER_LIMIT,
  type SessionMessage,
  type SessionState,
} from "@/lib/sessions/contracts";
import "./session-view.css";

const statusText = (status: SessionState["session"]["status"]) => {
  if (status === "awaiting_student")
    return "Errby is waiting for your explanation.";
  if (status === "evaluating")
    return "Your answer is saved. Evaluation is not implemented in this build, so it is not graded yet.";
  return "This session is not accepting a new answer right now.";
};

const roleLabel = (role: SessionMessage["role"]) =>
  role === "student" ? "You" : role === "errby" ? "Errby" : "Supervisor";

export function SessionView({ id }: { id: string }) {
  const [state, setState] = useState<SessionState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const turnKey = useRef<string | null>(null);
  const answerInput = useRef<HTMLTextAreaElement>(null);
  const statusRegion = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoadError("");
      try {
        const response = await fetch(
          `/api/sessions/${encodeURIComponent(id)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.session) {
          setLoadError(
            payload?.user_message ??
              "This session could not be loaded. Try again.",
          );
          return;
        }
        setState(payload as SessionState);
      } catch {
        if (!controller.signal.aborted)
          setLoadError(
            "This session could not be loaded. Check your connection and try again.",
          );
      }
    }
    void load();
    return () => controller.abort();
  }, [id, reloadKey]);

  async function submitAnswer() {
    if (!state || pending) return;
    const trimmed = text.trim();
    if (!trimmed) {
      setNotice("Write your explanation first.");
      answerInput.current?.focus();
      return;
    }
    setPending(true);
    setNotice("");
    turnKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch(
        `/api/sessions/${encodeURIComponent(id)}/turns`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            expected_sequence: state.session.last_sequence,
            idempotency_key: turnKey.current,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.message) {
        setNotice(
          payload?.user_message ??
            "Your answer was not saved. Try again; your text is unchanged.",
        );
        return;
      }
      turnKey.current = null;
      setState({
        session: payload.session,
        messages: [...state.messages, payload.message],
      });
      setText("");
      setNotice("Answer saved.");
      requestAnimationFrame(() => statusRegion.current?.focus());
    } catch {
      setNotice(
        "Your answer was not saved. Check your connection and try again; your text is unchanged.",
      );
    } finally {
      setPending(false);
    }
  }

  if (loadError)
    return (
      <section aria-labelledby="session-error" className="mt-8">
        <h1 id="session-error" className="text-2xl font-semibold">
          Session unavailable
        </h1>
        <p role="alert" className="mt-3 text-muted-foreground">
          {loadError}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => setReloadKey((key) => key + 1)}
        >
          Retry loading
        </Button>
      </section>
    );

  if (!state)
    return (
      <p role="status" className="mt-8 text-muted-foreground">
        Loading saved session…
      </p>
    );

  return (
    state && (
      <section aria-labelledby="session-title" className="session-shell mt-8">
        <p className="eyebrow">Teaching session</p>
        <h1 id="session-title" className="text-2xl font-semibold">
          {state.session.lesson_title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {statusText(state.session.status)}
        </p>

        {state.session.objective_labels.length > 0 && (
          <aside className="mt-4" aria-label="What you will explain">
            <h2 className="text-sm font-semibold">What you&apos;ll explain</h2>
            <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
              {state.session.objective_labels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </aside>
        )}

        <ol className="session-messages mt-6 list-none p-0">
          {state.messages.map((message) => (
            <li
              key={message.id}
              className={`session-message session-${message.role}`}
            >
              <span className="session-role">{roleLabel(message.role)}</span>
              <p>{message.text}</p>
            </li>
          ))}
        </ol>

        <form
          className="session-composer mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            void submitAnswer();
          }}
        >
          <label htmlFor="answer">Your explanation</label>
          <textarea
            id="answer"
            ref={answerInput}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setNotice("");
            }}
            rows={4}
            maxLength={TURN_CHARACTER_LIMIT}
            disabled={state.session.status !== "awaiting_student" || pending}
            aria-describedby="answer-note session-status"
          />
          <div className="session-composer-footer">
            <span id="answer-note">
              {text.length}/{TURN_CHARACTER_LIMIT} characters · answers are
              saved once per submission
            </span>
            <Button
              type="submit"
              disabled={state.session.status !== "awaiting_student" || pending}
            >
              {pending ? "Saving…" : "Send answer"}
            </Button>
          </div>
        </form>
        <p
          id="session-status"
          ref={statusRegion}
          role="status"
          tabIndex={-1}
          className="session-note"
        >
          {notice ||
            "Answers are saved but not graded in this build. Evaluation arrives with later work."}
        </p>
      </section>
    )
  );
}
