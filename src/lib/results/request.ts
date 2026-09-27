import "server-only";
import { z } from "zod";
import { env } from "@/lib/env/server";
import { getIdentity } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/db/admin";
import { isSameOrigin } from "@/lib/http/origin";
import { boundedJson } from "@/lib/preparations/request";

const activity = z
  .object({
    event_id: z.uuid(),
    milliseconds: z.number().int().min(0).max(15000),
  })
  .strict();
const verdict = z.enum([
  "correct",
  "partial",
  "incorrect",
  "unverified",
  "off_topic",
]);
const revision = z
  .object({
    expected_verdict: verdict,
    verdict,
    reason: z.string().trim().min(10).max(2000),
  })
  .strict();

export async function resultMutation(
  request: Request,
  id: string,
  kind: "activity" | "revision",
) {
  const headers = { "Cache-Control": "no-store" };
  try {
    if (!isSameOrigin(request))
      return Response.json(
        { message: "Submit from Errby." },
        { status: 403, headers },
      );
    if (env.ERRBY_MODE !== "live")
      return Response.json(
        { message: "Live setup is required." },
        { status: 503, headers },
      );
    const identity = await getIdentity();
    if (!identity)
      return Response.json(
        { message: "Sign in first." },
        { status: 401, headers },
      );
    if (identity.profile.role !== (kind === "activity" ? "learner" : "teacher"))
      return Response.json(
        { message: "This action is unavailable." },
        { status: 403, headers },
      );
    if (
      !z.uuid().safeParse(id).success ||
      !request.headers.get("content-type")?.startsWith("application/json")
    )
      return Response.json(
        { message: "Invalid request." },
        { status: 400, headers },
      );
    const body = await boundedJson(request);
    const db = createAdminClient();
    if (kind === "activity") {
      const parsed = activity.safeParse(body);
      if (!parsed.success)
        return Response.json(
          { message: "Invalid activity interval." },
          { status: 400, headers },
        );
      const result = await db.rpc("record_learning_activity", {
        p_learner: identity.user.id,
        p_session_id: id,
        p_event_id: parsed.data.event_id,
        p_ms: parsed.data.milliseconds,
      });
      if (result.error)
        return Response.json(
          { message: "Activity was not recorded." },
          { status: 409, headers },
        );
      return Response.json({ accepted_ms: result.data }, { headers });
    }
    const parsed = revision.safeParse(body);
    if (!parsed.success)
      return Response.json(
        {
          message: "Choose a verdict and give a reason of 10–2,000 characters.",
        },
        { status: 400, headers },
      );
    const result = await db.rpc("revise_learning_assessment", {
      p_teacher: identity.user.id,
      p_evaluation: id,
      p_expected_verdict: parsed.data.expected_verdict,
      p_verdict: parsed.data.verdict,
      p_reason: parsed.data.reason,
    });
    if (result.error)
      return Response.json(
        {
          message:
            "Review was not saved. Reload the latest result. Correct verdicts require existing independent learner evidence and checked references.",
        },
        { status: 409, headers },
      );
    return Response.json({ status: result.data }, { headers });
  } catch {
    return Response.json(
      { message: "Request could not be saved. Retry from the current result." },
      { status: 400, headers },
    );
  }
}
