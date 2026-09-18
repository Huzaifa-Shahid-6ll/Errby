import { HomePreview } from "@/components/home-preview";
import { env } from "@/lib/env/server";
import Link from "next/link";
import { getIdentity } from "@/lib/auth/server";

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
          Lesson preparation and learning sessions are not available yet.
        </p>
        <Link href="/setup" className="mt-6 inline-block underline">
          {identity ? "Your account" : "Sign in"}
        </Link>
      </main>
    );
  }
  return <HomePreview />;
}
