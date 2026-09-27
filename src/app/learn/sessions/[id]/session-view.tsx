"use client";

import { useEffect, useRef, useState } from "react";
import { useActivity } from "@/lib/results/use-activity";
import { Bot, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TURN_CHARACTER_LIMIT,
  type SessionMessageRole,
  type SessionState,
  type SessionStatus,
} from "@/lib/sessions/contracts";
import "./session-view.css";

const statuses = {
  ready: [
    "Ready",
    "Your session is ready. Refresh the saved session to check for its opening question.",
  ],
  awaiting_student: ["Your turn", "Errby is waiting for your explanation."],
  evaluating: [
    "Answer saved · not graded",
    "Your answer is saved but not graded yet. Retry the AI response if it has not arrived.",
  ],
  supervisor_pending: [
    "Supervisor guidance pending",
    "Guidance is not ready yet. Your explanation is not marked correct while you wait.",
  ],
  errby_ready: [
    "Errby reply pending",
    "Your next question is not ready to answer yet. Refresh the saved session to check for an update.",
  ],
  needs_review: [
    "Needs review · unresolved",
    "This session needs review. Uncertain answers remain unresolved and do not count as completed learning.",
  ],
  paused: [
    "Paused",
    "This session is paused. Your saved conversation is below. Resume when you are ready.",
  ],
  ended_incomplete: [
    "Ended · incomplete",
    "This session ended before all learning goals were demonstrated.",
  ],
  completed: ["Completed", "This saved session is marked complete."],
} satisfies Record<SessionStatus, readonly [string, string]>;

const speakers = {
  student: { label: "You", detail: "Your explanation", Icon: UserRound },
  errby: { label: "Errby", detail: "AI learning partner", Icon: Bot },
  supervisor: {
    label: "Supervisor",
    detail: "Learning guidance",
    Icon: ShieldCheck,
  },
} satisfies Record<
  SessionMessageRole,
  { label: string; detail: string; Icon: typeof Bot }
>;

export function SessionView({ id }: { id: string }) {
  const [state, setState] = useState<SessionState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState<"answer" | "pause" | "process" | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  useActivity(
    id,
    state?.session.status === "awaiting_student" &&
      pending === null &&
      !loading,
  );
  const [reloadKey, setReloadKey] = useState(0);
  const turn = useRef<{ text: string; sequence: number; key: string } | null>(
    null,
  );
  const answerInput = useRef<HTMLTextAreaElement>(null);
  const statusRegion = useRef<HTMLParagraphElement>(null);
  const draftKey = `errby:session:${id}:draft`;
  const draftLoaded = useRef(false);
  const draftText = useRef("");

  function saveDraft(value: string) {
    draftText.current = value;
    setText(value);
    try {
      if (value || turn.current)
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({ text: value, pendingTurn: turn.current }),
        );
      else sessionStorage.removeItem(draftKey);
    } catch {
      // Storage may be disabled; the current tab still retains the draft in memory.
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    function restoreDraft() {
      if (!draftLoaded.current) {
        draftLoaded.current = true;
        try {
          const saved = JSON.parse(sessionStorage.getItem(draftKey) ?? "null");
          if (typeof saved?.text === "string") {
            draftText.current = saved.text;
            setText(saved.text);
            const attempt = saved.pendingTurn ?? saved;
            if (
              typeof attempt.text === "string" &&
              Number.isInteger(attempt.sequence) &&
              typeof attempt.key === "string"
            )
              turn.current = attempt;
          }
        } catch {
          // An invalid local draft must not prevent loading the saved conversation.
        }
      }
    }
    async function load() {
      setLoadError("");
      setLoading(true);
      try {
        const response = await fetch(
          `/api/sessions/${encodeURIComponent(id)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const payload = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        restoreDraft();
        if (
          !response.ok ||
          !payload?.session ||
          !Array.isArray(payload.messages)
        ) {
          setLoadError(
            payload?.user_message ??
              "This session could not be loaded. Try again.",
          );
          return;
        }
        setState(payload as SessionState);
        if (
          turn.current &&
          payload.messages.some(
            (message: { role: string; sequence: number; text: string }) =>
              message.role === "student" &&
              message.sequence === turn.current!.sequence + 1 &&
              message.text === turn.current!.text,
          )
        ) {
          const matchesDraft = draftText.current.trim() === turn.current.text;
          turn.current = null;
          if (matchesDraft) {
            draftText.current = "";
            setText("");
          }
          try {
            if (draftText.current)
              sessionStorage.setItem(
                draftKey,
                JSON.stringify({ text: draftText.current }),
              );
            else sessionStorage.removeItem(draftKey);
          } catch {
            /* optional recovery */
          }
          setNotice(
            "Your previous answer was saved. Any edited draft stays unsent.",
          );
        }
        if (reloadKey > 0)
          setNotice("Saved session refreshed. Any draft below stays unsent.");
      } catch {
        if (!controller.signal.aborted) restoreDraft();
        if (!controller.signal.aborted)
          setLoadError(
            "This session could not be loaded. Check your connection and try again.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, reloadKey, draftKey]);

  async function submitAnswer() {
    if (
      !state ||
      pending ||
      loading ||
      state.session.status !== "awaiting_student"
    )
      return;
    const trimmed = text.trim();
    if (!trimmed) {
      setNotice("Write your explanation first.");
      answerInput.current?.focus();
      return;
    }
    setPending("answer");
    setNotice("");
    const sequence = state.session.last_sequence;
    if (turn.current?.text !== trimmed || turn.current.sequence !== sequence)
      turn.current = { text: trimmed, sequence, key: crypto.randomUUID() };
    saveDraft(text);
    try {
      const response = await fetch(
        `/api/sessions/${encodeURIComponent(id)}/turns`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            expected_sequence: sequence,
            idempotency_key: turn.current.key,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.message || !payload?.session) {
        setNotice(
          payload?.user_message ??
            "We could not confirm your answer was saved. Your text is unchanged. Retry or refresh the saved session.",
        );
        return;
      }
      turn.current = null;
      setState({
        session: payload.session,
        messages: payload.messages ?? [...state.messages, payload.message],
        processing_error: payload.processing_error,
      });
      saveDraft("");
      setNotice(payload.processing_error?.message ?? "Answer saved.");
      requestAnimationFrame(() => statusRegion.current?.focus());
    } catch {
      setNotice(
        "We could not confirm your answer was saved. Check your connection, then retry or refresh the saved session. Your text is unchanged.",
      );
    } finally {
      setPending(null);
    }
  }

  async function togglePause() {
    if (!state || pending) return;
    setPending("pause");
    setNotice("");
    try {
      const response = await fetch(
        `/api/sessions/${encodeURIComponent(id)}/pause`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pause: state.session.status !== "paused" }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.session) {
        setNotice(
          payload?.user_message ??
            "Could not confirm the session state. Refresh and try again.",
        );
        return;
      }
      setState(payload as SessionState);
      setNotice(
        payload.session.status === "paused"
          ? "Session paused and saved."
          : "Session resumed.",
      );
    } catch {
      setNotice("Could not confirm the session state. Refresh and try again.");
    } finally {
      setPending(null);
    }
  }

  async function retryProcessing() {
    if (!state || pending || loading) return;
    setPending("process");
    setNotice("");
    try {
      const response = await fetch(
        `/api/sessions/${encodeURIComponent(id)}/process`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        },
      );
      const payload = await response.json().catch(() => null);
      if (
        !response.ok ||
        !payload?.session ||
        !Array.isArray(payload.messages)
      ) {
        setNotice(
          payload?.user_message ??
            "Your answer is saved. The AI response could not be confirmed; retry or refresh.",
        );
        return;
      }
      setState(payload as SessionState);
      setNotice(
        payload.processing_error?.message ?? "Saved conversation updated.",
      );
    } catch {
      setNotice(
        "Your answer is saved. Check your connection, then retry the AI response.",
      );
    } finally {
      setPending(null);
    }
  }

  if (loadError)
    return (
      <section aria-labelledby="session-error" className="session-shell mt-8">
        <h1 id="session-error" className="text-2xl font-semibold">
          Session unavailable
        </h1>
        <p role="alert" className="mt-3 text-muted-foreground">
          {loadError}
        </p>
        {text && (
          <p className="session-note">
            Your unsent draft is held in this tab for recovery.
          </p>
        )}
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

  const [statusLabel, statusDescription] = statuses[state.session.status];
  const blocked =
    state.session.status !== "awaiting_student" || pending !== null || loading;
  const goals = (
    <ul>
      {state.session.objective_labels.map((label, index) => (
        <li key={index}>
          {label}
          {state.session.objective_progress?.[index] && (
            <span className="block text-sm">
              {
                {
                  untested: "Not yet demonstrated",
                  developing: "Developing",
                  explained: "Explained",
                  unverified: "Unresolved - needs review",
                }[state.session.objective_progress[index].status]
              }
            </span>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-labelledby="session-title" className="session-shell mt-8">
      <header className="session-heading">
        <div>
          <p className="eyebrow">
            Teaching session ·{" "}
            {state.session.visibility === "private"
              ? "Private"
              : "Class lesson"}
          </p>
          <h1 id="session-title" className="text-2xl font-semibold">
            {state.session.lesson_title}
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {state.session.status !== "completed" &&
            state.session.status !== "ended_incomplete" && (
              <Button
                type="button"
                variant="outline"
                disabled={pending !== null || loading}
                onClick={() => void togglePause()}
              >
                {state.session.status === "paused"
                  ? "Resume session"
                  : "Pause session"}
              </Button>
            )}
          <Button
            type="button"
            variant="outline"
            disabled={pending !== null || loading}
            onClick={() => setReloadKey((key) => key + 1)}
          >
            {loading ? "Refreshing…" : "Refresh saved session"}
          </Button>
        </div>
      </header>
      <p
        id="session-status"
        ref={statusRegion}
        role="status"
        aria-atomic="true"
        tabIndex={-1}
        className={`session-state session-state-${state.session.status}`}
      >
        <strong>
          {pending === "answer"
            ? "Saving answer and checking your explanation..."
            : pending === "pause"
              ? "Saving session state..."
              : pending === "process"
                ? "Checking your saved explanation..."
                : statusLabel}
        </strong>
        <span>{statusDescription}</span>
        {(notice || state.processing_error?.message) && (
          <span>{notice || state.processing_error?.message}</span>
        )}
      </p>
      {state.session.status === "evaluating" && (
        <Button
          type="button"
          variant="outline"
          disabled={pending !== null || loading}
          onClick={() => void retryProcessing()}
        >
          {pending === "process"
            ? "Checking explanation..."
            : "Retry AI response"}
        </Button>
      )}
      <div className="session-layout">
        {state.session.objective_labels.length > 0 && (
          <>
            <details className="session-goals-mobile">
              <summary>
                What you&apos;ll explain (
                {state.session.objective_labels.length})
              </summary>
              {goals}
            </details>
            <aside
              className="session-goals-desktop"
              aria-label="What you will explain"
            >
              <h2>What you&apos;ll explain</h2>
              {goals}
            </aside>
          </>
        )}
        <div className="session-conversation">
          <h2 className="sr-only" id="conversation-title">
            Conversation
          </h2>
          <ol
            aria-labelledby="conversation-title"
            className="session-messages list-none p-0"
          >
            {state.messages.map((message) => {
              const { label, detail, Icon } = speakers[message.role];
              return (
                <li
                  key={message.id}
                  className={`session-message session-${message.role}`}
                >
                  <div className="session-role">
                    <Icon size={20} aria-hidden="true" />
                    <span>{label}</span>
                    <span className="session-role-detail">{detail}</span>
                  </div>
                  <p>{message.text}</p>
                </li>
              );
            })}
          </ol>
          {state.messages.length === 0 && (
            <p className="session-note">
              There are no saved messages in this session yet.
            </p>
          )}
          <form
            className="session-composer mt-6"
            aria-busy={pending !== null}
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
                saveDraft(event.target.value);
                setNotice("");
              }}
              rows={4}
              maxLength={TURN_CHARACTER_LIMIT}
              disabled={blocked}
              aria-describedby="answer-note session-status"
            />
            <div className="session-composer-footer">
              <span id="answer-note">
                {text.length}/{TURN_CHARACTER_LIMIT} characters · drafts stay in
                this browser tab until it closes
              </span>
              <Button type="submit" disabled={blocked}>
                {pending === "answer" ? "Checking..." : "Send answer"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
