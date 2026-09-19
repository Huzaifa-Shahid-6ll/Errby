"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { PreparationState } from "@/lib/preparations/contracts";
const inputClass =
  "w-full rounded-lg border border-[var(--control-border)] bg-[var(--surface)] p-3";

export function SavedPreparation({ id }: { id: string }) {
  const [state, setState] = useState<PreparationState | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");
  const [reload, setReload] = useState(0);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      const response = await fetch(
        `/api/preparations/${encodeURIComponent(id)}`,
        { cache: "no-store", signal },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.user_message || "Saved preparation could not be loaded.",
        );
      setState(payload);
      return payload as PreparationState;
    },
    [id],
  );
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function recover() {
      let waitingForLease = false;
      try {
        setPending(true);
        setError("");
        const saved = await load(controller.signal);
        if (
          saved.job.current_step !== 0 ||
          !["pending", "failed"].includes(saved.job.status)
        )
          return;
        const wait = saved.job.lease_until
          ? new Date(saved.job.lease_until).getTime() - Date.now()
          : 0;
        if (wait > 0) {
          waitingForLease = true;
          timer = setTimeout(() => void recover(), Math.min(wait + 250, 31000));
          return;
        }
        const response = await fetch(
          `/api/preparations/${encodeURIComponent(id)}/step`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expected_step: 0 }),
            signal: controller.signal,
          },
        );
        const payload = await response.json();
        if (!response.ok)
          throw new Error(
            payload.user_message ||
              "The saved step could not be resumed. Retry below.",
          );
        setState(payload);
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : "The saved step could not be resumed.",
          );
      } finally {
        if (!controller.signal.aborted && !waitingForLease) setPending(false);
      }
    }
    void recover();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [id, load, reload]);
  async function submit(event: FormEvent<HTMLFormElement>, author = false) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const body = author
        ? { expected_step: 1, draft: JSON.parse(draft) }
        : {
            expected_step: 0,
            context: {
              subject: form.get("subject"),
              grade: form.get("grade"),
              scope: form.get("scope"),
            },
          };
      const response = await fetch(
        `/api/preparations/${encodeURIComponent(id)}/step`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.user_message ||
            "The step could not be saved. Your input is unchanged.",
        );
      setState(payload);
    } catch (failure) {
      setError(
        failure instanceof SyntaxError
          ? "The draft JSON is invalid. Your text is unchanged."
          : failure instanceof Error
            ? failure.message
            : "The server could not be reached. Your input is unchanged.",
      );
    } finally {
      setPending(false);
    }
  }
  if (!state)
    return (
      <div aria-live="polite">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <Link href="/setup" className="underline">
              Account setup
            </Link>
            <Button
              type="button"
              disabled={pending}
              onClick={() => setReload((value) => value + 1)}
            >
              Retry loading
            </Button>
          </>
        ) : (
          <p>Loading saved preparation…</p>
        )}
      </div>
    );
  const { job, lesson, can_author } = state;
  const result = job.partial_results;
  return (
    <div className="grid min-w-0 gap-5 break-words">
      <p role="status">
        {job.current_step === 2
          ? "Lesson draft saved — teacher review required."
          : job.current_step === 1
            ? "Source saved — waiting for a lesson draft."
            : "Source saved — clarification pending."}
      </p>
      <p>
        This link restores the saved source and completed steps after refresh.
        Work resumes while this page is open. No background generation is
        running.
      </p>
      <p>
        Subject: {result.context.subject || "Not supplied"} · Level:{" "}
        {result.context.grade || "Not supplied"}
      </p>
      <p>Learning scope: {result.context.scope || "Not supplied"}</p>
      <Button
        type="button"
        disabled={pending}
        onClick={() => setReload((value) => value + 1)}
      >
        Reload saved state
      </Button>
      {job.lease_until && (
        <p>
          A saved step may still be running. Its short lease expires
          automatically; return or retry after it expires.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-[var(--error-surface)] p-4 text-[var(--error-text)]"
        >
          {error}
        </p>
      )}
      {result.status === "partial" ? (
        <div>
          <h2 className="font-semibold">
            Partial source — replace missing page text
          </h2>
          <p>
            Pages {result.extraction.coverage.missing_pages.join(", ")} have no
            readable text. This job retains the extracted pages. Prepare a
            readable replacement or paste complete permitted text in a new
            preparation.
          </p>
          <Link href="/prepare" className="underline">
            Prepare a replacement source
          </Link>
        </div>
      ) : (
        job.current_step === 0 && (
          <form onSubmit={submit} className="grid gap-3">
            <fieldset disabled={pending} className="grid min-w-0 gap-3">
              <legend className="font-semibold">
                Clarify the saved source
              </legend>
              {result.questions.map((q) => (
                <p key={q.field}>{q.question}</p>
              ))}
              <label>
                Subject
                <input
                  name="subject"
                  defaultValue={result.context.subject}
                  maxLength={100}
                  required
                  className={inputClass}
                />
              </label>
              <label>
                Grade or learning level
                <input
                  name="grade"
                  defaultValue={result.context.grade}
                  maxLength={100}
                  required
                  className={inputClass}
                />
              </label>
              <label>
                Learning scope
                <textarea
                  name="scope"
                  defaultValue={result.context.scope}
                  maxLength={1000}
                  required
                  className={inputClass}
                />
              </label>
              <Button type="submit">
                {pending ? "Saving…" : "Save clarification and continue"}
              </Button>
            </fieldset>
          </form>
        )
      )}
      <section aria-label="Saved source" className="min-w-0">
        <h2 className="font-semibold">Saved source — unreviewed</h2>
        <p>
          {result.extraction.source_role === "scope"
            ? "Scope only; not answer evidence."
            : "Source text is not proof of accuracy."}{" "}
          {result.extraction.provenance === "fictional_unreviewed" &&
            "Fictional demonstration material."}
        </p>
        <p>
          Text found on {result.extraction.coverage.text_pages} of{" "}
          {result.extraction.coverage.total_pages} pages.
        </p>
        {result.extraction.warnings.map((w) => (
          <p key={w}>{w}</p>
        ))}
        <details>
          <summary className="cursor-pointer underline">
            Read saved extracted text
          </summary>
          <pre className="whitespace-pre-wrap break-words text-sm">
            {result.extraction.text}
          </pre>
        </details>
      </section>
      {job.current_step === 1 && (
        <p>
          Automatic lesson drafting is not available yet. Your source and
          context are saved; no lesson has been generated or approved.
        </p>
      )}
      {job.current_step === 1 && can_author && (
        <details>
          <summary className="cursor-pointer underline">
            Teacher: import a manually authored draft
          </summary>
          <p className="my-3">
            Advanced authoring handoff: paste a lesson schema 1.1 draft. It must
            have version 1, pending review, and unverified references quoting
            exact saved page text. Import saves an immutable snapshot for later
            teacher review; it does not publish a lesson.
          </p>
          <p className="break-all">Source ID: {job.source_id}</p>
          <p>
            Source type:{" "}
            {result.extraction.kind === "topic"
              ? "outline"
              : result.extraction.kind}
            . Use this one source, with a null URL. Reference locations use
            one-based page numbers.
          </p>
          <form
            onSubmit={(event) => submit(event, true)}
            className="grid gap-3"
          >
            <label>
              Unreviewed lesson JSON
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={12}
                maxLength={500000}
                required
                className={`${inputClass} font-mono text-sm`}
              />
            </label>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save unreviewed lesson snapshot"}
            </Button>
          </form>
        </details>
      )}
      {lesson && (
        <section>
          <h2 className="text-xl font-semibold">{lesson.title}</h2>
          <p>
            Version {lesson.version} · Unreviewed ·{" "}
            {lesson.illustrative_only ? "Fictional illustration" : "Draft"}
          </p>
          <ul className="list-disc pl-5">
            {lesson.objectives.map((objective) => (
              <li key={objective.id}>{objective.title}</li>
            ))}
          </ul>
          <p>
            Stored draft versions cannot be overwritten. Teacher editing, review
            and publication belong to the upcoming review workflow. Learning
            sessions are not available from this draft.
          </p>
          {can_author && (
            <details>
              <summary className="cursor-pointer underline">
                Inspect saved draft
              </summary>
              <pre className="whitespace-pre-wrap break-words text-sm">
                {JSON.stringify(lesson, null, 2)}
              </pre>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
