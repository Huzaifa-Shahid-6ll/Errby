# T04 — text/PDF extraction and topic clarification

Implemented 18 September 2026. This is the extraction and clarification step, not a persisted preparation job or lesson generator. T05 owns subsequent preparation work.

## User flow

`/prepare` accepts a topic/curriculum outline, pasted reference text, a fixed fictional PDF example, and (after verified sign-in in live mode) a text PDF. `/prepare/extract` returns an extraction result and up to three questions together for missing subject, level and scope. A supplied level takes precedence; otherwise the verified profile grade is reused, followed by an explicit “Grade N”/“Year N” in the source. A topic outline is labelled **Scope source**, never evidence for factual assessment. Supplying all context yields `extracted_needs_review`, not a reviewed/ready lesson.

The demo genuinely parses a generated two-page PDF once per Node process and labels it fictional/unreviewed. It accepts fictional pasted text, but rejects arbitrary PDF uploads on the server. The live route verifies the Auth user and application profile before consuming the request body. Sources are processed in memory and returned only in that request; no upload, source record, lesson, job or durable save is fabricated. Responses are `Cache-Control: no-store`.

Successful extraction exposes a first-1,000-character sample and all extracted text. PDFs preserve one-based page markers, including pages with no text. Coverage counts pages with extractable text; it does not claim all information on those pages was recovered. Missing-page text makes the result `partial`; scanned/empty PDFs receive a readable-text fallback. Reading order, tables, symbols, charts and images require checking against the original.

## Limits and trust boundaries

- One PDF, at most 10 MiB, 50 pages and 30,000 extracted characters. Pasted text also has a 30,000-character bound. Oversized input fails without truncation. Subject/grade are each capped at 100 characters and scope at 1,000.
- Same-origin POST, verified live identity, multipart field allowlist, duplicate-field denial, exact PDF MIME and `%PDF-N.N` signature checks. Actual streamed request bytes are counted even when Content-Length is missing or false. The live multipart envelope allows 150,000 bytes of bounded field/encoding overhead; demo requests are capped at 150,000 bytes total.
- Request reading and PDF work each have a 15-second deadline. PDF.js runs in a terminable Node worker with a 128 MiB JavaScript old-generation heap limit and 4 MiB stack. This is **not a total process/RSS/native-memory sandbox**. Byte/page/character limits and a single active parser per process further bound work. Global cross-instance admission remains deployment work.
- PDF.js receives bytes only: no document URL fetching, script execution, XFA rendering, OCR or model calls. Text is rendered through ordinary escaped React content. Embedded instructions remain untrusted source text.
- Password-encrypted PDFs, including documents reporting encryption permissions, are rejected. Empty/blank/scanned, corrupt, wrong-type, excessive-page/character and timed-out input return stable error codes and clear recovery instructions. Busy parser returns 429. Unexpected service/auth failures return a generic 503 without stack traces.
- PDF metadata is conservatively checked for author/creator/contact-like information and may produce a privacy warning. This is a heuristic reminder, not comprehensive personal-data detection or sanitisation. Metadata itself is not returned or logged by this feature.

The worker is terminated before admission is released. The anonymous PDF sample cannot supply arbitrary bytes and its successful extraction is cached per process. The worker heap limit cannot guarantee survival from every native allocation or runtime fault; hosted isolation and resource monitoring must be validated before deployment.

## Input preservation and accessibility

An ordinary client form submits multipart data through `fetch`. Recoverable server/network failures leave typed text, context and the selected file in the open page; there is no form reset. Changing input clears stale results. Inputs are labelled, submission disables the fieldset during the request, error messages are announced, and a short live-region message announces success/partial extraction and the number of clarification questions. The full extracted document is not forced through the live region.

There is deliberately no browser persistence for private source content. Refresh/navigation loses this unsaved step, which is stated next to the form. Durable/resumable preparation is T05. Links receive an honest paste-text/transcript fallback; no webpage/video import or “watched video” claim exists. DOCX, images, scans, PPTX and audio remain unsupported here.

## Integration contract

`src/lib/ingestion/contracts.ts` exposes `Extraction`, `PreparationResult` and accepted limits. Extraction includes kind, scope/evidence role, unreviewed provenance, SHA-256 source hash, parser/version, pages, combined text, sample, coverage and warnings. The PDF hash covers original bytes; text hashes cover trimmed accepted text. These identify input, not truth or approval.

T03 lesson references are intentionally separate. Future preparation chooses bounded excerpts from these source pages and records their actual page locations; an entire long page must not be forced into a 2,000-character lesson reference. Neither extracted evidence nor fictional examples acquire `source_checked` status automatically.

`pdfjs-dist` is pinned at 6.3.289. The native worker resolves its module path itself, outside Turbopack: bundler-transformed `require.resolve` can yield a module ID instead of a filesystem path. `next.config.ts` explicitly traces `pdf.mjs`, `pdf.worker.mjs` and package metadata for `/prepare/extract`; the parser runs only with Node runtime. Rendering is unused. A hosted deployment must verify packaging and its own request ceiling: the app's local 10 MiB cap does not override a provider's smaller upload limit. No deployment/Storage workaround is claimed implemented.

The origin guard compares a canonical HTTP(S) Origin with the actual Host and the request protocol, because Next may construct `Request.url` using an internal hostname. It does not trust `X-Forwarded-Host`. `/prepare/:path*` participates in the existing Auth refresh proxy so refreshed cookies can be persisted; actual hosted refresh remains unverified without credentials.

Next Proxy automatically clones/buffers request bodies before the route runs. `experimental.proxyClientMaxBodySize` matches the application's live envelope (10 MiB plus 150,000 bytes) so a valid maximum-size PDF is not truncated by the default 10 MB framework cap. The limit is per request, not global. Authentication-before-body-consumption means the application handler verifies identity before reading/parsing; it does not mean the framework has received or buffered no bytes. Above the framework cap, Next can pass a partial body; application size validation or malformed-multipart recovery must still fail safely.

## Verification

`npm run test:ingestion` passes six runnable checks using generated fictional PDFs and direct handler invocations:

1. Text bounds, scope-only topics, at most three clarification questions, explicit/profile/source grade precedence, and unresolved review status.
2. Actual PDF.js extraction with exact page text/hash and honest partial coverage.
3. MIME/signature/empty/blank/corrupt/encrypted/byte/page/character recovery.
4. Real worker termination at a controlled deadline, concurrent admission denial and successful extraction afterwards.
5. Cross-origin denial, live authentication before body consumption, arbitrary-demo-upload denial, duplicate fields, profile-grade reuse and no-store responses.
6. Actual request-byte accounting despite false Content-Length, malformed multipart recovery and successful fixed-demo PDF extraction.

`tests/browser/preparation.spec.ts` covers sparse-topic clarification, inferred grade reuse, preserved input after an aborted request, genuine fictional-PDF page markers/coverage, stale-result clearing and viewport overflow. Parent integration verification records the production build, browser runs and DevTools review in `docs/SETUP_STATUS.md`; those outcomes are not inferred from the unit suite.

Hosted Auth/session verification and authenticated real-host upload integration remain unverified without configured non-local credentials. Direct handler tests inject identity; they are not provider/JWT acceptance tests. No Docker, paid call, real pupil material or cloud resource was used.

## Documentation consulted

- Context7 resolve then query: `/mozilla/pdfjs-dist`, `/vercel/next.js`, `/reactjs/react.dev`.
- [Mozilla PDF.js API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html) and [official Node example](https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs).
- Installed Next 16.3.5 guides: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` and `01-app/03-api-reference/05-config/01-next-config-js/serverExternalPackages.md`.
- Installed Next `01-app/03-api-reference/05-config/01-next-config-js/proxyClientMaxBodySize.md`, also queried through Context7, for the Proxy body-buffering cap.
- [React input/FormData guidance](https://react.dev/reference/react-dom/components/input).

Framework and parser documentation informed implementation. No academic claim about learning effectiveness is introduced by this task.
