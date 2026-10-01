"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ConversationEnd, CopyMessage } from "../../chat-controls";
import { ContentLabel, MessageText } from "../../chat-content";
import { SourcePanel } from "../../source-panel";
import {
  visualSchema as linearVisualSchema,
  type LinearVisual,
} from "@/lib/visuals/schema";
import { ChartLineIcon as ChartLine } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { useActivity } from "@/lib/results/use-activity";
import { Bot, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ComposerBeam,
  ErrbyAvatar,
  MotionToggle,
  ReplyGlow,
  Thinking,
} from "@/components/ui/learning-effects";
import { readReply } from "@/lib/http/event-stream";
import {
  TURN_CHARACTER_LIMIT,
  type SessionMessageRole,
  type SessionState,
  type SessionStatus,
} from "@/lib/sessions/contracts";
import "./session-view.css";

const ChatVisual = dynamic(
  () => import("../../chat-visual").then((module) => module.ChatVisual),
  { ssr: false, loading: () => <p>Loading interactive graph…</p> },
);

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

export function SessionView({
  id,
  quiet = false,
}: {
  id: string;
  quiet?: boolean;
}) {
  const [state, setState] = useState<SessionState | null>(null);
  const [opening, setOpening] = useState<
    { role: "student" | "errby"; text: string; visual?: LinearVisual }[]
  >([]);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [stage, setStage] = useState("");
  const [text, setText] = useState("");
  const [visualRequest, setVisualRequest] = useState(false);
  const [visualDrafts, setVisualDrafts] = useState<
    Record<string, LinearVisual>
  >({});
  const [activeVisualId, setActiveVisualId] = useState<string | null>(null);
  const [pending, setPending] = useState<
    "answer" | "pause" | "process" | "help" | "visual" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [simpler, setSimpler] = useState<{
    sequence: number;
    question: string;
  } | null>(null);
  const processing = useRef<AbortController | null>(null);
  useEffect(() => () => processing.current?.abort(), []);
  useActivity(
    id,
    state?.session.status === "awaiting_student" &&
      pending === null &&
      !loading,
  );
  const [reloadKey, setReloadKey] = useState(0);
  const turn = useRef<{
    text: string;
    sequence: number;
    key: string;
    visual_request?: boolean;
    current_visual?: LinearVisual;
  } | null>(null);
  const answerInput = useRef<HTMLTextAreaElement>(null);
  const statusRegion = useRef<HTMLParagraphElement>(null);
  const draftKey = `errby:session:${id}:draft`;
  const draftLoaded = useRef(false);
  const draftText = useRef("");

  function saveDraft(value: string, graphMode = visualRequest) {
    draftText.current = value;
    setText(value);
    try {
      if (value || turn.current)
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({
            text: value,
            pendingTurn: turn.current,
            visual_request: graphMode,
          }),
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
          const intro = JSON.parse(
            sessionStorage.getItem(`errby:session:${id}:opening`) ?? "[]",
          );
          if (
            Array.isArray(intro) &&
            intro.length <= 41 &&
            intro.every(
              (m) =>
                ["student", "errby"].includes(m.role) &&
                typeof m.text === "string" &&
                m.text.length <= 8000,
            )
          )
            setOpening(
              intro.map((message) => {
                const visual = linearVisualSchema.safeParse(message.visual);
                return {
                  role: message.role,
                  text: message.text,
                  ...(visual.success ? { visual: visual.data } : {}),
                };
              }),
            );
        } catch {
          /* An unavailable local opening does not affect the saved session. */
        }
        try {
          const saved = JSON.parse(sessionStorage.getItem(draftKey) ?? "null");
          if (typeof saved?.text === "string") {
            draftText.current = saved.text;
            setText(saved.text);
            setVisualRequest(
              saved.visual_request === true ||
                saved.pendingTurn?.visual_request === true,
            );
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
        const pendingVisual = linearVisualSchema.safeParse(
          turn.current?.current_visual,
        );
        setVisualDrafts(
          pendingVisual.success &&
            turn.current?.sequence === payload.session.last_sequence
            ? { [pendingVisual.data.id]: pendingVisual.data }
            : {},
        );
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
    setStage("Saving your explanation…");
    setNotice("");
    const sequence = state.session.last_sequence;
    const visualMessage = [...state.messages]
      .reverse()
      .find(
        (message) =>
          message.visual &&
          (!activeVisualId || message.visual.id === activeVisualId),
      );
    const draftVisual =
      visualMessage?.visual && visualDrafts[visualMessage.visual.id];
    const currentVisual =
      draftVisual ?? (visualRequest ? visualMessage?.visual : undefined);
    if (
      turn.current?.text !== trimmed ||
      turn.current.sequence !== sequence ||
      turn.current.visual_request !== visualRequest ||
      JSON.stringify(turn.current.current_visual) !==
        JSON.stringify(currentVisual)
    )
      turn.current = {
        text: trimmed,
        sequence,
        key: crypto.randomUUID(),
        visual_request: visualRequest,
        current_visual: currentVisual,
      };
    saveDraft(text);
    const controller = new AbortController();
    processing.current = controller;
    try {
      const response = await fetch(
        `/api/sessions/${encodeURIComponent(id)}/turns`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            text: trimmed,
            expected_sequence: sequence,
            idempotency_key: turn.current.key,
            visual_request: turn.current.visual_request,
            current_visual: turn.current.current_visual,
          }),
          signal: controller.signal,
        },
      );
      const payload = await readReply(response, (event) => {
        if (event.type === "status") setStage(event.message);
      });
      controller.signal.throwIfAborted();
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
      saveDraft("", false);
      setVisualRequest(false);
      setVisualDrafts({});
      setNotice(payload.processing_error?.message ?? "Answer saved.");
      requestAnimationFrame(() =>
        statusRegion.current?.focus({ preventScroll: true }),
      );
    } catch (error) {
      setNotice(
        controller.signal.aborted
          ? "Processing stop requested. Your draft is kept. Refresh the saved session to check whether your answer or a finished reply was saved; provider charges may still apply."
          : error instanceof Error && error.message !== "Failed to fetch"
            ? error.message
            : "We could not confirm your answer was saved. Check your connection, then retry or refresh the saved session. Your text is unchanged.",
      );
    } finally {
      processing.current = null;
      setPending(null);
    }
  }

  async function saveVisual(messageId: string, visual: LinearVisual) {
    if (pending || loading) return;
    setPending("visual");
    setNotice("");
    try {
      const response = await fetch(
        `/api/sessions/${encodeURIComponent(id)}/visual`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message_id: messageId, visual }),
        },
      );
      const payload = await response.json();
      const accepted = linearVisualSchema.safeParse(payload.visual);
      if (!response.ok || !accepted.success)
        throw new Error(
          payload.user_message ??
            "Graph settings could not be saved. Your changes remain here.",
        );
      setState(
        (previous) =>
          previous && {
            ...previous,
            messages: previous.messages.map((message) =>
              message.id === messageId
                ? { ...message, visual: accepted.data }
                : message,
            ),
          },
      );
      setVisualDrafts((previous) => {
        const next = { ...previous };
        delete next[visual.id];
        return next;
      });
      setNotice("Graph settings saved. Learning progress is unchanged.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Graph settings could not be saved. Your changes remain here.",
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
    setStage("Checking your saved explanation…");
    setNotice("");
    const controller = new AbortController();
    processing.current = controller;
    try {
      const response = await fetch(
        `/api/sessions/${encodeURIComponent(id)}/process`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Accept: "text/event-stream",
          },
          body: "{}",
          signal: controller.signal,
        },
      );
      const payload = await readReply(response, (event) => {
        if (event.type === "status") setStage(event.message);
      });
      controller.signal.throwIfAborted();
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
    } catch (error) {
      setNotice(
        controller.signal.aborted
          ? "Processing stop requested. Your saved answer remains. Refresh to check the latest state; provider charges may still apply."
          : error instanceof Error && error.message !== "Failed to fetch"
            ? error.message
            : "Your answer is saved. Check your connection, then retry the AI response.",
      );
    } finally {
      processing.current = null;
      setPending(null);
    }
  }

  async function simplifyQuestion() {
    if (
      !state ||
      pending ||
      loading ||
      state.session.status !== "awaiting_student"
    )
      return;
    setPending("help");
    setNotice("");
    const controller = new AbortController();
    processing.current = controller;
    try {
      const response = await fetch(`/api/sessions/${id}/help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expected_sequence: state.session.last_sequence,
        }),
        signal: controller.signal,
      });
      const payload = await response.json();
      controller.signal.throwIfAborted();
      if (!response.ok)
        throw new Error(
          payload.user_message ?? "Simpler wording is unavailable.",
        );
      setSimpler(payload);
      setNotice("Question reworded. Your draft and progress are unchanged.");
    } catch (error) {
      setNotice(
        controller.signal.aborted
          ? "Rewording stopped. Your draft and progress are unchanged; provider charges may still apply."
          : error instanceof Error
            ? error.message
            : "Simpler wording is unavailable.",
      );
    } finally {
      processing.current = null;
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
      <div className="session-loading" role="status">
        <p>
          <Thinking state="connecting" />
          Loading saved conversation…
        </p>
        <div className="loading-line" />
        <div className="loading-line" />
        <div className="loading-line" />
      </div>
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
    <section
      aria-labelledby="session-title"
      className={`session-shell mt-8 ${quiet ? "session-quiet" : ""}`}
    >
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
          {!quiet && <MotionToggle />}
          <SourcePanel sessionId={id} />
          <Button asChild variant="outline" className="min-h-11">
            <Link href={`/learn/sessions/${id}/results`}>
              View learning evidence
            </Link>
          </Button>
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
          {(pending || loading) && (
            <Thinking
              state={
                pending === "answer" || pending === "process"
                  ? "solving"
                  : "connecting"
              }
            />
          )}
          {pending === "answer"
            ? stage
            : pending === "pause"
              ? "Saving session state..."
              : pending === "process"
                ? stage
                : pending === "help"
                  ? "Rewording the question…"
                  : pending === "visual"
                    ? "Saving graph settings…"
                    : statusLabel}
        </strong>
        <span>{statusDescription}</span>
        {(notice || state.processing_error?.message) && (
          <span>{notice || state.processing_error?.message}</span>
        )}
      </p>
      {(pending === "answer" ||
        pending === "process" ||
        pending === "help") && (
        <Button
          type="button"
          variant="outline"
          onClick={() => processing.current?.abort()}
        >
          Stop processing
        </Button>
      )}
      {quiet && state.session.status === "needs_review" && (
        <p className="session-note">
          This conversation stays unresolved. You can{" "}
          <Link href="/learn" className="underline">
            return to chat with clearer reference notes
          </Link>{" "}
          and try a fresh explanation.
        </p>
      )}
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
        {!quiet && state.session.objective_labels.length > 0 && (
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
          {quiet && opening.length > 0 && (
            <div className="mb-6">
              <p className="session-note">
                Opening conversation · kept in this browser tab
              </p>
              <ol
                className="session-messages list-none p-0"
                aria-label="Opening conversation"
              >
                {opening.map((message, index) => (
                  <li
                    key={index}
                    className={`session-message session-${message.role}`}
                  >
                    <strong>
                      {message.role === "student" ? "You" : "Errby"}
                    </strong>
                    <MessageText text={message.text} />
                    {message.visual && (
                      <ChatVisual
                        visual={message.visual}
                        disabled={pending !== null}
                        onChange={(visual) => {
                          setOpening((previous) => {
                            const next = previous.map((item, i) =>
                              i === index ? { ...item, visual } : item,
                            );
                            try {
                              sessionStorage.setItem(
                                `errby:session:${id}:opening`,
                                JSON.stringify(next),
                              );
                            } catch {
                              /* Optional tab storage. */
                            }
                            return next;
                          });
                        }}
                      />
                    )}
                    <CopyMessage
                      text={message.text}
                      speaker={message.role === "student" ? "your" : "Errby"}
                    />
                  </li>
                ))}
              </ol>
            </div>
          )}
          <h2 className="sr-only" id="conversation-title">
            Conversation
          </h2>
          <ol
            aria-labelledby="conversation-title"
            className="session-messages list-none p-0"
          >
            {state.messages.map((message) => {
              const displayRole =
                quiet && message.role === "supervisor" ? "errby" : message.role;
              const { label, detail, Icon } = speakers[displayRole];
              const parsedVisual = linearVisualSchema.safeParse(message.visual);
              const visual = parsedVisual.success
                ? (visualDrafts[parsedVisual.data.id] ?? parsedVisual.data)
                : undefined;
              return (
                <li
                  key={message.id}
                  className={`session-message session-${displayRole}`}
                >
                  <div className="session-role">
                    {displayRole === "errby" ? (
                      <ErrbyAvatar />
                    ) : (
                      <Icon size={20} aria-hidden="true" />
                    )}
                    <span>{label}</span>
                    <span className="session-role-detail">{detail}</span>
                  </div>
                  {message.role === "supervisor" ? (
                    <div className="chat-content-card" data-kind="guidance">
                      <ContentLabel kind="guidance">
                        Learning guidance
                      </ContentLabel>
                      <MessageText text={message.text} />
                    </div>
                  ) : (
                    <MessageText text={message.text} />
                  )}
                  {visual && (
                    <>
                      <ChatVisual
                        visual={visual}
                        disabled={pending !== null || loading}
                        onChange={(next) => {
                          setActiveVisualId(next.id);
                          setVisualDrafts((previous) => ({
                            ...previous,
                            [next.id]: next,
                          }));
                        }}
                      />
                      {visualDrafts[visual.id] && (
                        <div className="chat-visual-save">
                          <span>
                            Graph changes stay here until you save or send them.
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={pending !== null || loading}
                            onClick={() => void saveVisual(message.id, visual)}
                          >
                            Save graph settings
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                  <CopyMessage
                    text={message.text}
                    speaker={label === "You" ? "your" : label}
                  />
                </li>
              );
            })}
          </ol>
          {state.messages.length === 0 && (
            <p className="session-note">
              There are no saved messages in this session yet.
            </p>
          )}
          {pending === "answer" && (
            <div
              className="session-message session-student mt-4"
              aria-label="Sending explanation"
            >
              <strong>You · Sending</strong>
              <p>{text}</p>
            </div>
          )}
          {(pending === "answer" || pending === "process") && (
            <ReplyGlow>
              <p className="session-pending">{stage}</p>
            </ReplyGlow>
          )}
          <ConversationEnd
            revision={`${state.session.last_sequence}:${pending}`}
          />
          {simpler?.sequence === state.session.last_sequence && (
            <aside
              className="chat-content-card"
              data-kind="tool"
              aria-label="Question in simpler words"
            >
              <ContentLabel kind="tool">
                Question in simpler words · not an assessment
              </ContentLabel>
              <MessageText text={simpler.question} />
            </aside>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={blocked}
            onClick={() => void simplifyQuestion()}
          >
            Ask in simpler words
          </Button>
          <ComposerBeam active={pending === "answer" || pending === "process"}>
            <form
              className="session-composer mt-6"
              aria-busy={pending !== null}
              onSubmit={(event) => {
                event.preventDefault();
                void submitAnswer();
              }}
            >
              <label htmlFor="answer">
                {visualRequest ? "Describe your graph" : "Your explanation"}
              </label>
              <textarea
                id="answer"
                name="explanation"
                autoComplete="off"
                placeholder={
                  visualRequest
                    ? "Try: show y = 2x + 1, or compare a negative slope…"
                    : "Explain it in your own words…"
                }
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
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void submitAnswer();
                  }
                }}
              />
              <div className="session-composer-footer">
                <span id="answer-note">
                  {text.length}/{TURN_CHARACTER_LIMIT} characters · drafts stay
                  in this browser tab until it closes · Shift + Enter for a new
                  line
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  aria-pressed={visualRequest}
                  disabled={blocked}
                  onClick={() => {
                    setVisualRequest(!visualRequest);
                    saveDraft(text, !visualRequest);
                    answerInput.current?.focus();
                  }}
                >
                  <ChartLine size={18} weight="duotone" aria-hidden="true" />{" "}
                  Explore a graph
                </Button>
                <Button type="submit" disabled={blocked}>
                  {pending === "answer"
                    ? "Working…"
                    : visualRequest
                      ? "Send graph request"
                      : "Send answer"}
                </Button>
              </div>
            </form>
          </ComposerBeam>
          {visualRequest && (
            <p className="session-note">
              Explore a straight-line relationship. This request is assistance,
              not an assessed answer.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
