"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Lesson } from "@/lib/lessons/schema";
import type { PreparationState } from "@/lib/preparations/contracts";

const field =
  "w-full rounded-lg border border-[var(--control-border)] bg-[var(--surface)] p-3";
export function TeacherReview({
  id,
  state,
  onSaved,
}: {
  id: string;
  state: PreparationState;
  onSaved: (next: PreparationState) => void;
}) {
  const lesson = state.lesson!;
  const [edited, setEdited] = useState<Lesson>(() => ({
    ...lesson,
    version: lesson.version + 1,
    teacher_review: { status: "pending" },
  }));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const update = (value: Partial<Lesson>) =>
    setEdited((old) => ({ ...old, ...value }));
  const updateGoal = (
    index: number,
    changes: Partial<Lesson["objectives"][number]>,
  ) =>
    setEdited((old) => ({
      ...old,
      objectives: old.objectives.map((goal, at) =>
        at === index ? { ...goal, ...changes } : goal,
      ),
    }));
  async function act(action: "edit" | "review" | "publish") {
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/preparations/${encodeURIComponent(id)}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            expected_version_id: state.job.partial_results.lesson_version_id,
            ...(action === "edit" ? { lesson: edited } : {}),
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.user_message || "Review could not be saved.");
      onSaved(payload);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Review could not be saved.",
      );
    } finally {
      setPending(false);
    }
  }
  const status = state.review_status ?? "needs_review";
  return (
    <section
      aria-label="Teacher lesson review"
      className="grid gap-4 rounded-xl border border-[var(--control-border)] p-4"
    >
      <h3 className="text-lg font-semibold">Teacher draft map and review</h3>
      <p role="status">
        Version {lesson.version} · {status.replaceAll("_", " ")} · Class lesson
      </p>
      <p>
        Check every quoted source span, learning objective and correction.
        Source checked means you personally verified the quote and its meaning.
        A saved edit resets approval.
      </p>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-[var(--error-surface)] p-3 text-[var(--error-text)]"
        >
          {error}
        </p>
      )}
      {status !== "published" && (
        <>
          <label>
            Lesson title
            <input
              className={field}
              value={edited.title}
              maxLength={160}
              onChange={(event) => update({ title: event.target.value })}
            />
          </label>
          <label>
            Opening question
            <textarea
              className={field}
              value={edited.initial_question}
              onChange={(event) =>
                update({ initial_question: event.target.value })
              }
            />
          </label>
          <label>
            Application question
            <textarea
              className={field}
              value={edited.application_question}
              onChange={(event) =>
                update({ application_question: event.target.value })
              }
            />
          </label>
          <h4 className="font-semibold">Saved source references</h4>
          {edited.references.map((ref, index) => (
            <div key={ref.id} className="grid gap-2 rounded-lg border p-3">
              <p>
                Page{" "}
                {ref.location.kind === "page"
                  ? ref.location.index
                  : ref.location.kind}{" "}
                · {ref.purpose} · {ref.id}
              </p>
              <blockquote className="border-l-2 pl-3">{ref.text}</blockquote>
              <label>
                Review finding
                <select
                  className={field}
                  value={ref.status}
                  onChange={(event) =>
                    update({
                      references: edited.references.map((item, at) =>
                        at === index
                          ? {
                              ...item,
                              status: event.target.value as typeof ref.status,
                            }
                          : item,
                      ),
                    })
                  }
                >
                  <option value="unverified">Unverified</option>
                  <option value="source_checked">Source checked</option>
                  <option value="conflicting">Conflicting</option>
                </select>
              </label>
            </div>
          ))}
          {edited.objectives.map((goal, index) => (
            <fieldset
              key={goal.id}
              className="grid gap-3 rounded-lg border p-3"
            >
              <legend className="font-semibold">
                Objective {index + 1}: {goal.id}
              </legend>
              <label>
                Title
                <input
                  className={field}
                  value={goal.title}
                  onChange={(event) =>
                    updateGoal(index, { title: event.target.value })
                  }
                />
              </label>
              <label>
                Success criteria, one per line
                <textarea
                  className={field}
                  value={goal.criteria.join("\n")}
                  onChange={(event) =>
                    updateGoal(index, {
                      criteria: event.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
              <p>
                Evidence references: {goal.reference_ids.join(", ") || "None"}.
                Correction criteria: {goal.correction_criteria.join("; ")}
              </p>
              <label>
                Unresolved issues, one per line
                <textarea
                  className={field}
                  value={goal.unresolved_issues.join("\n")}
                  onChange={(event) =>
                    updateGoal(index, {
                      unresolved_issues: event.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
            </fieldset>
          ))}
          <Button
            type="button"
            disabled={pending}
            onClick={() => void act("edit")}
          >
            Save edited draft as next version
          </Button>
          {status === "needs_review" && (
            <Button
              type="button"
              disabled={pending}
              onClick={() => void act("review")}
            >
              Approve current saved version after review
            </Button>
          )}
          {status === "approved" && (
            <>
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(event) => setConfirm(event.target.checked)}
                />
                Publish this approved version to the class
              </label>
              <Button
                type="button"
                disabled={pending || !confirm}
                onClick={() => void act("publish")}
              >
                Publish class lesson
              </Button>
            </>
          )}
        </>
      )}
      {status === "published" && (
        <p>
          The published version is available to active learners in this class.
          Its content is immutable.
        </p>
      )}
    </section>
  );
}
