import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { env } from "@/lib/env/server";
import { getClerkSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export default async function SignUpPage() {
  if (await getClerkSession()) redirect("/learn");
  return (
    <main className="mx-auto max-w-lg p-6 sm:p-10">
      <Link href="/" className="underline">
        Back to Errby
      </Link>
      <h1 className="my-6 text-3xl font-semibold">Sign up for Errby</h1>
      <p className="mb-6">
        Create your student account and start learning. Choose a username and
        password; no student email or teacher approval is required. You can join
        a class later with a class code.
      </p>
      {env.ERRBY_MODE === "live" ? (
        <SignUp
          routing="path"
          path="/sign-up"
          forceRedirectUrl="/learn"
          signInForceRedirectUrl="/learn"
          signInUrl="/sign-in"
        />
      ) : (
        <p>Account sign-up is unavailable in the fictional demo.</p>
      )}
    </main>
  );
}
