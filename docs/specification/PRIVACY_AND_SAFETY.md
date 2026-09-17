# Privacy, minors and correctness
This is an engineering plan, not a legal compliance certification. No real child data has been processed by this documentation task.

## Provider gate relevant to the intended school audience
OpenAI's guidance says not to process personal data of children under 13 or the applicable digital-consent age without first implementing API zero data retention. Account eligibility/settings must be confirmed before such a trial; a pseudonym alone does not ensure free-form text lacks personal data. A store:false request is not a substitute for approved retention controls. [Official under-18 guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance), [data controls](https://developers.openai.com/api/docs/guides/your-data).

The Gemini Developer API terms prohibit API clients directed toward or likely accessed by under-18s. Do not select its free tier for this school-facing product. [Official terms](https://ai.google.dev/gemini-api/terms).

Plan the judge demonstration with synthetic accounts and adult/teacher roleplay until the actual deployment has the necessary provider configuration and school process. This preserves the product's intended younger audience without falsely declaring live deployment ready. Applicable consent and school responsibilities require local review when jurisdiction and pilot ages are known.

## Minimal identity
Collect alias, account ID, grade band and class membership. Do not require full legal name, date of birth, phone, home address or child email. Teacher keeps any real-name roster mapping outside the MVP if needed. Provider inputs omit aliases and auth IDs. Explain teacher visibility before a class session.

## Data lifecycle defaults for review
Original uploaded files delete after extraction plus a short retry window (proposed 7 days), unless still needed and explicitly retained. Source excerpts persist with active lessons. Raw learner conversations expire after 30 days; lesson summaries after 90 days; teacher can request earlier deletion. These defaults are recommendations, not established school policy. Deleting a learner cascades to private messages/evidence and private files. Removing class membership revokes access immediately; retention/deletion outcome is visible.

## Access and disclosure
Private sources and records only. RLS plus endpoint authorisation. No public class rosters or indexed session URLs. Join code is an invitation mechanism, never proof of identity. Teacher sees only assigned school-session summaries and necessary excerpts; no private-topic transcripts. The user has not asked for hidden surveillance or attention tracking.

## Prompt/content safety
Treat learner input, uploads and links as untrusted. Never execute embedded instructions or let them alter evaluation rules. Prevent arbitrary internal URL fetches and rendering of raw HTML. Do not teach dangerous procedures or provide personal medical/legal guidance under “any topic.” Offer age-appropriate topic redirection and teacher support.
Errby must be clearly an AI character. Do not pressure children to stay, maintain streaks, disclose secrets or form exclusive emotional attachments.

## Supervisor truthfulness
Intentional misconceptions are bounded teaching material. When a misconception is accepted, correct after the submission. Uncertainty is recorded and explained, not disguised by changing speaker. The supervisor cannot guarantee truth by virtue of being a separate agent. Show references and escalation when available.
Session exit must not leave a deliberate error presented as the final authoritative answer. If a learner exits mid-misconception, show a concise correction in the partial recap, without awarding credit.

## Logging and security
No keys, raw source documents or child chats in public repository. General logs use IDs/error categories, not full prompt payloads. Teacher activity and assessment revisions are auditable. Rate-limit anonymous surfaces and code guessing. Delete test data after the event. Public demo has synthetic records and controlled quotas; judge accounts cannot see pilot data.
