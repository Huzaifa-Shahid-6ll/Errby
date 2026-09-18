"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env/server";
import { createSessionClient } from "@/lib/db/server";
import { createAdminClient } from "@/lib/db/admin";
import { loginEmail, profileSchema, signInSchema } from "@/lib/auth/identity";

export async function signIn(
  _previous: string,
  form: FormData,
): Promise<string> {
  if (env.ERRBY_MODE !== "live")
    return "Sign-in is unavailable in the fictional demo.";
  const input = signInSchema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return "Enter your username or teacher email and password.";
  let email: string;
  try {
    email = loginEmail(input.data.identifier);
  } catch {
    return "Use your student username or teacher email.";
  }
  try {
    const admin = createAdminClient();
    const { data: allowed, error: limitError } = await admin.rpc(
      "reserve_sign_in_attempt",
      {
        identifier_hash: createHash("sha256").update(email).digest("hex"),
      },
    );
    if (limitError)
      return "Sign-in is temporarily unavailable. Try again later.";
    if (!allowed) return "Too many sign-in attempts. Try again in 15 minutes.";
    const db = await createSessionClient(true);
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password: input.data.password,
    });
    if (error || !data.user)
      return "Sign-in failed. Check your credentials or ask your teacher for help.";
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("auth_user_id,role,alias,grade_band")
      .eq("auth_user_id", data.user.id)
      .single();
    if (profileError || !profileSchema.safeParse(profile).success) {
      await db.auth.signOut({ scope: "local" });
      return "This account is not approved for Errby. Ask your teacher or administrator.";
    }
  } catch {
    return "Sign-in is temporarily unavailable. Try again later.";
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  if (env.ERRBY_MODE === "live") {
    const db = await createSessionClient(true);
    const { error } = await db.auth.signOut({ scope: "local" });
    if (error) redirect("/setup?error=signout");
  }
  revalidatePath("/", "layout");
  redirect("/setup");
}
