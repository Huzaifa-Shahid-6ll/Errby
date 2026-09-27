import Link from "next/link";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { PreparationForm } from "./preparation-form";
import { SavedPreparations } from "./saved-preparations";

export const dynamic = "force-dynamic";

export default async function Prepare({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string | string[] }>;
}) {
  const { class_id } = await searchParams;
  const identity = env.ERRBY_MODE === "live" ? await getIdentity() : null;
  const classResult =
    identity?.profile.role === "teacher"
      ? await identity.db
          .from("classes")
          .select("id,title")
          .eq("teacher_id", identity.user.id)
          .eq("active", true)
      : null;
  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-10">
      <Link href="/learn" className="underline">
        Back to Errby
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">Prepare your source</h1>
      <p className="my-4">
        Extract text and clarify what to learn.{" "}
        {env.ERRBY_MODE === "demo"
          ? "The demo does not save material."
          : "Signed-in preparation saves extracted text and context so you can return after a refresh."}{" "}
        {env.ERRBY_MODE === "live"
          ? "Generate an AI draft after saving your source. Class publication requires teacher review; private practice stays clearly labelled as unreviewed."
          : "No automatic lesson generation or accuracy approval is performed."}{" "}
        Use fictional material while development continues.
      </p>
      {identity && <SavedPreparations />}
      {env.ERRBY_MODE === "live" && !identity ? (
        <p>
          <Link href="/setup" className="underline">
            Sign in
          </Link>{" "}
          to prepare material.
        </p>
      ) : classResult?.error ? (
        <p role="alert">
          Your classes could not be loaded. Reload before preparing class
          material.
        </p>
      ) : (
        <PreparationForm
          demo={env.ERRBY_MODE === "demo"}
          grade={identity?.profile.grade_band ?? ""}
          classes={classResult?.data ?? []}
          initialClassId={
            typeof class_id === "string" &&
            classResult?.data?.some((item) => item.id === class_id)
              ? class_id
              : ""
          }
        />
      )}
    </main>
  );
}
