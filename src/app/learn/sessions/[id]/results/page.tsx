import Link from "next/link";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";
import { learnerResult } from "@/lib/results/service";

export const dynamic = "force-dynamic";
export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const identity = env.ERRBY_MODE === "live" ? await getIdentity() : null;
  let result: Awaited<ReturnType<typeof learnerResult>> | null = null;
  if (identity?.profile.role === "learner")
    try {
      result = await learnerResult(createAdminClient(), identity.user.id, id);
    } catch {
      /* Deny unavailable or unowned records alike. */
    }
  return (
    <main className="mx-auto max-w-2xl break-words p-6 sm:p-10 [overflow-wrap:anywhere]">
      <Link
        href={`/learn?session=${encodeURIComponent(id)}`}
        className="underline"
      >
        Back to session
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">Session results</h1>
      {!result ? (
        <p role="status" className="mt-4">
          Results are unavailable for this account or session.
        </p>
      ) : (
        <>
          <p className="mt-2">
            {result.lesson_title} · {result.label}
          </p>
          <p className="mt-6 text-xl font-medium">
            You explained {result.explained} of {result.required} required
            goals.
          </p>
          <p className="mt-3">
            {result.revised && "Teacher-revised assessment · "}
            First try:{" "}
            {result.scorable
              ? `${result.correct} of ${result.scorable} independent, scorable first attempts`
              : "Not enough evidence"}
            .
          </p>
          <p>
            Correct after help: {result.afterHelp} goals. Corrections made:{" "}
            {result.corrections} distinct misunderstandings.
          </p>
          <p>
            {result.unscored} unverified or off topic attempts were excluded
            from first try accuracy.
          </p>
          <p>
            Active learning time:{" "}
            {result.active_ms === null
              ? "Not measured"
              : `about ${Math.round(result.active_ms / 1000)} seconds (estimate)`}
            .
          </p>
          {result.status !== "completed" && (
            <p className="mt-4">
              This lesson is incomplete. Unresolved goals still need valid
              learner evidence.
            </p>
          )}
          <h2 className="mt-6 text-xl font-semibold">Required goals</h2>
          <ul className="mt-2 list-disc pl-6">
            {result.goals.map((goal) => (
              <li key={goal.id}>
                {goal.title}: {goal.state}
                {goal.evidence && (
                  <span> · Saved answer excerpt: “{goal.evidence}”</span>
                )}
                {goal.uncertainty && <p>Needs review: {goal.uncertainty}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
