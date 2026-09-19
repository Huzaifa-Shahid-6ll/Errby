import { HomePreview } from "@/components/home-preview";
import { env } from "@/lib/env/server";
import Link from "next/link";
import { getIdentity } from "@/lib/auth/server";
import type { Metadata } from "next";
import { exampleLessons } from "@/lib/lessons/examples";

export const metadata: Metadata = {
  title: "Errby · Learning workspace",
  description: "Errby's learning workspace and fictional local preview.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  if (env.ERRBY_MODE === "live") {
    const identity = await getIdentity();
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-3xl font-semibold">
          {identity ? `Welcome, ${identity.profile.alias}` : "Welcome to Errby"}
        </h1>
        <p className="mt-4">
          {identity
            ? `You are signed in as a ${identity.profile.role}. `
            : "Sign in with your approved account. "}
          Review extracted text and clarify your topic before lesson drafting.
          Learning sessions are not available yet.
        </p>
        <Link href="/setup" className="mt-6 inline-block underline">
          {identity ? "Your account" : "Sign in"}
        </Link>
        {identity && (
          <Link href="/prepare" className="ml-6 inline-block underline">
            Prepare your material
          </Link>
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
