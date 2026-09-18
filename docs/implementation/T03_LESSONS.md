# T03 — lesson contract and example pack

Implemented 18 September 2026. Source and technical review completed by the coding agent; **teacher/lead content approval is pending**. This distinction is part of the data, not just this document. T03's human-reviewed-pack acceptance remains open. No lesson was published, no pupil was graded, and no learning-effect claim is made.

## Files and contract

- `src/lib/lessons/schema.ts`: strict Zod 4 lesson, source-reference and publication-readiness validation; exported inferred types. Pure validation contains no provider, database or browser calls.
- `src/lib/lessons/examples.ts`: two visibly synthetic generated drafts, heat transfer and equivalent fractions, each with three required objectives, acceptable explanation examples, essential facts, criteria, correction criteria, misconception resolutions, source references and changed-example questions.
- `src/lib/lessons/answer-examples.ts`: 24 AI-authored, human-unreviewed fictional answer cases for later human review and T09 evaluation. Eight incorrect/false-agreement cases, four unsupported/uncertain cases, two copied corrections, plus correct explanations and partial answers. Expected verdicts are specifications, never observed model results.
- `tests/lessons.test.ts`: runnable structural, reference-integrity, missing-evidence and publication-gate regression checks.

Schema `1.1` intentionally does not reinterpret the supplied `1.0` illustration as verified content. `src/lib/lessons/demo.ts` and `docs/specification/EXAMPLE_LESSON.json` are unchanged.

The current bounded contract accepts 1–5 objectives, 20 sources, 100 references, up to five misconceptions per objective and 2,000 characters per statement. Three to five objectives are recommended for a compact lesson; a smaller valid lesson is allowed, including after a future audited teacher revision removes invalid objectives. Larger topics require separate lessons. Required flags need at least one required objective. Empty criteria and duplicate source, reference, objective or misconception IDs fail validation. Unknown reference/source IDs and correction references outside their objective fail validation.

References retain their own ID, originating source ID, positive page/paragraph number or named section, text, excerpt-versus-summary label, evidence-versus-scope purpose and explicit status. An outline cannot act as answer evidence. URLs are provenance metadata only: validating an HTTPS URL does not authorize fetching it or establish that it is public. Any future fetch adapter must apply the separate SSRF protections in SOURCE_INGESTION.md.

Sparse drafts may contain no explanatory sources or references, but each unsupported objective/correction must carry an explicit unresolved issue. This permits an honest generated draft without invented citations. Such drafts cannot pass publication readiness. Extracted text starts `unverified`; extraction success is never content approval.

## Review and publication boundary

`source_checked` means a technical source check, not a teacher endorsement or certainty about all possible learner claims. All bundled source text is labelled `summary`, not falsely presented as a verbatim extract. Facts are limited to the cited sections; application questions and learner answers are newly written fictional examples.

`publicationReadyLessonSchema` rejects illustrative fixtures, pending review, missing/unverified/conflicting objective or correction evidence and unresolved content issues. Approval metadata must contain a reviewer UUID, timestamp and matching lesson version. The gate checks all included objectives, including optional ones, so unsupported optional content cannot become an approved misconception pool.

**Schema validation does not authenticate review metadata.** T05/T14 server publication handlers must load trusted review records, verify the current teacher's ownership/class scope, bind approval to unchanged content, reset review after edits, persist an immutable version and audit approval. Passing a forged JSON object to this pure schema is not permission to publish. No publish API or review UI is added in T03.

Semantic checks such as whether an opening question is genuinely open, factual consistency and pedagogical suitability require content review; the schema cannot establish them. Actual review performed on the bundled pack checked the six objective-to-reference mappings, six misconception/correction pairs, genuine opening questions and changed-example prompts. The heat lesson bounds the temperature plateau to an idealised pure-water phase change at fixed normal pressure. The fraction lesson keeps the whole fixed and requires equal parts and nonzero common factors. Human suitability and answer-key review remain pending.

## Sources checked

Opened and inspected on 18 September 2026:

| Reference             | Source location and use                                                                                                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `heat-direction-ref`  | [US Department of Energy, Heating & Cooling](https://www.energy.gov/topics/heating-cooling), opening paragraph: warmer-to-cooler transfer.                                                                                                                  |
| `melting-ref`         | [OpenStax, College Physics 2e §14.3](https://openstax.org/books/college-physics-2e/pages/14-3-phase-change-and-latent-heat), opening discussion and Figure 14.8: phase change and bounded temperature plateau. Authors Paul Peter Urone and Roger Hinrichs. |
| `insulation-ref`      | [US Department of Energy, Types of Insulation](https://bsesc.energy.gov/energy-basics/types-insulation), “How?” section: insulation slows transfer. Container and drink examples are applications written for this pack.                                    |
| `equal-parts-ref`     | [OpenStax, Prealgebra 2e §4.1](https://openstax.org/books/prealgebra-2e/pages/4-1-visualize-fractions), “Understand the Meaning of Fractions” and “Model Equivalent Fractions”. Authors Lynn Marecek, MaryAnne Anthony-Smith and Andrea Honeycutt Mathis.   |
| `equivalent-rule-ref` | [OpenStax, Prealgebra 2e §4.2](https://openstax.org/books/prealgebra-2e/pages/4-2-multiply-and-divide-fractions), “Equivalent Fractions Property” and “Simplified Fraction”.                                                                                |

Only brief original factual summaries and attribution links are included; no textbook, source screenshots or external source files were imported. No source content was sent to a runtime model or used for training. Future bulk source ingestion must check the source's current usage terms separately.

## Research and documentation used

Used the Context7 skill: resolved Zod to `/colinhacks/zod`, then queried current documentation for strict objects, discriminated unions and `superRefine` issue paths. Implementation follows [Zod's API documentation](https://zod.dev/api). Read the installed Next.js `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md` before coding; no server action or framework API was needed for this pure module.

Consensus search was followed by fetching the full indexed record for [Cognitive anatomy of tutor learning: Lessons learned with SimStudent](https://consensus.app/papers/cognitive-anatomy-of-tutor-learning-lessons-learned-with-matsuda-yarzebinski/d26299c45a345f459b59da91be1f850c/?utm_source=chatgpt) [1]. Its abstract supports treating explanation quality, feedback accuracy and tutoring support as design concerns. This informed keeping relationship-based criteria and correction/application prompts; it does not validate Errby's model or prove its learning outcomes [1]. Only the indexed abstract/metadata were available here; no full-paper methodological review is claimed.

[1] Noboru Matsuda, Evelyn Yarzebinski, Victoria Keiser, Rohan Raizada, William W. Cohen, Gabriel J. Stylianides and Kenneth R. Koedinger (2013), _Journal of Educational Psychology_ 105, 1152–1163. [DOI: 10.1037/a0031955](https://doi.org/10.1037/a0031955). Consensus citation count at retrieval: 84.

## Verification and handoff

`npx tsx --test tests/lessons.test.ts`: **six tests passed**, including acceptance of a single supported objective and rejection of zero objectives. These check data/validation, not factual truth, authenticated publication or model judgments. Targeted ESLint and `npx tsc --noEmit` passed before the final objective-minimum correction; the targeted tests and formatting were rerun after it. Prettier checked all five owned files successfully. Formatting applied only to owned files. No Docker operations, paid model requests, credentials, real pupil data, commits or deployments were used by this subtask.

Teacher/lead review should check all 24 expected judgments and all six objective criteria against the sources, adapt depth to the chosen class and record actual identity/time when approving a new non-illustrative lesson. Correct copied wording remains factually correct but never independent completion evidence; assisted-versus-independent scoring also needs the real session history in T09–T11. Expected `unverified` examples cannot be counted as correct or incorrect merely by model confidence. T09 still owns executing the reviewed corpus against a configured evaluator and recording prompt/model/version/results.

T04 consumes source identity and location conventions only. T05 owns job/version persistence and hashes. T07 owns session opening; T09–T11 own evaluation, authorized misconception selection and evidence-based completion. No G1–G5 checkpoint is claimed.
