# Errby development

- Read `docs/SETUP_STATUS.md` first, then relevant documents in `docs/specification/`.
- The current user authorises foundation setup; historical "do not implement yet" refers to the earlier discovery task.
- `docs/Errby-Colour-and-Screen-Guide.md` and `docs/visual-design/palette-tokens.json` supersede the old palette. Images/briefs never add product features.
- Use npm and the existing lockfile. Windows commands must work in PowerShell.
- Use Context7 current official documentation for framework, API, SDK and CLI work: resolve the library ID, then query the relevant docs.
- Keep auth, database, ingestion and AI calls in server-only modules. Never put service/model credentials in `NEXT_PUBLIC_` variables.
- Demo fixtures stay visibly fictional and unreviewed. Never fabricate grading, persistence or integration success.
- No paid calls until authorised cost reservations and caps exist. No real pupil data in development.
- All required objectives need valid learner evidence; uncertainty never completes a lesson. Teacher access is class-scoped; private sessions stay private.
- Run relevant checks and update setup status honestly. Do not commit, push or deploy without instructions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
