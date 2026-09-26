# T16 DOCX and resource links — 26 September 2026

Signed-in live users can upload one DOCX (10 MiB, 50 nonempty paragraph sections, 30,000 characters). The server validates MIME and ZIP signature, parses with Mammoth in a bounded worker, and returns numbered sections, hash, parser version, sample and review warning. Images, layout and table reading order require comparison with the original. Corrupt, empty, oversized and timed-out files return recovery guidance; no source is silently truncated.

Resource entry requires an HTTPS URL plus permitted pasted webpage text or video transcript. Errby records the URL with the pasted extraction. It does not fetch the page or watch a video; a URL without text returns a paste fallback. Links are context and never proof of content accuracy.

`npm run test:ingestion`, `npm run typecheck` and `npm run build` passed locally. Hosted Supabase Auth, Storage and persistence remain unverified. No paid calls or real pupil data were used.
