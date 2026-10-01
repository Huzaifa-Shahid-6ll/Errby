# Source ingestion and lesson preparation

> **Current student flow — 1 October 2026:** Attach PDF/DOCX (4 MiB maximum) or paste notes in chat. Validated originals save privately to Supabase Storage, with full bounded extraction/metadata in Postgres and a 20-document owner quota. Learners can reuse/download/remove originals. Sending a complete document preserves server-recorded PDF page/DOCX section provenance; edited excerpts are explicitly notes without original page claims. Exact saved references are available in the conversation's Sources dialog. Originals persist until removal/account deletion; immutable lesson excerpts remain until account deletion. The new documents migration and actual hosted Storage acceptance are required before claiming live operation. Extracted text retains its bounded private 60-second cache. Notes remain unreviewed, and insufficient evidence cannot complete practice. Teacher publishing and class preparation below are historical and excluded. See [storage/caching details](../implementation/STORAGE_AND_CACHING.md).

## Input support contract
| Input | MVP behaviour | Recovery |
| --- | --- | --- |
| Topic / pasted text | Fully supported; infer scope then ask missing level/objectives | Keep input; ask concise clarifications |
| Text-based PDF | Extract text with page markers; show sample and coverage | Empty/scanned/encrypted → request readable text/PDF |
| DOCX | Extract text/headings; preserve source section identifiers | Unsupported/corrupt → paste text or PDF |
| Public webpage | Fetch only through bounded safe server adapter if available | Blocked/paywalled/script-only → paste permitted excerpt |
| YouTube link | Record URL; import an accessible authorised transcript if the adapter succeeds | If unavailable, ask for pasted transcript. Never imply the video was watched |
| Images / scans / PPTX / audio | Not guaranteed in MVP | Convert to supported format; no silent acceptance |

The original user requested YouTube/resource entry. The UI must accept those links and explain whether content was imported or requires text. Day 2 prototype must determine whether automatic transcripts are reliable; if not, label transcript-assisted support in the README and demo. Do not add brittle scraping to claim universal support.

## Sparse school input
If given only “Grade 7: heat, cells, fractions,” ask for curriculum level/desired depth if unclear. Draft a compact map of lessons and objectives. Mark explanation content Generated draft and source outline as Scope source, not Evidence source. Attach genuine reference content when available; never invent URLs or page citations.
Teacher can revise objectives and factual content, review flagged areas and publish selected lessons. Minimal input does not eliminate the content-review step. The school can start with one topic.

## Preparation pipeline
1. Validate type/size and ownership. Scan metadata for accidental personal information.
2. Extract text with location markers. Expose real missing sections.
3. Collect missing subject, grade and scope in at most three short questions together.
4. Split curriculum into lesson titles. Create detailed drafts only for selected units.
5. Build bounded objectives, answer references, misconception/correction pairs and opening question.
6. Check internal contradictions, provenance coverage and unsupported assertions.
7. Teacher reviews school drafts; solo learners see scope and uncertainty, not an implied expert endorsement.
8. Publish immutable version. Record source hashes so repeated preparation can reuse unchanged content.

## Grounding policy
Retrieved text can itself be wrong. An evaluator should flag conflicting authoritative material, not mechanically agree with an uploaded answer. Source references describe where content came from, not proof of truth. Teacher-provided corrections are audited. If no sufficient reference exists, generate a draft but mark the relevant goals unverified until reviewed; do not confidently grade student content against an unsupported generated answer.

## Safe fetch and parsing
Only HTTPS public URLs, deny loopback/private/link-local/metadata hosts and non-HTTP schemes; verify DNS/redirect targets, limit redirects, bytes and time. No fetching from logged-in accounts, bypassing access controls or executing document scripts. Treat embedded instructions as untrusted lesson data, not system prompts. Sanitise displayed HTML; escape student/model output.
Private source files use scoped signed URLs when needed. Original upload contents never enter public GitHub. Keep extraction/parser versions with source records.

## Quotas and review UX
Show actual accepted limits before submission. Preserve typed context on failure. A teacher reviewing a curriculum can publish one good lesson while leaving others as drafts. Never mark all generated lessons approved by a bulk checkbox without exposing their review status. External processing costs and latency are measured during development.
