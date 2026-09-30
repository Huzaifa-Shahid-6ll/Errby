import Link from "next/link";
import { env } from "@/lib/env/server";
import { getClerkSession, getIdentity } from "@/lib/auth/server";
import { SignOutControl } from "@/components/auth-session";
import { DeleteAccount } from "./delete-account";

export const dynamic = "force-dynamic";
export default async function Setup() {
  const session = await getClerkSession();
  const identity = session ? await getIdentity() : null;
  return (
    <main className="mx-auto max-w-lg p-6 sm:p-10">
      <Link href="/learn" className="underline">
        Back to Errby
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">
        {session ? "Your account" : "Sign in to Errby"}
      </h1>
      {env.ERRBY_MODE !== "live" ? (
        <p className="mt-4">
          This is a fictional demo. Account sign-in is unavailable until Clerk
          and a hosted test project are configured.
        </p>
      ) : session ? (
        <div className="mt-4 grid gap-4">
          {identity ? (
            <p>
              Signed in as {identity.profile.alias} ({identity.profile.role}).
            </p>
          ) : (
            <p role="status">
              You are signed in, but your learning account is temporarily
              unavailable. Retry using Continue to learning. If this continues,
              contact support; you do not need to sign up again.
            </p>
          )}
          <Link href="/account" className="underline">
            Manage sign-in and security
          </Link>
          <Link href="/learn" className="underline">
            Continue to learning
          </Link>
          <SignOutControl />
          <DeleteAccount />
        </div>
      ) : (
        <div className="mt-6 flex gap-6">
          <Link href="/sign-in" className="underline">
            Sign in
          </Link>
          <Link href="/sign-up" className="underline">
            Sign up
          </Link>
        </div>
      )}
      {!session && (
        <section id="sign-up" className="mt-8" aria-labelledby="sign-up-title">
          <h2 id="sign-up-title" className="text-xl font-semibold">
            Sign up for Errby
          </h2>
          <p className="mt-3">
            Create your student account, open the chat, and teach Errby an idea
            in your own words.
          </p>
          <Link
            href={env.ERRBY_MODE === "live" ? "/sign-up" : "/learn"}
            className="mt-4 inline-block underline"
          >
            {env.ERRBY_MODE === "live"
              ? "Create your sign-in account"
              : "Explore the demo"}
          </Link>
        </section>
      )}
    </main>
  );
}
