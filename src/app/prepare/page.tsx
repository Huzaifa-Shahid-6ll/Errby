import Link from "next/link";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { PreparationForm } from "./preparation-form";

export const dynamic = "force-dynamic";

export default async function Prepare() {
  const identity = env.ERRBY_MODE === "live" ? await getIdentity() : null;
  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-10">
      <Link href="/" className="underline">
        Back to Errby
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">Prepare your source</h1>
      <p className="my-4">
        Extract text and clarify what to learn. This step does not save
        material, generate a lesson or approve its accuracy. Use fictional
        material while development continues.
      </p>
      {env.ERRBY_MODE === "live" && !identity ? (
        <p>
          <Link href="/setup" className="underline">
            Sign in
          </Link>{" "}
          to prepare material.
        </p>
      ) : (
        <PreparationForm
          demo={env.ERRBY_MODE === "demo"}
          grade={identity?.profile.grade_band ?? ""}
        />
      )}
    </main>
  );
}
