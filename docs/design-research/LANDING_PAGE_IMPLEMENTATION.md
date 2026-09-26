# Landing-page implementation

19 September 2026. The user authorised implementation of the approved concepts, matching light and dark themes, reusable visuals and a complete motion pass. This supersedes the research-only scope of the original 17 September specification. No landing-page commit, push or deployment was requested.

## Delivered surface

`/` renders the public page; `/learn` retains the learning workspace. Existing account and preparation return links and successful sign-in navigation lead to `/learn`. The public page has no model or database call, input form, simulated grading or invented completion. Existing robots metadata remains noindex while the application is a local development project.

The original composition is implemented as selectable, semantic HTML: split hero, four-turn conversation, four-step explanation, separate amber Supervisor, planned teacher workflow, draft example, native FAQ disclosures and closing invitation. CTA and navigation anchors work; a footer link reaches the real learning workspace. The header adds a keyboard-accessible theme control, as explicitly requested.

## Files and ownership

| Area                                      | Files                                                                                                                                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route and page metadata                   | `src/app/page.tsx`                                                                                                                                                                                        |
| Semantic page and responsive styling      | `src/components/landing/landing-page.tsx`, `landing-page.module.css`                                                                                                                                      |
| Theme control and motion                  | `src/components/landing/landing-controls.tsx`, `landing-motion.css`; root theme initialization in `src/app/layout.tsx`                                                                                    |
| Reusable visual assets                    | `public/images/errby-mascot.png`, `learner-avatar.png`; [exact prompts and provenance](LANDING_PAGE_ASSETS.md)                                                                                            |
| Small site icon                           | `src/app/icon.svg`                                                                                                                                                                                        |
| Behavioural checks                        | `tests/browser/landing.spec.ts`                                                                                                                                                                           |
| Extended motion research and verification | [Motion specification](../animation/motion-spec.md), [research](../animation/research.md), [implementation coverage](../animation/implementation-status.md), [verification](../animation/verification.md) |

Three initial sub-agents owned layout, visuals and motion/theme, respectively. The parent integrated routing and testing. A separate user task was concurrently changing the learning workspace and durable preparation modules; those changes were preserved and its owner was informed of navigation and theme contracts. This report does not claim that work as landing-page implementation.

## Fidelity and intentional differences

The approved [desktop](concepts/desktop.png) and [mobile](concepts/mobile-upper.png) concepts guided the layout. Browser review increased desktop content width toward the reference's approximately 4.5% gutters, increased the headline to a 66px maximum, strengthened the contained blue/lilac halo, and matched mobile heading phrases. Both approved palette token sets are reused without a replacement colour system. Existing Figtree/Manrope fonts are reused.

Generated images are not exact browser specifications: text, fonts, icons and reflow are live. Functional FAQ chevrons reflect their open state; the theme control and learning-workspace link are added for the requested functionality. Supporting text stays at least 14px equivalent and grows with text enlargement. The Supervisor and fictional/planned notices remain explicit. The material-source description follows the corrected text/PDF copy. There is no fabricated live lesson, school adoption claim or testimonial.

The robot and fictional learner are actual transparent PNG assets used through Next Image at the appropriate display sizes. Asset generation retained minor edge fragments visible at source resolution; rendered-size checks in both themes determine suitability. No full-page screenshot is used as the website.

Existing Figtree and Manrope font licences were checked against the official Google Fonts sources on 19 September: [Figtree OFL](https://github.com/google/fonts/blob/main/ofl/figtree/OFL.txt) and [Manrope OFL](https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt). Both use SIL Open Font License 1.1. Copyright/licence copies are retained in `public/licenses/Figtree-OFL.txt` and `public/licenses/Manrope-OFL.txt`; no font was added or modified for animation.

## Local preview and evidence

Run `npm run dev -- --port 3001` and open [the local landing page](http://127.0.0.1:3001). The standard browser suite starts its own server on3100, so stop another dev process for this same checkout first. Never use Docker for this workflow.

Browser captures: [desktop light](implementation-screenshots/desktop-light.png), [desktop dark](implementation-screenshots/desktop-dark.png), [mobile light](implementation-screenshots/mobile-light.png), [mobile dark](implementation-screenshots/mobile-dark.png). Captures are actual local browser renders, not generated concept images. Motion evidence is recorded separately because still screenshots cannot verify animation quality.

Verification results are recorded in the final setup-status addendum and the motion verification document. Chromium emulation is not a physical-device or all-browser certification. No production deployment, school trial or learning-efficacy result follows from these checks.
