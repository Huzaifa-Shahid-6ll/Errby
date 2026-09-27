"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Attempt } from "./metrics";

export function AssessmentReview({
  id,
  verdict,
}: {
  id: string;
  verdict: Attempt["verdict"];
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  return (
    <form
      className="my-3 space-y-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        const fields = new FormData(event.currentTarget);
        try {
          const response = await fetch(`/api/assessments/${id}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              expected_verdict: verdict,
              verdict: fields.get("verdict"),
              reason: fields.get("reason"),
            }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message);
          setMessage(
            "Assessment revision saved. The original model assessment is preserved.",
          );
          router.refresh();
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Review was not saved.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <label className="block">
        Reviewed verdict{" "}
        <select
          name="verdict"
          defaultValue={verdict}
          className="rounded border bg-background p-2"
        >
          {["correct", "partial", "incorrect", "unverified", "off_topic"].map(
            (value) => (
              <option key={value} value={value}>
                {value.replace("_", " ")}
              </option>
            ),
          )}
        </select>
      </label>
      <label className="block">
        Reason and source justification{" "}
        <textarea
          name="reason"
          required
          minLength={10}
          maxLength={2000}
          className="block w-full rounded border bg-background p-2"
        />
      </label>
      <button
        disabled={pending}
        className="rounded border px-3 py-2 disabled:opacity-50"
      >
        {pending ? "Saving review…" : "Save audited revision"}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
