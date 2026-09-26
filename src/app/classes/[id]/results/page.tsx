import Link from "next/link";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";
import { classResults } from "@/lib/results/service";

export const dynamic = "force-dynamic";
export default async function ClassResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { id } = await params;
  const { version } = await searchParams;
  const identity = env.ERRBY_MODE === "live" ? await getIdentity() : null;
  let data: Awaited<ReturnType<typeof classResults>> | null = null;
  let lessons: { title: string; current_published_version: string }[] = [];
  if (identity?.profile.role === "teacher") {
    const owner = await identity.db
      .from("classes")
      .select("id")
      .eq("id", id)
      .eq("teacher_id", identity.user.id)
      .maybeSingle();
    if (owner.data) {
      const listed = await identity.db
        .from("lessons")
        .select("title,current_published_version")
        .eq("class_id", id)
        .is("archived_at", null)
        .not("current_published_version", "is", null);
      lessons = (listed.data ?? []).filter(
        (item): item is { title: string; current_published_version: string } =>
          !!item.current_published_version,
      );
    }
  }
  if (identity?.profile.role === "teacher" && version)
    try {
      data = await classResults(
        createAdminClient(),
        identity.user.id,
        id,
        version,
      );
    } catch {
      /* Same response for denied and unavailable records. */
    }
  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-10">
      <Link href="/classes" className="underline">
        Back to classes
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">Class results</h1>
      {!data ? (
        <>
          <p role="status" className="mt-4">
            Choose a published lesson version in your class to view results.
          </p>
          <ul className="mt-4 list-disc pl-6">
            {lessons.map((item) => (
              <li key={item.current_published_version}>
                <Link
                  className="underline"
                  href={`/classes/${id}/results?version=${item.current_published_version}`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="mt-2">
            {data.class_title} · {data.lesson_title} · one lesson version
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            The latest class session for each active learner is shown. Private
            sessions are excluded. Labels describe this lesson, not a
            learner&apos;s ability.
          </p>
          <ul className="mt-6 space-y-4">
            {data.roster.map((member) => (
              <li
                key={member.alias}
                className="rounded-lg border border-border p-4"
              >
                <h2 className="font-semibold">
                  {member.alias} · {data.lesson_title} · {member.result.label}
                </h2>
                <p>
                  {member.result.explained}/{member.result.required} required
                  goals explained · First try:{" "}
                  {member.result.scorable
                    ? `${member.result.correct}/${member.result.scorable}`
                    : "Not enough evidence"}{" "}
                  · Active time:{" "}
                  {member.result.active_ms === null
                    ? "Not measured"
                    : `about ${Math.round(member.result.active_ms / 60000)} minutes`}
                </p>
                <p>
                  Session opened:{" "}
                  {member.result.opened_at
                    ? new Date(member.result.opened_at).toLocaleDateString(
                        "en-GB",
                      )
                    : "None"}
                </p>
                <details className="mt-2">
                  <summary>Goal evidence status</summary>
                  <ul className="mt-2 list-disc pl-6">
                    {member.result.goals.map((goal) => (
                      <li key={goal.title}>
                        {goal.title}: {goal.state}
                        {goal.evidence && (
                          <span>
                            {" "}
                            · Saved answer excerpt: “{goal.evidence}”
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
