import { HomePreview } from "@/components/home-preview";
import { env } from "@/lib/env/server";
import Link from "next/link";
import { getIdentity } from "@/lib/auth/server";
import type { Metadata } from "next";
import { exampleLessons } from "@/lib/lessons/examples";
import { listPublishedLessons } from "@/lib/sessions/service";
import { PreparationForm } from "@/app/prepare/preparation-form";
import { StartLessonButton } from "./start-lesson";

export const metadata: Metadata = {
  title: "Errby · Learning workspace",
  description: "Errby's learning workspace and fictional local preview.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  if (env.ERRBY_MODE === "live") {
    const identity = await getIdentity();
    let lessons: Awaited<ReturnType<typeof listPublishedLessons>> = [];
    let unavailable: string | null = null;
    let savedSessions: {
      id: string;
      status: string;
      opened_at: string;
      lesson_versions: { lessons: { title: string } };
    }[] = [];
    let privateLessons: { id: string; lessons: { title: string } }[] = [];
    const classResult =
      identity?.profile.role === "teacher"
        ? await identity.db
            .from("classes")
            .select("id,title")
            .eq("teacher_id", identity.user.id)
            .eq("active", true)
        : null;
    if (identity?.profile.role === "learner") {
      try {
        lessons = await listPublishedLessons(identity.db);
        const saved = await identity.db
          .from("sessions")
          .select(
            "id,status,opened_at,lesson_versions!inner(lessons!lesson_versions_lesson_id_fkey!inner(title))",
          )
          .eq("learner_id", identity.user.id)
          .order("opened_at", { ascending: false })
          .limit(30);
        const privateReady = await identity.db
          .from("lesson_versions")
          .select(
            "id,lessons!lesson_versions_lesson_id_fkey!inner(title,owner_id,class_id,archived_at)",
          )
          .eq("review_status", "private_ready")
          .eq("lessons.owner_id", identity.user.id)
          .is("lessons.class_id", null)
          .is("lessons.archived_at", null)
          .limit(30);
        if (saved.error || privateReady.error)
          throw new Error("Learning history unavailable");
        savedSessions = saved.data as unknown as typeof savedSessions;
        privateLessons = privateReady.data as unknown as typeof privateLessons;
      } catch {
        unavailable =
          "Your lessons or saved sessions are unavailable right now. Check the hosted Supabase configuration and migrations, then retry.";
      }
    }
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-3xl font-semibold">
          {identity ? `Welcome, ${identity.profile.alias}` : "Welcome to Errby"}
        </h1>
        <p className="mt-4">
          {identity
            ? `You are signed in as a ${identity.profile.role}. `
            : "You are signed in, but your learning account is temporarily unavailable. Retry shortly or contact support. "}
          {identity?.profile.role === "teacher"
            ? "Create a class, prepare material, then review and publish lessons for your learners."
            : "Choose a class lesson, return to saved learning, or prepare your own source for private practice."}
        </p>
        <Link href="/setup" className="mt-6 inline-block underline">
          Your account
        </Link>
        {!identity && (
          <a href="/learn" className="ml-6 inline-block underline">
            Retry loading your dashboard
          </a>
        )}
        {identity && (
          <Link href="/prepare" className="ml-6 inline-block underline">
            Prepare your material
          </Link>
        )}
        {identity && (
          <Link href="/classes" className="ml-6 inline-block underline">
            Your classes
          </Link>
        )}
        {unavailable && (
          <p role="alert" className="mt-6 text-muted-foreground">
            {unavailable}
          </p>
        )}
        {identity?.profile.role === "learner" && savedSessions.length > 0 && (
          <section className="mt-8" aria-labelledby="saved-heading">
            <h2 id="saved-heading" className="text-xl font-semibold">
              Your saved learning
            </h2>
            <ul className="mt-3 space-y-3">
              {savedSessions.map((session) => (
                <li
                  key={session.id}
                  className="rounded-lg border border-border p-4"
                >
                  <Link
                    className="font-medium underline"
                    href={`/learn/sessions/${session.id}`}
                  >
                    {session.lesson_versions.lessons.title}
                  </Link>
                  <p className="mt-1 text-sm">
                    {session.status.replaceAll("_", " ")} - Started{" "}
                    {new Date(session.opened_at).toLocaleDateString("en-GB", {
                      timeZone: "UTC",
                    })}
                  </p>
                  <Link
                    className="mt-2 inline-block underline"
                    href={`/learn/sessions/${session.id}${["completed", "ended_incomplete"].includes(session.status) ? "/results" : ""}`}
                  >
                    {["completed", "ended_incomplete"].includes(session.status)
                      ? "Open summary"
                      : "Continue learning"}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {identity?.profile.role === "learner" && privateLessons.length > 0 && (
          <section className="mt-8" aria-labelledby="private-heading">
            <h2 id="private-heading" className="text-xl font-semibold">
              Your private practice
            </h2>
            <p className="mt-2 text-sm">
              AI-generated from your source - not teacher reviewed. Visible only
              to you.
            </p>
            <ul className="mt-3 space-y-3">
              {privateLessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="rounded-lg border border-border p-4"
                >
                  <h3 className="mb-3 font-medium">{lesson.lessons.title}</h3>
                  <StartLessonButton
                    lessonVersionId={lesson.id}
                    title={lesson.lessons.title}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
        {identity?.profile.role === "learner" && !unavailable && (
          <section className="mt-8" aria-labelledby="published-heading">
            <h2 id="published-heading" className="text-xl font-semibold">
              Your published lessons
            </h2>
            {lessons.length === 0 ? (
              <p className="mt-3 text-muted-foreground">
                No class lessons yet. You can prepare your own material below,
                or join a class with a code to see its published lessons.
              </p>
            ) : (
              <ul className="mt-4 list-none space-y-4 p-0">
                {lessons.map((lesson) => (
                  <li
                    key={lesson.lesson_version_id}
                    className="rounded-lg border border-border p-4"
                  >
                    <h3 className="font-medium">{lesson.title}</h3>
                    {lesson.objective_labels.length > 0 && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        You will explain: {lesson.objective_labels.join(" · ")}
                      </p>
                    )}
                    <div className="mt-3">
                      <StartLessonButton
                        lessonVersionId={lesson.lesson_version_id}
                        title={lesson.title}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {identity && (
          <section className="mt-8" aria-labelledby="prepare-heading">
            <h2 id="prepare-heading" className="mb-3 text-xl font-semibold">
              {identity.profile.role === "teacher"
                ? "Prepare a lesson for your class"
                : "What would you like to learn?"}
            </h2>
            <p className="mb-4 text-sm">
              Add factual source text or a document. A topic alone supplies
              scope and needs evidence before practice.{" "}
              <Link className="underline" href="/prepare">
                Open saved preparations
              </Link>
              .
            </p>
            {classResult?.error ? (
              <p role="alert">
                Your classes could not be loaded. Reload before preparing class
                material.
              </p>
            ) : (
              <PreparationForm
                demo={false}
                grade={identity.profile.grade_band ?? ""}
                classes={classResult?.data ?? []}
              />
            )}
          </section>
        )}
      </main>
    );
  }
  return (
    <HomePreview
      lessons={exampleLessons.map(
        ({ id, title, initial_question, objectives }) => ({
          id,
          title,
          initial_question,
          objectives: objectives.map(({ id, title }) => ({ id, title })),
        }),
      )}
    />
  );
}
