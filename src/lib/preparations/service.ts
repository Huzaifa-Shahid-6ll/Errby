import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clarify, IngestionError } from "@/lib/ingestion/server";
import type { PreparationResult } from "@/lib/ingestion/contracts";
import { generatePreparationDraft } from "@/lib/ai/preparation";
import { lessonSchema } from "@/lib/lessons/schema";
import type { PreparationJob, PreparationState } from "./contracts";

export const uuid = z.uuid();
export const stepSchema = z.strictObject({
  expected_step: z.number().int().min(0).max(1),
  context: z
    .strictObject({
      subject: z.string().trim().max(100),
      grade: z.string().trim().max(100),
      scope: z.string().trim().max(1000),
    })
    .optional(),
  draft: z.unknown().optional(),
});
export type PreparationActor = {
  id: string;
  role: "learner" | "teacher";
  grade: string;
};
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function databaseFailure(error: { message: string }): never {
  const failures: Record<string, [number, string]> = {
    preparation_forbidden: [
      403,
      "Only the active class owner can prepare class material.",
    ],
    preparation_not_found: [
      404,
      "This preparation is unavailable for your account.",
    ],
    idempotency_conflict: [
      409,
      "This retry key belongs to different input. Start a new preparation.",
    ],
    step_conflict: [
      409,
      "The preparation has advanced. Reload its saved state.",
    ],
    preparation_busy: [
      409,
      "Another request is working on this preparation. Retry after its lease expires.",
    ],
    lease_lost: [
      409,
      "This step was recovered by another request. Reload its saved state.",
    ],
  };
  const code = Object.keys(failures).find((key) => error.message.includes(key));
  if (code)
    throw new IngestionError(code, failures[code][1], failures[code][0]);
  throw new IngestionError(
    "preparation_storage_unavailable",
    "Saved preparation is unavailable. Check the hosted Supabase configuration and apply all repository migrations; then retry the saved step. A completed model response is reused where available.",
    503,
  );
}
function publicJob(
  row: PreparationJob & { lease_token?: string | null },
): PreparationJob {
  // Lease tokens fence workers and never belong in browser responses.
  const {
    id,
    owner_id,
    class_id,
    source_id,
    status,
    current_step,
    completed_steps,
    lease_until,
    created_at,
    updated_at,
    error_code,
    partial_results,
  } = row;
  return {
    id,
    owner_id,
    class_id,
    source_id,
    status,
    current_step,
    completed_steps,
    lease_until,
    created_at,
    updated_at,
    error_code,
    partial_results,
  };
}
export async function createPreparation(
  db: SupabaseClient,
  actor: PreparationActor,
  key: string,
  classId: string | null,
  result: PreparationResult,
) {
  const { data, error } = await db.rpc("create_preparation", {
    p_owner: actor.id,
    p_class: classId,
    p_key: key,
    p_hash: hash({ classId, result }),
    p_result: result,
  });
  if (error) databaseFailure(error);
  return publicJob(data);
}
export async function readPreparation(
  db: SupabaseClient,
  actor: PreparationActor,
  id: string,
): Promise<PreparationState> {
  const { data, error } = await db
    .from("preparation_jobs")
    .select("*")
    .eq("id", id)
    .eq("owner_id", actor.id)
    .maybeSingle();
  if (error) databaseFailure(error);
  if (!data)
    throw new IngestionError(
      "preparation_not_found",
      "This preparation is unavailable for your account.",
      404,
    );
  // Service-role reads need the same class check as mutations.
  const access = await db.rpc("check_preparation_owner", {
    p_owner: actor.id,
    p_class: data.class_id,
  });
  if (access.error) databaseFailure(access.error);
  let lesson = null;
  let review_status: string | null = null;
  if (data.partial_results.lesson_version_id) {
    const version = await db
      .from("lesson_versions")
      .select("lesson_json,review_status")
      .eq("id", data.partial_results.lesson_version_id)
      .eq("lesson_id", data.partial_results.lesson_id)
      .single();
    if (version.error) databaseFailure(version.error);
    lesson = lessonSchema.parse(version.data.lesson_json);
    review_status = version.data.review_status;
  }
  return {
    job: publicJob(data),
    lesson,
    can_author: actor.role === "teacher",
    review_status,
  };
}
export async function listPreparations(
  db: SupabaseClient,
  actor: PreparationActor,
) {
  const { data, error } = await db
    .from("preparation_jobs")
    .select("id,status,current_step,created_at,class_id,partial_results")
    .eq("owner_id", actor.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) databaseFailure(error);
  // Class activity is enforced again on opening the job; this list exposes no source text.
  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    current_step: row.current_step,
    created_at: row.created_at,
    title: row.partial_results.context?.scope || "Saved preparation",
  }));
}

export function validateDraft(
  input: unknown,
  job: PreparationJob,
  actor: PreparationActor,
  version = 1,
  generated = false,
) {
  if (actor.role !== "teacher" && !(generated && !job.class_id))
    throw new IngestionError(
      "draft_forbidden",
      "A teacher must author and review a lesson draft. Your source remains saved.",
      403,
    );
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success)
    throw new IngestionError(
      "invalid_draft",
      "The draft does not match lesson schema 1.1. Check objectives, references and unresolved issues.",
      400,
    );
  const draft = parsed.data;
  if (
    draft.teacher_review.status !== "pending" ||
    draft.version !== version ||
    (version === 1 && draft.references.some((r) => r.status !== "unverified"))
  )
    throw new IngestionError(
      "untrusted_review",
      "Drafts need the expected version and pending review. Imported version 1 references must be unverified.",
      400,
    );
  const extraction = job.partial_results.extraction;
  if (
    draft.sources.length !== 1 ||
    draft.sources[0].id !== job.source_id ||
    draft.sources[0].url !== null ||
    draft.sources[0].kind !==
      (extraction.kind === "topic" ? "outline" : extraction.kind)
  )
    throw new IngestionError(
      "source_mismatch",
      "Use this preparation's saved source ID and type; external sources need a separate preparation.",
      400,
    );
  for (const reference of draft.references) {
    const location = reference.location;
    const page =
      location.kind === "page"
        ? extraction.pages.find((p) => p.page === location.index)
        : undefined;
    if (
      reference.source_id !== job.source_id ||
      !page ||
      reference.text_kind !== "excerpt" ||
      !page.text.includes(reference.text) ||
      reference.purpose !== extraction.source_role
    )
      throw new IngestionError(
        "reference_mismatch",
        "References must quote an exact saved page span and retain its scope/evidence role.",
        400,
      );
  }
  draft.sources[0].provenance = `Saved ${extraction.kind}; SHA-256 ${extraction.sha256}; ${extraction.provenance}`;
  if (extraction.provenance === "fictional_unreviewed")
    draft.illustrative_only = true;
  return draft;
}
export async function advancePreparation(
  db: SupabaseClient,
  actor: PreparationActor,
  id: string,
  input: unknown,
  generate = generatePreparationDraft,
) {
  const parsed = stepSchema.safeParse(input);
  if (!parsed.success)
    throw new IngestionError(
      "invalid_step",
      "Supply the expected step (0 or 1) and valid context or a draft.",
      400,
    );
  const body = parsed.data;
  const state = await readPreparation(db, actor, id);
  const requestHash = hash(body);
  function replay(saved: PreparationState) {
    if (
      saved.job.current_step > body.expected_step &&
      saved.job.completed_steps[String(body.expected_step)] === requestHash
    )
      return saved;
    throw new IngestionError(
      "step_conflict",
      "The preparation has advanced with different input. Reload its saved state; your changed input was not saved.",
      409,
    );
  }
  if (state.job.current_step > body.expected_step) return replay(state);
  let draft;
  let result = state.job.partial_results;
  if (body.expected_step === 1) {
    if (
      actor.role !== "teacher" &&
      (state.job.class_id || body.draft !== undefined)
    )
      throw new IngestionError(
        "draft_forbidden",
        "Only a teacher can import drafts or prepare class lessons.",
        403,
      );
    if (body.draft !== undefined)
      draft = validateDraft(body.draft, state.job, actor);
  } else {
    if (body.draft !== undefined)
      throw new IngestionError(
        "invalid_step",
        "Clarify the saved source before importing a draft.",
        400,
      );
    result = clarify(
      result.extraction,
      body.context ?? result.context,
      actor.grade,
    );
  }
  const claimed = await db.rpc("claim_preparation", {
    p_owner: actor.id,
    p_job: id,
    p_step: body.expected_step,
  });
  if (claimed.error) {
    if (claimed.error.message.includes("step_conflict"))
      return replay(await readPreparation(db, actor, id));
    databaseFailure(claimed.error);
  }
  const token = claimed.data.lease_token;
  try {
    if (body.expected_step === 1 && body.draft === undefined) {
      draft = await generate(db, actor, state.job);
      // Generated private practice is source-grounded, never teacher-approved.
      if (
        !state.job.class_id &&
        actor.role === "learner" &&
        !draft.illustrative_only &&
        result.extraction.source_role === "evidence" &&
        draft.references.length > 0 &&
        draft.objectives.every(
          (objective) =>
            !objective.unresolved_issues.length &&
            objective.reference_ids.length > 0 &&
            objective.misconceptions.every(
              (item) => item.reference_ids.length > 0,
            ),
        )
      ) {
        draft.references.forEach((reference) => {
          reference.status = "source_checked";
        });
        result = { ...result, private_ready: true } as typeof result;
      }
    }
    const finished = await db.rpc("finish_preparation", {
      p_owner: actor.id,
      p_job: id,
      p_token: token,
      p_result: result,
      p_lesson: draft ?? null,
      p_content_hash: draft ? hash(draft) : null,
      p_request_hash: requestHash,
    });
    if (finished.error) databaseFailure(finished.error);
    return await readPreparation(db, actor, id);
  } catch (error) {
    // Fenced failure cannot overwrite a newer worker's result; ambiguous commit is reread on retry.
    await db.rpc("fail_preparation", {
      p_owner: actor.id,
      p_job: id,
      p_token: token,
    });
    throw error;
  }
}
