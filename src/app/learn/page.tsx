import { HomePreview } from "@/components/home-preview";
import { env } from "@/lib/env/server";
import Link from "next/link";
import { getIdentity } from "@/lib/auth/server";
import type { Metadata } from "next";
import { exampleLessons } from "@/lib/lessons/examples";
import { listPublishedLessons } from "@/lib/sessions/service";
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
    if (identity?.profile.role === "learner") {
      try {
        lessons = await listPublishedLessons(identity.db);
      } catch {
        unavailable =
          "Published lessons are unavailable right now. Check the hosted Supabase configuration and migrations, then retry.";
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
            : "Sign in with your approved account. "}
          A session opens with your teacher&apos;s published question. Errby
          never starts from a made-up claim.
        </p>
        <Link href="/setup" className="mt-6 inline-block underline">
          {identity ? "Your account" : "Sign in"}
        </Link>
        {identity && (
          <Link href="/prepare" className="ml-6 inline-block underline">
            Prepare your material
          </Link>
        )}
        {unavailable && (
          <p role="alert" className="mt-6 text-muted-foreground">
            {unavailable}
          </p>
        )}
        {identity?.profile.role === "learner" && !unavailable && (
          <section className="mt-8" aria-labelledby="published-heading">
            <h2 id="published-heading" className="text-xl font-semibold">
              Your published lessons
            </h2>
            {lessons.length === 0 ? (
              <p className="mt-3 text-muted-foreground">
                No published lessons yet. Lessons appear here after your teacher
                publishes them.
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
        {identity?.profile.role === "teacher" && (
          <p className="mt-8 text-muted-foreground">
            Learners start sessions from this page. Teacher review and class
            tools arrive with later work.
          </p>
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
