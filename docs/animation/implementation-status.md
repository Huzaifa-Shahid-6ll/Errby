# Landing implementation status

30 September 2026. All 60 checks are classified below; implementation does not imply every physical-device or field measurement has passed. See [verification](verification.md) for actual outcomes and limitations. September 19 evidence is historical.

Files: **P** [landing-page.tsx](../../src/components/landing/landing-page.tsx), **C** [scoped CSS](../../src/components/landing/landing-page.module.css), **M** [motion CSS](../../src/components/landing/landing-motion.css), **N** [menu](../../src/components/landing/landing-menu.tsx).

Evidence: **S** source review; **T1** concept navigation/disclosures; **T2** menu/responsive/reduced/display tests in [landing.spec.ts](../../tests/browser/landing.spec.ts); **T3** no-JS test; **T4** controlled greeting/reversal/rollback/restoration; **T5** touch/failed-image/long-content checks in [landing-motion.spec.ts](../../tests/browser/landing-motion.spec.ts). **V** visual/playback evidence; **K** contrast calculation; **A** semantic snapshot; **B** production metrics/bundle report, all linked in verification. Test execution results are recorded there, not inferred from test existence.

| Check / research | Disposition       | Effects | Files  | Implementation / reason                                                         | Evidence and limit                           |
| ---------------- | ----------------- | ------- | ------ | ------------------------------------------------------------------------------- | -------------------------------------------- |
| I01 / R01        | implemented       | M01–04  | P,C    | Immediate #example anchors; no timeline gating.                                 | T1, T4                                       |
| I02 / R02        | implemented       | M01–03  | M      | Reuse semantic timing/easing tokens.                                            | S, T4                                        |
| I03 / R03        | implemented       | M01     | M,P    | Only the hero mascot gets an entrance.                                          | S, T4                                        |
| I04 / R04        | implemented       | static  | P      | DOM order and zero reveal delay retain corrections.                             | T1, T3                                       |
| I05 / R05        | implemented       | M03     | M,P    | Chevron tracks native open, not delayed text visibility.                        | T1, T4                                       |
| I06 / R06        | implemented       | static  | P      | Both prewritten branches explicitly illustrative/unreviewed.                    | T1, T3                                       |
| I07 / R07        | implemented       | M01–03  | P,M    | Quiet learning, feedback, teacher and source sections.                          | V                                            |
| I08 / R08        | implemented       | M01–02  | C,M    | Stable control bounds; wrap long words and header at 200%.                      | T2, T4, T5                                   |
| I09 / R09        | implemented       | M02–04  | P,M,N  | No timeout before click, disclosure or focus.                                   | T1, T2                                       |
| I10 / R10        | implemented       | M01     | M      | One finite greeting/document; no scroll replay or storage.                      | T4, S                                        |
| I11 / R11        | implemented       | M01–03  | M      | 140/180/600ms timing tokens; phone 480ms.                                       | S, V                                         |
| I12 / R12        | implemented       | M01–03  | M      | Arrival and state curves explicit; no transition-all.                           | S, V                                         |
| I13 / R13        | not-applicable    | none    | M      | No spring/drag interaction; no spring engine.                                   | S                                            |
| I14 / R14        | implemented       | static  | P,M    | Content stagger cap is 0ms for any item count.                                  | S, T3                                        |
| I15 / R15        | implemented       | M01     | M      | 3px/-3deg desktop, 2px/-2deg below 640px.                                       | T4, V                                        |
| I16 / R16        | implemented       | M01     | M      | 50% 90% pivot on decorative image wrapper only.                                 | T4, V                                        |
| I17 / R17        | verified-existing | native  | P      | No animation sequence dependencies exist.                                       | S                                            |
| I18 / R18        | implemented       | M01–04  | M,N    | Native retoggling and CSS retargeting; no stale timers.                         | T2, T4                                       |
| I19 / R19        | implemented       | M01–03  | M      | Document/hover/open triggers; no intersection observers.                        | S, T4                                        |
| I20 / R20        | implemented       | M01–03  | M      | Existing scoped stylesheet and data hooks reused.                               | S                                            |
| I21 / R21        | implemented       | M01     | P,M    | Copy, CTA and images have readable static states.                               | T3, T4                                       |
| I22 / R22        | implemented       | static  | P,C    | No text splitting/masks; selectable responsive headings.                        | T2, T5                                       |
| I23 / R23        | implemented       | M02     | C,M    | Hover/press/focus complete for links; no fake pending states.                   | T1, T4, K                                    |
| I24 / R24        | implemented       | M04     | N      | Native menu; Escape and destination focus enhancement.                          | T2, T3                                       |
| I25 / R25        | not-applicable    | none    | P      | No section reveals; content remains visible.                                    | T3, S                                        |
| I26 / R26        | implemented       | static  | P,C    | Optimized PNG imagery, explicit dimensions, lazy notebook.                      | T3, T5, B                                    |
| I27 / R27        | not-applicable    | none    | M      | No scroll-linked animation/pinning; native anchors preserved.                   | T4                                           |
| I28 / R28        | not-applicable    | none    | P      | No testimonials/counters/carousels without evidence.                            | S                                            |
| I29 / R29        | implemented       | M03     | P,M    | Native variable-height disclosure; no hidden focusable answer controls.         | T1, T3, T4                                   |
| I30 / R30        | not-applicable    | none    | P      | No marketing forms or model-backed submissions.                                 | T1                                           |
| I31 / R31        | implemented       | M01–03  | M      | Dynamic reduced-motion cancels effects; root scroll rule retained.              | T2, T4                                       |
| I32 / R32        | implemented       | M01     | M      | Reduced mode removes spatial movement entirely.                                 | T4                                           |
| I33 / R33        | implemented       | static  | M      | No flashes, blinking, rapid background changes.                                 | S, V                                         |
| I34 / R34        | not-applicable    | M01     | M      | Only subsecond finite greeting, no autoplay media; no pause UI needed.          | S, V                                         |
| I35 / R35        | implemented       | M04     | N,C    | Visible focus, Escape return, section focus.                                    | T1, T2, T4                                   |
| I36 / R36        | implemented       | static  | P      | Visible role text, empty decorative alt, no live-region chatter.                | T3, A                                        |
| I37 / R37        | implemented       | M02     | M,C    | Fine-pointer gate and stationary touch targets.                                 | T5                                           |
| I38 / R38        | implemented       | M02     | C,M    | Opaque text surfaces; contrast includes hover and pressed colors.               | K, V                                         |
| I39 / R39        | implemented       | static  | C      | Narrow reflow, 200% text, forced-color outline.                                 | T2, T5                                       |
| I40 / R40        | implemented       | static  | P,N    | Server transcript/native controls work without JS; no-JS Escape absent.         | T3                                           |
| I41 / R41        | implemented       | M01–03  | M      | CSS only; no engine or package added.                                           | S, B                                         |
| I42 / R42        | implemented       | M01–03  | M      | Transforms on small art/icons; finite resources, no will-change.                | B; GPU trace limitation                      |
| I43 / R43        | implemented       | M01–03  | M,P    | Local CSS and responsive images; no animation JS.                               | B                                            |
| I44 / R44        | implemented       | M01     | P,C,M  | Reserved media sizes; matched static/normal production lab protocol.            | B                                            |
| I45 / R45        | verified-existing | native  | M      | No shipping scroll/resize/frame scheduler.                                      | S                                            |
| I46 / R46        | implemented       | M04     | N,M    | React-owned handlers; no imperative animation resources to dispose.             | S, T4; no heap proof                         |
| I47 / R47        | implemented       | static  | P,N    | Server page plus small client menu; no browser API in server render.            | Build, T3, T4                                |
| I48 / R48        | implemented       | static  | P,M    | Native details; unsupported CSS keeps complete page.                            | T3; engine limits in verification            |
| I49 / R49        | implemented       | M01     | M      | One finite small image transform; no permanent layer promotion.                 | S, B; power not measured                     |
| I50 / R50        | implemented       | static  | P,C    | Intrinsic aspect ratios; no cached layout measurements.                         | T2, T5                                       |
| I51 / R51        | implemented       | M01     | C,M    | 320/390/768/1024/1440 plus landscape coverage.                                  | T2, T5                                       |
| I52 / R52        | implemented       | static  | P      | 4x CPU lab; blocked images and no-JS preserve reading.                          | B, T3, T5; physical low-end phone unverified |
| I53 / R53        | implemented       | static  | C,P    | Long heading and 200% text stress; no list timing geometry.                     | T2, T5; English only                         |
| I54 / R54        | implemented       | native  | P      | Deep link, back, reload and CTA preserve native behavior.                       | T4; BFCache not certified                    |
| I55 / R55        | implemented       | M01     | C,M    | Only art layer transforms and ignores pointer events; header normal flow.       | V, T4                                        |
| I56 / R56        | implemented       | M01–04  | M,N    | One reused CSS file; small menu component; no unused new engine.                | S                                            |
| I57 / R57        | implemented       | static  | P      | Existing art provenance; user-authorized notebook generation; MIT/OFL retained. | Asset register, motion spec                  |
| I58 / R58        | implemented       | M01–04  | tests  | Behavior checks synchronize on state and controlled animation time.             | T1–T5                                        |
| I59 / R59        | implemented       | M01–03  | tests  | Start/middle/end, interruption and reversal are explicitly reviewed.            | V, T4                                        |
| I60 / R60        | implemented       | M01–03  | docs,M | Documented rollback, budgets and evidence; no analytics or conversion claim.    | B, S                                         |

Coverage: 52 implemented, 2 verified-existing, 6 not-applicable with scope reasons. This is implementation coverage, not 60 independent tests or a claim of full accessibility certification.
