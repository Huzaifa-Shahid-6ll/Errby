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
    </main>
  );
}
