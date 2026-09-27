"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { PreparationState } from "@/lib/preparations/contracts";
import { StartLessonButton } from "@/app/learn/start-lesson";
import { TeacherReview } from "./teacher-review";
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
  async function submit(
    event: FormEvent<HTMLFormElement>,
    author = false,
    authoredDraft?: unknown,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const body = author
        ? { expected_step: 1, draft: authoredDraft ?? JSON.parse(draft) }
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
  async function generate() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/preparations/${encodeURIComponent(id)}/step`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expected_step: 1 }),
        },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.user_message ||
            "Draft generation failed. Your source is saved.",
        );
      setState(payload);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Draft generation failed. Retry your saved preparation.",
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
          ? state.review_status === "published"
            ? "Lesson published — available to your class."
            : state.review_status === "private_ready"
              ? "Private practice ready — not teacher reviewed."
              : state.review_status === "approved"
                ? "Lesson approved — ready to publish."
                : "Lesson draft saved — teacher review required."
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
        <section className="grid gap-3 rounded-xl border border-[var(--control-border)] p-4">
          <h2 className="font-semibold">Prepare a lesson from your source</h2>
          <p>
            AI drafts a short lesson with source excerpts. Class lessons require
            teacher review; private practice is labelled as unreviewed.
          </p>
          <Button
            type="button"
            disabled={pending}
            onClick={() => void generate()}
          >
            {pending ? "Preparing lesson..." : "Generate lesson draft"}
          </Button>
        </section>
      )}
      {job.current_step === 1 && can_author && (
        <form
          className="grid gap-3 rounded-xl border border-[var(--control-border)] p-4"
          onSubmit={(event) => {
            const data = new FormData(event.currentTarget);
            const quote = String(data.get("quote") || "").trim();
            const objective = String(data.get("objective") || "").trim();
            const criterion = String(data.get("criterion") || "").trim();
            const correction = String(data.get("correction") || "").trim();
            const followUp = String(data.get("follow_up") || "").trim();
            const question = String(data.get("question") || "").trim();
            const page = Number(data.get("page"));
            const source = result.extraction;
            const sourceKind =
              source.kind === "topic" ? "outline" : source.kind;
            const authored = {
              schema_version: "1.1",
              id: `lesson-${job.id}`,
              version: 1,
              title: String(data.get("title") || "").trim(),
              grade_band: result.context.grade || "Teacher specified",
              language: "en",
              content_origin: "human_authored",
              illustrative_only: source.provenance === "fictional_unreviewed",
              initial_question: question,
              application_question: followUp,
              sources: [
                {
                  id: job.source_id,
                  title: "Saved source",
                  kind: sourceKind,
                  url: null,
                  provenance: "Saved unreviewed source",
                },
              ],
              references: [
                {
                  id: "source-quote",
                  source_id: job.source_id,
                  location: { kind: "page", index: page },
                  text: quote,
                  text_kind: "excerpt",
                  purpose: source.source_role,
                  status: "unverified",
                },
              ],
              objectives: [
                {
                  id: "objective-1",
                  title: objective,
                  required: true,
                  criteria: [criterion],
                  acceptable_explanations: [criterion],
                  essential_facts: [quote],
                  correction_criteria: [correction],
                  reference_ids:
                    source.source_role === "evidence" ? ["source-quote"] : [],
                  misconceptions: [],
                  follow_up_questions: [followUp],
                  application_question: followUp,
                  unresolved_issues: [
                    "Teacher review and source check pending.",
                  ],
                },
              ],
              teacher_review: { status: "pending" },
            };
            void submit(event, true, authored);
          }}
        >
          <h2 className="font-semibold">Map one objective from this source</h2>
          <p>
            Use a real, permitted evidence source. Paste one exact quote from a
            saved page. The draft remains unreviewed until you check it below.
          </p>
          <label>
            Lesson title
            <input
              name="title"
              required
              maxLength={160}
              className={inputClass}
            />
          </label>
          <label>
            Page number
            <select name="page" className={inputClass}>
              {result.extraction.pages.map((page) => (
                <option key={page.page} value={page.page}>
                  Page {page.page}
                </option>
              ))}
            </select>
          </label>
          <label>
            Exact source quote
            <textarea
              name="quote"
              required
              maxLength={2000}
              className={inputClass}
            />
          </label>
          <label>
            Learning objective
            <input
              name="objective"
              required
              maxLength={2000}
              className={inputClass}
            />
          </label>
          <label>
            Success criterion
            <textarea
              name="criterion"
              required
              maxLength={2000}
              className={inputClass}
            />
          </label>
          <label>
            Correction criterion
            <textarea
              name="correction"
              required
              maxLength={2000}
              className={inputClass}
            />
          </label>
          <label>
            Opening question
            <textarea
              name="question"
              required
              maxLength={2000}
              className={inputClass}
            />
          </label>
          <label>
            Follow-up and application question
            <textarea
              name="follow_up"
              required
              maxLength={2000}
              className={inputClass}
            />
          </label>
          <Button type="submit" disabled={pending}>
            Save unreviewed draft map
          </Button>
        </form>
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
            Version {lesson.version} ·{" "}
            {state.review_status === "published"
              ? "Published"
              : state.review_status === "approved"
                ? "Approved"
                : "Unreviewed"}{" "}
            · {lesson.illustrative_only ? "Fictional illustration" : "Draft"}
          </p>
          <ul className="list-disc pl-5">
            {lesson.objectives.map((objective) => (
              <li key={objective.id}>{objective.title}</li>
            ))}
          </ul>
          <p>
            Stored versions cannot be overwritten. Teacher edits create a new
            version.
          </p>
          {state.review_status === "private_ready" &&
            job.partial_results.lesson_version_id && (
              <div className="my-4 grid gap-3">
                <p>
                  AI-generated private practice - not teacher reviewed.
                  Questions and feedback use your supplied source. Matching a
                  quote does not establish factual accuracy; check uncertain
                  claims with a teacher.
                </p>
                <StartLessonButton
                  lessonVersionId={job.partial_results.lesson_version_id}
                  title={lesson.title}
                />
              </div>
            )}
          {!can_author && state.review_status !== "private_ready" && (
            <p>
              This draft needs stronger source evidence before practice can
              begin. Prepare complete factual material, rather than an outline,
              and resolve any missing or conflicting source claims.
            </p>
          )}
          {can_author && job.class_id && (
            <TeacherReview
              key={job.partial_results.lesson_version_id}
              id={id}
              state={state}
              onSaved={setState}
            />
          )}
          {can_author && !job.class_id && (
            <p>
              Private drafts cannot be published. Prepare this source for an
              active class to start a class lesson.
            </p>
          )}
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
