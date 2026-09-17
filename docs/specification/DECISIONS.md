# Decisions and authority
## User-confirmed
| ID | Decision |
| --- | --- |
| D01 | Product name: Errby. |
| D02 | Immediate goal: win FirstCommit; roughly 14 days remain. |
| D03 | Three people: user is technical lead, one beginner has some technical ability, one is presently nontechnical. |
| D04 | Responsive website/web app only; no native apps. |
| D05 | Primary/middle school plus serious high-school use; English only. |
| D06 | Broad student topic input, resource-based preparation and school curriculum uploads mapped to selectable lessons. |
| D07 | Assume minimum school material and effort; ask clarifying questions when input is insufficient. |
| D08 | Teacher creates class, uploads and reviews lessons, then shares class code. |
| D09 | Main home activity is an input composer with a sidebar; supplied Lovable images guide the visual direction. |
| D10 | Students teach by typing in MVP. |
| D11 | Begin with a genuine open-ended question. After the learner explains, Errby can ask a mistaken follow-up. |
| D12 | Supervisor appears after a submitted answer if the learner is wrong or endorses Errby's error. Separate UI, colours and identity. |
| D13 | Uncertain correctness triggers supervisor involvement and is recorded. |
| D14 | Complete when all identified required content is correctly explained. |
| D15 | Student analytics include correctness, time and other useful measures. Teacher sees analytics and a concise one-word description beneath each student. |
| D16 | Minimal futuristic aesthetic, soft glow/halo, supplied light/dark references; no requirement for loud themes. |
| D17 | Spend the necessary minimum. No exact budget ceiling was supplied. |
| D18 | Deliver documentation and visual concepts now; do not build the app yet. |

## Recommended implementation defaults
These are concrete design decisions offered for review, not claims that the user explicitly chose them.
- Dark theme first; light tokens prepared, full theme switch only after primary flow works.
- Next.js/TypeScript, Supabase database/auth/private storage and one hosted server application.
- One owner controls deployment; GitHub is the collaboration source.
- First model candidate: GPT-4.1 mini, subject to task evaluation and account/data requirements. Provider is replaceable.
- Pseudonymous authenticated student profiles; distinct teacher accounts. Join code is not a password.
- Default lesson has 3–5 objectives, but objective evidence controls completion, not number of turns.
- A one-word label describes the current lesson's evidence, not the child's ability.
- Learner dashboard metrics distinguish independent success from success after assistance.
- App-level retention proposal: raw conversation 30 days, summaries 90 days, with deletion and no indefinite retention by default.
- Text and text-PDF guaranteed input paths; DOCX supported in planned MVP. Resource links have explicit extraction/fallback behaviour.

## Superseded proposals
Fractions-only content, draggable fraction pieces and voice are not MVP requirements. Errby does not begin with a false claim. School upload cannot be silently postponed. Purely descriptive feedback is superseded by the user's request for analytics, while measurement limitations still apply. Completion by a fixed number of exchanges is rejected.

## Change procedure
Keep requirement IDs stable. A scope cut affecting D06, D08, D12 or D15 requires user discussion; simplify implementation underneath those requirements first. Log rationale, impacted screens/tasks and evidence. Product additions are not automatically authorised by a design mockup.
