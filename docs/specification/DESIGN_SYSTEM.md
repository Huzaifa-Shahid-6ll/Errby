# Design system — proposed direction
The two user-supplied Lovable screenshots are visual references: a thin navigation rail, large central composer, rounded application shell, open space and a broad diffused halo. Adapt that composition for learning; do not copy logos, text, build controls or microphone affordances.

## Visual thesis
A calm futuristic teaching space. Dark graphite surfaces, clear white text, blue/lilac atmosphere around the start area, and a distinct amber supervisor. The child is a capable teacher; the robot is friendly without making the high-school experience childish.

## Proposed tokens
| Token | Dark | Light |
| --- | --- | --- |
| canvas | #151618 | #F7F8FC |
| surface | #222428 | #FFFFFF |
| elevated | #2A2D33 | #EEF1F8 |
| text-primary | #F5F6FA | #171A22 |
| text-secondary | #B7BFCD | #505A6D |
| border | #454B58 | #CBD1DE |
| errby-accent | #B6A2FF | #6848CE |
| supervisor-accent | #F2C46D | #805000 |
| success-text | #8EDDB3 | #176B42 |

Check actual foreground/background contrast during implementation. The token table is not a contrast certification. Glow is background-only, low-opacity, blurred and static by default. Avoid glowing body copy, glass over busy text, excessive shadows or saturated full-screen gradients.

## Type, spacing and shape
Use a readable system sans stack initially; a chosen licensed font can follow without delaying functionality. Body 16–18px; persistent labels at least 14px; headings 28–36px on desktop and 24–28px on small screens. Normal tracking, generous line height, no tight novelty letterforms for lesson text.
Spacing scale 4/8/12/16/24/32/48. Composer radius 24px; surface cards 16px; compact controls 10–12px. Main conversation max width 760px, shell max content width around 1280px. Do not make every message a giant card.

## Three participant treatments
Errby: small robot marker, name label, lavender accent, left-aligned conversational text.
Student: “You” label and neutral surface, right or inset alignment.
Supervisor: shield/check icon, “Supervisor” label, amber left edge and quiet tinted panel, explanatory title, source chip or explicit uncertainty notice. Never rely on colour alone. Animation does not block reading. No red punishment treatment for an ordinary misconception.

## Screen composition
Home: navigation rail; central heading/composer; recent class lessons below. Show clear lesson-start affordance without introductory marketing.
Session: title + objective progress; conversation; sticky input; desktop goals side panel. Halo recedes to margins.
Teacher: same shell with practical roster and lesson review. Data clarity takes priority over atmosphere.
Results: small success emphasis, exact metrics and next action. “Unverified” has neutral amber guidance, not a success tick.

## Responsive and input behaviour
Below approximately 768px, rail collapses into labelled menu; no tooltip-only navigation. Objective rail becomes a disclosure. Composer respects safe area and virtual keyboard. Forms use visible labels. Link/resource mode does not replace typed text unexpectedly.
Keyboard-only use, screen-reader role labels, focus visibility, reduced-motion setting and zoom at 200% are mandatory. Check touch targets, 360px layout and narrow Chromebook viewport.

## Image concepts
Two requested conceptual images: student home and active session with supervisor. Their prompts are documented in UI_CONCEPTS.md. They are inspiration only. No screenshot statistics are genuine student outcomes. Generated mistakes in text or layout do not override these specifications.
