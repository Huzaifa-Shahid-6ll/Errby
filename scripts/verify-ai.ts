import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createAdminClient } from "../src/lib/db/admin";
import { operate } from "./operations";
import { clarify, extractText } from "../src/lib/ingestion/server";
import {
  createPreparation,
  advancePreparation,
  readPreparation,
} from "../src/lib/preparations/service";
import {
  evaluateAnswer,
  EVALUATION_PROMPT_VERSION,
} from "../src/lib/ai/evaluate";
import { answerExamples } from "../src/lib/lessons/answer-examples";
import { exampleLessons } from "../src/lib/lessons/examples";
import {
  openSession,
  submitTurn,
  getSession,
} from "../src/lib/sessions/service";
import { processSession } from "../src/lib/sessions/process";

// Explicit real-provider synthetic acceptance; never part of npm test.
assert.equal(process.env.ERRBY_OPERATOR_CONFIRM, "synthetic-test-project");
assert.equal(process.env.ERRBY_MODE, "live");
const owner = process.env.HACKATHON_LEARNER_ID;
assert(owner);
const db = createAdminClient();
const actor = { id: owner, role: "learner" as const, grade: "middle_school" };
const artifact = ".env.ai-verification.json"; // Ignored: synthetic test IDs and model outputs.
const saved = existsSync(artifact)
  ? JSON.parse(readFileSync(artifact, "utf8"))
  : { run: randomUUID(), cases: [] };
const persist = () => writeFileSync(artifact, JSON.stringify(saved, null, 2));
persist();
try {
  await operate(
    db,
    { action: "budget", capUsd: 1, maxCallUsd: 0.03, enabled: true },
    true,
  );
  if (process.argv.includes("--corpus")) {
    for (const item of answerExamples) {
      if (
        saved.cases.some(
          (c: { id: string; promptVersion?: string }) =>
            c.id === item.id && c.promptVersion === EVALUATION_PROMPT_VERSION,
        )
      )
        continue;
      const lesson = exampleLessons.find((l) => l.id === item.lesson_id)!;
      const result = await evaluateAnswer({
        db,
        ownerId: owner,
        messageId: `${saved.run}:${item.id}`,
        lesson,
        learnerAnswer: item.learner_answer,
        precedingCorrection:
          item.learner_answer === item.preceding_message
            ? item.preceding_message
            : undefined,
        conversation: [{ role: "errby", text: item.preceding_message }],
      });
      const assessment = result.decision.assessments.find(
        (a) => a.objective_id === item.objective_id,
      );
      saved.cases.push({
        id: item.id,
        promptVersion: EVALUATION_PROMPT_VERSION,
        expected: item.expected_verdict,
        observed: assessment?.verdict,
        independent: assessment?.independent,
        expectedIndependent: item.independent_evidence,
        decision: result.decision,
        match:
          assessment?.verdict === item.expected_verdict &&
          assessment?.independent === item.independent_evidence,
      });
      persist();
      console.log(
        item.id,
        assessment?.verdict,
        assessment?.verdict === item.expected_verdict ? "match" : "MISMATCH",
      );
    }
    const current = saved.cases.filter(
      (c: { promptVersion?: string }) =>
        c.promptVersion === EVALUATION_PROMPT_VERSION,
    );
    assert.equal(current.length, answerExamples.length);
    assert(
      current.every((c: { match: boolean }) => c.match),
      "Observed model judgments differ from the candidate corpus; inspect the saved report",
    );
  } else {
    if (!saved.job) {
      const source = extractText(
        "Synthetic practice source for adult software testing. Heat transfers from a warmer object to a cooler object. In a warm room, energy transfers from the room into colder ice. Insulation slows heat transfer; it does not create cold. A wrapped ice cube melts more slowly because less energy reaches it each second. During melting of pure ice at constant pressure, added energy changes solid ice into liquid water while its temperature stays constant until all the ice melts.",
        "text",
      );
      const result = clarify(source, {
        subject: "Science",
        grade: "middle_school",
        scope:
          "Synthetic adult test: explain heat direction, insulation and melting",
      });
      saved.job = (
        await createPreparation(db, actor, randomUUID(), null, result)
      ).id;
      persist();
    }
    let state = await readPreparation(db, actor, saved.job);
    if (state.job.current_step === 0)
      state = await advancePreparation(db, actor, saved.job, {
        expected_step: 0,
      });
    if (state.job.current_step === 1)
      state = await advancePreparation(db, actor, saved.job, {
        expected_step: 1,
      });
    assert.equal(state.review_status, "private_ready");
    assert.equal(state.lesson?.teacher_review.status, "pending");
    saved.lesson = state.lesson;
    saved.version = state.job.partial_results.lesson_version_id;
    persist();
    console.log(
      "Real generated private lesson saved; human review remains pending.",
    );
    if (!saved.session) {
      saved.session = (
        await openSession(db, actor, { lesson_version_id: saved.version })
      ).session.id;
      persist();
    }
    let session = await getSession(db, actor, saved.session);
    if (session.session.last_sequence === 0) {
      await submitTurn(db, actor, saved.session, {
        idempotency_key: randomUUID(),
        expected_sequence: 0,
        text: "A warmer room passes energy into the cooler ice. An insulating wrapper slows that transfer, so the cube takes longer to melt; it does not make cold. When pure ice melts at fixed pressure, incoming energy changes the solid into liquid instead of raising its temperature until melting finishes.",
      });
    }
    if (session.session.status !== "completed")
      session = await processSession(db, actor, saved.session);
    saved.sessionState = session;
    persist();
    assert(!session.processing_error, session.processing_error?.code);
    assert.equal(
      session.session.status,
      "completed",
      "Independent complete explanation must complete required objectives",
    );
    console.log(
      "Real AI evaluation persisted, all required objectives completed.",
    );
  }
  const usage = await operate(db, { action: "status" }, false);
  saved.usage = usage;
  persist();
  console.log("Budget status:", JSON.stringify(usage));
} catch (error) {
  console.error(
    "Synthetic AI check failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
}
