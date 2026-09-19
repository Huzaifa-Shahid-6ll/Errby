"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
const labels: Record<string, string> = {
  pending: "Ready to resume",
  needs_clarification: "Clarification needed",
  drafting: "Waiting for lesson draft",
  needs_review: "Teacher review required",
  failed: "Retry needed",
};
export function SavedPreparations() {
  const [jobs, setJobs] = useState<
    { id: string; title: string; status: string }[] | null
  >(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/preparations", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.user_message);
        setJobs(data.jobs);
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setError(failure.message || "Saved preparations are unavailable.");
      });
    return () => controller.abort();
  }, []);
  return (
    <section className="my-6" aria-label="Saved preparations">
      <h2 className="text-xl font-semibold">Saved preparations</h2>
      {error ? (
        <p role="alert">{error}</p>
      ) : jobs === null ? (
        <p>Loading saved preparations…</p>
      ) : !jobs.length ? (
        <p>No saved preparations yet.</p>
      ) : (
        <ul className="list-disc pl-5">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                className="underline break-words"
                href={`/prepare/${job.id}`}
              >
                {job.title}
              </Link>{" "}
              · {labels[job.status] ?? "Saved preparation"}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
