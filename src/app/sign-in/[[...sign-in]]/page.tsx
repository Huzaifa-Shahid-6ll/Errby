import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { env } from "@/lib/env/server";
import { getClerkSession } from "@/lib/auth/server";
import { safeDestination } from "@/lib/auth/redirect";

export const dynamic = "force-dynamic";
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeDestination((await searchParams).next);
  if (await getClerkSession()) redirect(next);
  return (
    <main className="mx-auto max-w-lg p-6 sm:p-10">
      <Link href="/" className="underline">
        Back to Errby
      </Link>
      <h1 className="my-6 text-3xl font-semibold">Sign in to Errby</h1>
      {env.ERRBY_MODE === "live" ? (
        <SignIn
          routing="path"
          path="/sign-in"
          forceRedirectUrl={next}
          signUpForceRedirectUrl="/setup"
          signUpUrl="/sign-up"
        />
      ) : (
        <p>Account sign-in is unavailable in the fictional demo.</p>
      )}
    </main>
  );
}
