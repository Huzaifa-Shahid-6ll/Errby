"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, FileText, Paperclip, X, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ComposerBeam,
  ErrbyAvatar,
  ReplyGlow,
  SendAccent,
  SourceAction,
  SourceActions,
  Thinking,
  WelcomeArt,
} from "@/components/ui/learning-effects";
import { readReply } from "@/lib/http/event-stream";
import { CHAT_UPLOAD_BYTES, type Extraction } from "@/lib/ingestion/contracts";

type Message = { role: "student" | "errby"; text: string };
type Attempt = {
  key: string;
  text: string;
  notes: boolean;
  history: Message[];
};
export function NewChat({ accountId }: { accountId: string }) {
  const router = useRouter();
  return (
    <button
      className="chat-new"
      type="button"
      onClick={() => {
        try {
          sessionStorage.removeItem(`errby:entry:${accountId}`);
        } catch {
          /* Optional storage. */
        }
        router.push(`/learn?new=${crypto.randomUUID()}`);
      }}
    >
      + New chat
    </button>
  );
}
export function ChatEntry({
  accountId,
  demo,
}: {
  accountId: string;
  demo: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [notes, setNotes] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [streamed, setStreamed] = useState("");
  const [stage, setStage] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [attachment, setAttachment] = useState<{
    name: string;
    source: Extraction;
  } | null>(null);
  const [showLatest, setShowLatest] = useState(false);
  const follow = useRef(true);
  const upload = useRef<XMLHttpRequest | null>(null);
  const replyRequest = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const attempt = useRef<Attempt | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const storageKey = `errby:entry:${accountId}`;

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
        if (
          saved &&
          Array.isArray(saved.messages) &&
          saved.messages.length <= 40 &&
          saved.messages.every(
            (m: Message) =>
              ["student", "errby"].includes(m.role) &&
              typeof m.text === "string" &&
              m.text.length <= 8000,
          )
        ) {
          setMessages(saved.messages);
          if (typeof saved.text === "string" && saved.text.length <= 8000)
            setText(saved.text);
          setNotes(saved.notes === true);
          if (
            saved.attempt &&
            typeof saved.attempt.key === "string" &&
            typeof saved.attempt.text === "string" &&
            Array.isArray(saved.attempt.history)
          )
            attempt.current = saved.attempt;
        }
      } catch {
        /* Storage is optional; never block the composer. */
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [storageKey]);
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ messages, text, notes, attempt: attempt.current }),
      );
    } catch {
      /* Current tab state still works. */
    }
  }, [messages, text, notes, pending, ready, storageKey]);
  useEffect(() => {
    const onScroll = () => {
      follow.current =
        !bottom.current ||
        bottom.current.getBoundingClientRect().bottom <=
          window.innerHeight + 80;
      setShowLatest(!follow.current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      upload.current?.abort();
      replyRequest.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (follow.current)
      bottom.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [messages, pending, streamed]);

  function attach(file?: File) {
    if (!file || pending || upload.current) return;
    const kind = file.name.toLowerCase().endsWith(".pdf")
      ? "pdf"
      : file.name.toLowerCase().endsWith(".docx")
        ? "docx"
        : null;
    if (!kind || file.size > CHAT_UPLOAD_BYTES || !file.size) {
      setNotice(
        "Choose a readable PDF or DOCX up to 4 MiB. For scans or other formats, paste the text.",
      );
      return;
    }
    setNotice("");
    setAttachment(null);
    setUploadProgress(0);
    const body = new FormData();
    body.set("kind", kind);
    body.set("file", file);
    body.set("subject", "The topic in these notes");
    body.set("grade", "Plain English");
    body.set(
      "scope",
      "Explain the main idea and apply it to one simple example.",
    );
    const request = new XMLHttpRequest();
    upload.current = request;
    request.open("POST", "/api/chat/attachment");
    request.timeout = 45_000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.upload.onload = () => setUploadProgress(100);
    request.onload = () => {
      try {
        const payload = JSON.parse(request.responseText);
        if (
          request.status < 200 ||
          request.status >= 300 ||
          !payload.extraction?.text
        )
          throw new Error(
            payload.user_message ??
              "The file could not be read. Try a smaller document or paste its text.",
          );
        setAttachment({ name: file.name, source: payload.extraction });
        setNotice(
          "Text extracted. Review it below before using it as reference notes.",
        );
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "The file could not be read. Your draft is unchanged.",
        );
      }
    };
    request.onerror = request.ontimeout = () =>
      setNotice(
        "The upload could not be confirmed. Your draft is unchanged. Choose the file again or paste its text.",
      );
    request.onabort = () =>
      setNotice("Upload cancelled. Your draft is unchanged.");
    request.onloadend = () => {
      upload.current = null;
      setUploadProgress(null);
    };
    request.send(body);
  }

  async function send() {
    if (pending || uploadProgress !== null || !ready) return;
    if (!text.trim()) {
      setNotice("Write a message or add reference notes first.");
      input.current?.focus();
      return;
    }
    setPending(true);
    setNotice("");
    setStreamed("");
    setStage(notes ? "Reading your reference notes…" : "Connecting to Errby…");
    follow.current = true;
    const controller = new AbortController();
    replyRequest.current = controller;
    const normalized = text.trim();
    if (attempt.current?.text !== normalized || attempt.current.notes !== notes)
      attempt.current = {
        key: crypto.randomUUID(),
        text: normalized,
        notes,
        history: messages
          .slice(-8)
          .map((m) => ({ ...m, text: m.text.slice(0, 2000) })),
      };
    try {
      const response = await fetch("/api/chat", {
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(180_000),
        ]),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(attempt.current),
      });
      const payload = await readReply(response, (event) => {
        if (event.type === "status") setStage(event.message);
        else {
          setStreamed((value) => value + event.text);
          setStage("Errby is replying…");
        }
      });
      if (controller.signal.aborted) return;
      if (payload.session_id) {
        try {
          sessionStorage.setItem(
            `errby:session:${payload.session_id}:opening`,
            JSON.stringify([
              ...messages,
              { role: "student", text: normalized },
            ]),
          );
        } catch {
          /* The saved reference notes remain available on the server. */
        }
        setText("");
        setMessages([]);
        setNotes(false);
        attempt.current = null;
        try {
          sessionStorage.removeItem(storageKey);
        } catch {
          /* Optional local storage. */
        }
        router.push(`/learn?session=${encodeURIComponent(payload.session_id)}`);
        return;
      }
      if (typeof payload.reply !== "string") throw new Error("Missing reply");
      setMessages(
        // ponytail: retain twenty opening exchanges locally; durable cross-device chat needs a separate persistence change.
        (previous) =>
          [
            ...previous,
            { role: "student", text: normalized },
            { role: "errby", text: payload.reply },
          ].slice(-40) as Message[],
      );
      setText("");
      setNotes(false);
      attempt.current = null;
      setNotice("Reply ready. Your turn.");
    } catch (error) {
      if (controller.signal.aborted) return;
      setNotice(
        error instanceof Error && error.message !== "Failed to fetch"
          ? error.message
          : "The reply couldn't be confirmed. Your message is still here. Retry the same message to recover it.",
      );
    } finally {
      setPending(false);
      setStreamed("");
      if (!controller.signal.aborted)
        requestAnimationFrame(() =>
          input.current?.focus({ preventScroll: true }),
        );
    }
  }

  return (
    <div className="chat-entry">
      {messages.length === 0 && !pending ? (
        <section className="chat-welcome">
          <WelcomeArt />
          <p className="chat-eyebrow">Your curious AI learning partner</p>
          <h1>
            Hey, I’m Errby.
            <br />
            What can you teach me?
          </h1>
          <p>
            Pick an idea, say hello, or explain something in your own words.
            I’ll ask the questions.
          </p>
        </section>
      ) : (
        <ol
          className="chat-entry-messages"
          aria-label="Conversation"
          aria-live="polite"
          aria-busy={pending}
        >
          {messages.map((message, i) => (
            <li key={i} className={`chat-bubble chat-bubble-${message.role}`}>
              <strong>
                {message.role === "student" ? (
                  "You"
                ) : (
                  <>
                    <ErrbyAvatar />
                    Errby
                  </>
                )}
              </strong>
              <p>{message.text}</p>
            </li>
          ))}
          {pending && (
            <>
              <li className="chat-bubble chat-bubble-student">
                <strong>You</strong>
                <p>
                  {notes
                    ? "Reference notes shared. Preparing private practice…"
                    : text.trim()}
                </p>
              </li>
              <li className="chat-bubble chat-bubble-errby" aria-busy="true">
                <strong>
                  <Thinking state={streamed ? "composing" : "working"} />
                  Errby{" "}
                  <span className="chat-draft-label">
                    · {streamed ? "Replying" : "Thinking"}
                  </span>
                </strong>
                <ReplyGlow>
                  <p>{streamed || stage}</p>
                </ReplyGlow>
              </li>
            </>
          )}
        </ol>
      )}
      <div ref={bottom} />
      {showLatest && messages.length > 0 && (
        <button
          type="button"
          className="chat-latest"
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
        </button>
      )}
      {uploadProgress !== null && (
        <div className="chat-attachment">
          <p>
            <Thinking
              state={uploadProgress < 100 ? "connecting" : "searching"}
            />
            {uploadProgress < 100
              ? `Uploading document · ${uploadProgress}%`
              : "Reading document text…"}
          </p>
          <progress
            aria-label={
              uploadProgress < 100 ? "Upload progress" : "Reading document"
            }
            max={100}
            value={uploadProgress < 100 ? uploadProgress : undefined}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => upload.current?.abort()}
          >
            Cancel upload
          </Button>
        </div>
      )}
      {attachment && (
        <section className="chat-attachment" aria-label="Document preview">
          <div className="chat-attachment-heading">
            <strong>{attachment.name}</strong>
            <Button
              type="button"
              variant="ghost"
              aria-label="Dismiss document preview"
              onClick={() => setAttachment(null)}
            >
              <X size={18} aria-hidden="true" />
            </Button>
          </div>
          <p>
            {attachment.source.coverage.text_pages} of{" "}
            {attachment.source.coverage.total_pages} pages / sections contain
            text · Not reviewed
          </p>
          {attachment.source.warnings.map((warning, i) => (
            <p key={i}>{warning}</p>
          ))}
          {attachment.source.text.length > 8000 && (
            <p>
              Only the first 8,000 characters will be added. Choose a shorter
              document to use a different section.
            </p>
          )}
          <details>
            <summary>Preview extracted text</summary>
            <pre>{attachment.source.text.slice(0, 8000)}</pre>
          </details>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setText(attachment.source.text.slice(0, 8000));
              setNotes(true);
              setAttachment(null);
              setNotice(
                "Document text added as unreviewed notes. Edit it before sending. The original file is not saved.",
              );
              input.current?.focus();
            }}
          >
            {text.trim()
              ? "Replace draft with extracted notes"
              : "Use as reference notes"}
          </Button>
        </section>
      )}
      <ComposerBeam active={pending || uploadProgress !== null}>
        <form
          className="chat-entry-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          aria-busy={pending}
        >
          <label className="chat-composer-label" htmlFor="chat-message">
            {notes ? "Paste reference notes" : "Message Errby"}
          </label>
          <textarea
            id="chat-message"
            name="message"
            autoComplete="off"
            ref={input}
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            maxLength={8000}
            disabled={pending || !ready}
            placeholder={
              notes
                ? "Paste a short factual passage from your reference notes…"
                : "Try: I can explain why ice melts…"
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void send();
              }
            }}
            aria-describedby="chat-note"
          />
          <div className="chat-composer-actions">
            <SourceActions>
              <input
                ref={fileInput}
                className="sr-only"
                type="file"
                tabIndex={-1}
                aria-label="Attach PDF or DOCX"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={pending || uploadProgress !== null}
                onChange={(event) => {
                  attach(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <SourceAction>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending || uploadProgress !== null}
                  onClick={() => fileInput.current?.click()}
                >
                  <Paperclip size={18} aria-hidden="true" /> Attach
                </Button>
              </SourceAction>
              <SourceAction>
                <Button
                  type="button"
                  variant="ghost"
                  aria-pressed={notes}
                  disabled={pending}
                  onClick={() => {
                    setNotes(!notes);
                    input.current?.focus();
                  }}
                >
                  <FileText size={18} aria-hidden="true" />{" "}
                  {notes ? "Notes selected" : "Paste notes"}
                </Button>
              </SourceAction>
            </SourceActions>
            <SendAccent>
              <Button
                type="submit"
                disabled={pending || !ready || uploadProgress !== null}
                aria-label="Send message"
              >
                <ArrowUp size={20} aria-hidden="true" />
              </Button>
            </SendAccent>
          </div>
        </form>
      </ComposerBeam>
      <p className="chat-input-help">
        PDF / DOCX up to 4 MiB · Enter to send · Shift + Enter for a new line{" "}
        <span>{text.length.toLocaleString("en")}/8,000</span>
      </p>
      <p className="chat-fine-print" id="chat-note">
        {demo
          ? "Fictional preview · live AI and saving are unavailable."
          : "Opening chat stays in this browser tab. Add reference notes for saved, evidence-based practice. AI can make mistakes."}
      </p>
      <p className="chat-notice" role="status" aria-live="polite">
        {pending ? stage : notice}
      </p>
    </div>
  );
}
