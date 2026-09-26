import Link from "next/link";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { ClassForms } from "./class-forms";

export const dynamic = "force-dynamic";
export default async function ClassesPage() {
  const identity = env.ERRBY_MODE === "live" ? await getIdentity() : null;
  let classes: { id: string; title: string; grade_band: string }[] = [];
  let unavailable = false;
  if (identity) {
    const result = await identity.db
      .from("classes")
      .select("id,title,grade_band")
      .eq("active", true);
    if (result.error) unavailable = true;
    else classes = result.data ?? [];
  }
  return (
    <main className="mx-auto max-w-2xl p-6 sm:p-10">
      <Link href="/learn" className="underline">
        Back to learning workspace
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">Classes</h1>
      {env.ERRBY_MODE !== "live" ? (
        <p className="mt-4">
          Class creation and joining require live hosted setup. The local demo
          has fictional lessons only.
        </p>
      ) : !identity ? (
        <p className="mt-4">
          <Link href="/setup" className="underline">
            Sign in
          </Link>{" "}
          to manage your classes.
        </p>
      ) : unavailable ? (
        <p role="alert" className="mt-4">
          Classes are unavailable. Check the hosted configuration and
          migrations.
        </p>
      ) : (
        <ClassForms role={identity.profile.role} classes={classes} />
      )}
    </main>
  );
}
