"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  INGESTION_LIMITS,
  type PreparationResult,
} from "@/lib/ingestion/contracts";

const inputClass =
  "w-full rounded-lg border border-[var(--control-border)] bg-[var(--surface)] p-3";

export function PreparationForm({
  demo,
  grade,
}: {
  demo: boolean;
  grade: string;
}) {
  const [kind, setKind] = useState("topic");
  const [result, setResult] = useState<PreparationResult | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (kind !== "pdf") data.delete("file");
    setError("");
    setResult(null);
    setPending(true);
    try {
      const response = await fetch("/prepare/extract", {
        method: "POST",
        body: data,
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(
          payload.user_message ||
            "Preparation failed. Your input is unchanged; try again.",
        );
        return;
      }
      setResult(payload);
      const level = form.elements.namedItem("grade");
      if (level instanceof HTMLInputElement && !level.value)
        level.value = payload.context.grade;
    } catch {
      setError(
        "The server could not be reached. Your input and selected file are unchanged; try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      {demo && (
        <p className="rounded-lg bg-[var(--supervisor-surface)] p-4 text-[var(--supervisor-text)]">
          Local demo: pasted fictional text and a built-in fictional PDF sample
          are available. Personal PDF uploads require a signed-in account in
          live mode.
        </p>
      )}
      <p id="source-limits" className="text-sm">
        One text PDF, up to 10 MiB and 50 pages; up to 30,000 extracted or
        pasted characters. Scans, images, DOCX and automatic web/video imports
        are unavailable. Paste permitted text instead. No OCR.
      </p>
      <form
        onSubmit={submit}
        onChange={() => {
          setResult(null);
          setError("");
        }}
        className="grid gap-4"
        aria-describedby="source-limits"
      >
        <fieldset disabled={pending} className="grid min-w-0 gap-4">
          <label className="grid gap-1">
            Source type
            <select
              name="kind"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              className={inputClass}
            >
              <option value="topic">
                Topic or curriculum outline (scope only)
              </option>
              <option value="text">Pasted reference text (unreviewed)</option>
              {!demo && <option value="pdf">Text PDF (unreviewed)</option>}
              <option value="sample">Fictional PDF sample (unreviewed)</option>
            </select>
          </label>
          <label
            hidden={kind === "pdf" || kind === "sample"}
            className="grid gap-1"
          >
            Topic or pasted text
            <textarea
              name="text"
              rows={6}
              maxLength={INGESTION_LIMITS.characters}
              className={inputClass}
              placeholder="For example: Grade 7: heat, cells, fractions"
            />
          </label>
          <label hidden={kind !== "pdf"} className="grid gap-1">
            Text PDF
            <input
              name="file"
              type="file"
              accept="application/pdf,.pdf"
              className={inputClass}
            />
          </label>
          <label className="grid gap-1">
            Subject (if known)
            <input name="subject" maxLength={100} className={inputClass} />
          </label>
          <label className="grid gap-1">
            Grade or learning level (if known)
            <input
              name="grade"
              defaultValue={grade}
              maxLength={100}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1">
            Learning scope or desired depth (if known)
            <textarea
              name="scope"
              rows={2}
              maxLength={1_000}
              className={inputClass}
            />
          </label>
          <Button type="submit">
            {pending ? "Extracting…" : "Extract and clarify"}
          </Button>
        </fieldset>
      </form>
      <p className="text-sm">
        Input stays in this open page after a failed request. It is not saved;
        refreshing or leaving the page loses it.
      </p>
      <div aria-live="polite" aria-atomic="true">
        {pending && <p>Checking the source…</p>}
        {result && (
          <p>
            {result.status === "partial"
              ? "Extraction is partial."
              : "Extraction finished."}{" "}
            Review is still required. {result.questions.length} clarification
            questions below.
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
      </div>
      {result && (
        <section
          aria-label="Extraction result"
          className="grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-[var(--control-border)] p-4"
        >
          <h2 className="text-xl font-semibold">
            {result.status === "partial"
              ? "Partial extraction — missing page text"
              : "Source extracted — review still required"}
          </h2>
          <p>
            {result.extraction.source_role === "scope"
              ? "Scope source: this outline is not factual evidence."
              : "Evidence source: extracted content is unreviewed, not proof of accuracy."}{" "}
            {result.extraction.provenance === "fictional_unreviewed" &&
              "Fictional demonstration material."}
          </p>
          {result.questions.length > 0 && (
            <div>
              <h3 className="font-semibold">Clarify these together</h3>
              <ul className="list-disc pl-5">
                {result.questions.map((question) => (
                  <li key={question.field}>{question.question}</li>
                ))}
              </ul>
              <p className="mt-2">
                Fill the matching fields above and extract again.
              </p>
            </div>
          )}
          {result.extraction.kind === "pdf" && (
            <p>
              Text found on {result.extraction.coverage.text_pages} of{" "}
              {result.extraction.coverage.total_pages} pages.
              {result.extraction.coverage.missing_pages.length > 0 &&
                ` Missing text: pages ${result.extraction.coverage.missing_pages.join(", ")}.`}
            </p>
          )}
          {result.extraction.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
          <h3 className="font-semibold">
            Extraction sample (first 1,000 characters)
          </h3>
          <pre className="whitespace-pre-wrap break-words text-sm">
            {result.extraction.sample}
          </pre>
          <details>
            <summary className="cursor-pointer underline">
              Show all extracted text
            </summary>
            <pre className="mt-3 whitespace-pre-wrap break-words text-sm">
              {result.extraction.text}
            </pre>
          </details>
          <p className="text-sm">
            Nothing has been saved or approved. Lesson drafting and publication
            are separate steps.
          </p>
        </section>
      )}
    </div>
  );
}
