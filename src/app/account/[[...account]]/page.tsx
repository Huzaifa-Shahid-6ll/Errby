import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getClerkSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export default async function AccountPage() {
  if (!(await getClerkSession())) redirect("/sign-in");
  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/setup" className="mb-6 inline-block underline">
        Back to your account
      </Link>
      <UserProfile routing="path" path="/account" />
    </main>
  );
}
