import Link from "next/link";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { SignInForm } from "./sign-in-form";
import { signOut } from "./actions";
import { Button } from "@/components/ui/button";
import { DeleteAccount } from "./delete-account";

export const dynamic = "force-dynamic";

export default async function Setup({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const identity = env.ERRBY_MODE === "live" ? await getIdentity() : null;
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-lg p-6 sm:p-10">
      <Link href="/learn" className="underline">
        Back to Errby
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">
        {identity ? "Your account" : "Sign in to Errby"}
      </h1>
      {error === "signout" && (
        <p role="alert">Sign-out could not be confirmed. Please try again.</p>
      )}
      {env.ERRBY_MODE !== "live" ? (
        <p className="mt-4">
          This is a fictional demo. Account sign-in is unavailable until a
          hosted test project is configured.
        </p>
      ) : identity ? (
        <div className="mt-4 grid gap-4">
          <p>
            Signed in as {identity.profile.alias} ({identity.profile.role}).
          </p>
          <form action={signOut}>
            <Button type="submit">Sign out</Button>
          </form>
          <DeleteAccount />
        </div>
      ) : (
        <>
          <SignInForm />
          <p className="mt-6 text-sm">
            Accounts are set up by an approved teacher or administrator. For a
            new password, ask them for help. Class codes never grant teacher
            access.
          </p>
        </>
      )}
      {!identity && (
        <section
          id="sign-up"
          className="mt-8 scroll-mt-6"
          aria-labelledby="sign-up-title"
        >
          <h2 id="sign-up-title" className="text-xl font-semibold">
            Sign up for Errby
          </h2>
          <p className="mt-3">
            Accounts are currently created by an approved teacher or
            administrator. Students: ask your teacher for a username and
            password. Teachers: ask your school’s Errby administrator for an
            invitation.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Self-service sign-up is not available yet. You can explore the
            fictional demo without an account.
          </p>
          <Link href="/learn" className="mt-4 inline-block underline">
            Explore the demo
          </Link>
        </section>
      )}
    </main>
  );
}
