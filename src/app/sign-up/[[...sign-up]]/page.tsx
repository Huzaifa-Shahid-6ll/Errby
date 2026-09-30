import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { env } from "@/lib/env/server";
import { getClerkSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export default async function SignUpPage() {
  if (await getClerkSession()) redirect("/setup");
  return (
    <main className="mx-auto max-w-lg p-6 sm:p-10">
      <Link href="/" className="underline">
        Back to Errby
      </Link>
      <h1 className="my-6 text-3xl font-semibold">Sign up for Errby</h1>
      <p className="mb-6">
        Your teacher or administrator must approve access before you can use
        saved learning. Students can use an assigned username; no student email
        is required.
      </p>
      {env.ERRBY_MODE === "live" ? (
        <SignUp
          routing="path"
          path="/sign-up"
          forceRedirectUrl="/setup"
          signInForceRedirectUrl="/learn"
          signInUrl="/sign-in"
        />
      ) : (
        <p>Account sign-up is unavailable in the fictional demo.</p>
      )}
    </main>
  );
}
