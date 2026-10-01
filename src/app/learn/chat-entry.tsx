"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, FileText, Paperclip, X } from "lucide-react";
import { ConversationEnd, CopyMessage } from "./chat-controls";
import { ContentLabel, MessageText } from "./chat-content";
import { DocumentLibrary } from "./document-library";
import { TopicStarters } from "./topic-starters";
import type { TopicNotes } from "@/lib/chat/topic-sources";
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
  document_id?: string;
  source_mode?: "full" | "excerpt";
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
  const [starter, setStarter] = useState<TopicNotes | null>(null);
  const [selectedSource, setSelectedSource] = useState<{
    id: string;
    name: string;
    mode: "full" | "excerpt";
  } | null>(null);
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
  const upload = useRef<XMLHttpRequest | null>(null);
  const replyRequest = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const attempt = useRef<Attempt | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const storageKey = `errby:entry:${accountId}`;

  function selectStarter(value: TopicNotes) {
    setText(value.text);
    setNotes(true);
    setSelectedSource(null);
    setStarter(null);
    setNotice(
      `Reference notes for ${value.title} added. Review or edit before sending.`,
    );
    input.current?.focus();
  }

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
            saved.notes === true &&
            typeof saved.source?.id === "string" &&
            typeof saved.source?.name === "string" &&
            ["full", "excerpt"].includes(saved.source?.mode)
          )
            setSelectedSource(saved.source);
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
        JSON.stringify({
          messages,
          text,
          notes,
          source: selectedSource,
          attempt: attempt.current,
        }),
      );
    } catch {
      /* Current tab state still works. */
    }
  }, [messages, text, notes, selectedSource, pending, ready, storageKey]);
  useEffect(() => {
    return () => {
      upload.current?.abort();
      replyRequest.current?.abort();
    };
  }, []);

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
      setNotice(
        "Upload cancelled. Your draft is unchanged. A save already underway may finish; check Saved documents.",
      );
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
    const controller = new AbortController();
    replyRequest.current = controller;
    const normalized = text.trim();
    if (
      attempt.current?.text !== normalized ||
      attempt.current.notes !== notes ||
      attempt.current.document_id !== selectedSource?.id ||
      attempt.current.source_mode !== selectedSource?.mode
    )
      attempt.current = {
        key: crypto.randomUUID(),
        text: normalized,
        notes,
        document_id: selectedSource?.id,
        source_mode: selectedSource?.mode,
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
        setSelectedSource(null);
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
      setSelectedSource(null);
      attempt.current = null;
      setNotice("Reply ready. Your turn.");
    } catch (error) {
      if (controller.signal.aborted) {
        setNotice(
          "Processing stop requested. Your draft is kept; saved notes remain. Provider charges may still apply. Retry the same message to recover confirmed work.",
        );
        return;
      }
      setNotice(
        error instanceof Error && error.message !== "Failed to fetch"
          ? error.message
          : "The reply couldn't be confirmed. Your message is still here. Retry the same message to recover it.",
      );
    } finally {
      setPending(false);
      replyRequest.current = null;
      setStreamed("");
      if (!controller.signal.aborted)
        requestAnimationFrame(() =>
          input.current?.focus({ preventScroll: true }),
        );
    }
  }

  return (
    <div className="chat-entry">
      <TopicStarters
        disabled={pending || uploadProgress !== null}
        onSelect={(value) => {
          if (text.trim()) setStarter(value);
          else selectStarter(value);
        }}
      />
      {starter && (
        <div className="chat-attachment" role="status">
          <p>
            Your draft is still here. Replace it with source notes for{" "}
            {starter.title}?
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => selectStarter(starter)}
          >
            Replace draft with source notes
          </Button>{" "}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStarter(null)}
          >
            Keep my draft
          </Button>
        </div>
      )}
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
              <MessageText text={message.text} />
              <CopyMessage
                text={message.text}
                speaker={message.role === "student" ? "your" : "Errby"}
              />
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
      {(messages.length > 0 || pending) && (
        <ConversationEnd
          revision={`${messages.length}:${pending}:${streamed}`}
        />
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
            <ContentLabel kind="document">{attachment.name}</ContentLabel>
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
            <ContentLabel kind="tool">
              Text extraction · Not reviewed
            </ContentLabel>
          </p>
          <p>
            {attachment.source.coverage.text_pages} of{" "}
            {attachment.source.coverage.total_pages} pages / sections contain
            text · Not reviewed
          </p>
          <p>
            {attachment.source.document_id
              ? "The original and extracted text are saved privately in your documents. Notes join a conversation when sent."
              : "This extraction is not a saved original. Notes save when sent."}
          </p>
          {attachment.source.warnings.map((warning, i) => (
            <p key={i}>
              <ContentLabel kind="guidance">{warning}</ContentLabel>
            </p>
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
              setSelectedSource(
                attachment.source.document_id
                  ? {
                      id: attachment.source.document_id,
                      name: attachment.name,
                      mode: "excerpt",
                    }
                  : null,
              );
              setAttachment(null);
              setNotice(
                "Document excerpt added as unreviewed notes. Edit it before sending; page locations are not claimed for edited text.",
              );
              input.current?.focus();
            }}
          >
            {text.trim()
              ? "Replace draft with extracted notes"
              : "Use as reference notes"}
          </Button>
          {attachment.source.document_id && (
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-11 whitespace-normal"
              disabled={pending}
              onClick={() => {
                setText(attachment.source.text.slice(0, 8000));
                setNotes(true);
                setSelectedSource({
                  id: attachment.source.document_id!,
                  name: attachment.name,
                  mode: "full",
                });
                setAttachment(null);
                setNotice(
                  "Full extracted document selected. All extracted pages will be used; editing the preview switches to an excerpt.",
                );
              }}
            >
              {text.trim()
                ? "Replace draft with full document and page references"
                : "Use full document with page references"}
            </Button>
          )}
        </section>
      )}
      {selectedSource && (
        <div className="chat-attachment" role="status">
          <p>
            {selectedSource.name} ·{" "}
            {selectedSource.mode === "full"
              ? "Full extracted document; editing below switches to an excerpt"
              : "Edited excerpt; original page locations not claimed"}
          </p>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setSelectedSource(null)}
          >
            Remove document reference
          </Button>
        </div>
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
            onChange={(event) => {
              setText(event.target.value);
              if (selectedSource?.mode === "full")
                setSelectedSource({ ...selectedSource, mode: "excerpt" });
            }}
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
                    setSelectedSource(null);
                    input.current?.focus();
                  }}
                >
                  <FileText size={18} aria-hidden="true" />{" "}
                  {notes ? "Notes selected" : "Paste notes"}
                </Button>
              </SourceAction>
              <DocumentLibrary
                disabled={pending || uploadProgress !== null}
                onSelect={setAttachment}
              />
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
      {pending && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            replyRequest.current?.abort();
            setStreamed("");
            setNotice(
              "Processing stop requested. Your draft is kept; provider charges may still apply.",
            );
          }}
        >
          Stop processing
        </Button>
      )}
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
