import "server-only";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";
import { IngestionError } from "@/lib/ingestion/server";
import { boundedJson } from "@/lib/preparations/request";
import {
  readPreparation,
  validateDraft,
  uuid,
} from "@/lib/preparations/service";
import { publicationReadyLessonSchema } from "./schema";
import { isSameOrigin } from "@/lib/http/origin";

export async function reviewRequest(request: Request, id: string) {
  const headers = { "Cache-Control": "no-store" };
  try {
    if (!isSameOrigin(request))
      throw new IngestionError("forbidden_origin", "Submit from Errby.", 403);
    if (env.ERRBY_MODE !== "live")
      throw new IngestionError(
        "live_setup_required",
        "Teacher review needs live hosted setup.",
        503,
      );
    const identity = await getIdentity();
    if (!identity)
      throw new IngestionError("unauthenticated", "Sign in first.", 401);
    if (identity.profile.role !== "teacher")
      throw new IngestionError(
        "forbidden",
        "Only a teacher can review lessons.",
        403,
      );
    if (
      !uuid.safeParse(id).success ||
      !request.headers.get("content-type")?.startsWith("application/json")
    )
      throw new IngestionError(
        "invalid_request",
        "Use a saved preparation and JSON request.",
        400,
      );
    const body = (await boundedJson(request)) as {
      action?: unknown;
      expected_version_id?: unknown;
      lesson?: unknown;
    };
    if (
      !body ||
      !["edit", "review", "publish"].includes(String(body.action)) ||
      !uuid.safeParse(body.expected_version_id).success
    )
      throw new IngestionError(
        "invalid_request",
        "Choose edit, review or publish with the current version.",
        400,
      );
    const db = createAdminClient();
    const actor = {
      id: identity.user.id,
      role: "teacher" as const,
      grade: identity.profile.grade_band ?? "",
    };
    const state = await readPreparation(db, actor, id);
    const currentId = state.job.partial_results.lesson_version_id;
    if (
      !state.lesson ||
      state.job.current_step !== 2 ||
      !state.job.class_id ||
      currentId !== body.expected_version_id
    )
      throw new IngestionError(
        "stale_lesson",
        "Reload the current class draft before continuing.",
        409,
      );
    let lesson = null;
    if (body.action === "edit") {
      lesson = validateDraft(
        body.lesson,
        state.job,
        actor,
        state.lesson.version + 1,
      );
      if (
        lesson.id !== state.lesson.id ||
        lesson.sources[0].title !== state.lesson.sources[0].title ||
        lesson.illustrative_only !== state.lesson.illustrative_only
      )
        throw new IngestionError(
          "source_mismatch",
          "Keep the saved source and its provenance unchanged.",
          400,
        );
    } else {
      if (body.lesson !== undefined)
        throw new IngestionError(
          "invalid_request",
          "Review the saved version without replacement content.",
          400,
        );
      if (body.action === "review") {
        const candidate = {
          ...state.lesson,
          version: state.lesson.version + 1,
          teacher_review: {
            status: "approved",
            reviewer_id: actor.id,
            reviewed_at: new Date().toISOString(),
            lesson_version: state.lesson.version + 1,
          },
        };
        const readiness = publicationReadyLessonSchema.safeParse(candidate);
        if (!readiness.success)
          throw new IngestionError(
            "review_blocked",
            readiness.error.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join(" "),
            409,
          );
      } else if (state.lesson.teacher_review.status !== "approved")
        throw new IngestionError(
          "review_required",
          "Approve this exact draft before publication.",
          409,
        );
    }
    const result = await db.rpc("advance_lesson_review", {
      p_teacher: actor.id,
      p_job: id,
      p_expected: currentId,
      p_action: body.action,
      p_lesson: lesson,
    });
    if (result.error) {
      if (/stale_lesson|review_unavailable/.test(result.error.message))
        throw new IngestionError(
          "stale_lesson",
          "This draft changed. Reload and review the current version.",
          409,
        );
      throw new IngestionError(
        "review_unavailable",
        "Review is unavailable. Check class ownership and hosted migrations.",
        503,
      );
    }
    return Response.json(await readPreparation(db, actor, id), { headers });
  } catch (error) {
    const failure =
      error instanceof IngestionError
        ? error
        : new IngestionError(
            "review_unavailable",
            "Review is unavailable. Retry after checking the saved draft.",
            503,
          );
    return Response.json(
      { error_code: failure.code, user_message: failure.message },
      { status: failure.status, headers },
    );
  }
}
