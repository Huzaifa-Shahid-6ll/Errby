# Chat content, useful interactions and visuals

1 October 2026. Scope: the existing private learner chat. This extends the [UX plan](UX_PATTERN_PLAN_2026-10-01.md); it does not restore teacher/class screens. Interface treatments below are implemented. The teaching visuals roadmap is a plan, not a delivered generation capability.

## What fits the app now

| Content               | Visible treatment                                                             | Meaning and boundary                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Ordinary conversation | Existing speaker and readable paragraphs                                      | No extra card around every sentence.                                                                                     |
| Reference note        | Indigo duotone book, labelled inset card                                      | An attributed Errby summary in topic previews, not a verified learner answer.                                            |
| Source excerpt        | Quotation icon, left border, exact quotation and source metadata              | Distinct from the summary. Saved source matching retains its explicit unreviewed status.                                 |
| External link         | Link/outward-arrow icon, underline, actual URL or descriptive publisher title | Opens a new tab with an accessible notice. No automatic preview fetch, tracking image or claim of verification.          |
| Document              | Duotone file icon, filename, metadata, bounded card                           | Existing preview/download functions; private ownership rules are unchanged.                                              |
| Tool output           | Wrench icon plus extraction/rewording label                                   | Extraction coverage and simpler questions retain their existing limitations.                                             |
| Learning guidance     | Amber shield, label, left border and quiet inset                              | Drawn from the actual Supervisor message role, including quiet chat. Not inferred from keywords or decorated as success. |

Phosphor 2.1.10 was already installed. Reused it with the existing palette, Buttons and Radix primitives; no new package or icon framework. Neutral source/document/tool markers preserve the established role palette, while shape and labels distinguish their purpose. Teal remains reserved for confirmed outcomes such as successful copying and existing demonstrated learning.

Finalized opening, preserved opening and saved messages use the same safe web-link renderer. Only explicit HTTP(S) addresses become links; malformed and credential-bearing addresses stay text. HTML and other protocols remain escaped text. Copy always uses the original message. Streaming remains plain text until finalized, so partial URLs do not become changing click targets. Source quotations deliberately retain exact text instead of being reparsed into rich content.

## References reviewed and decisions

These are adaptations of documented behavior using existing code, not installations or copies of the external component source.

### Evil Buttons

Reviewed the [catalog](https://www.evilbuttons.com/docs), [CopyButton](https://www.evilbuttons.com/docs/copy-button) and [MorphStatusButton](https://www.evilbuttons.com/docs/morph-status-button). Useful patterns: immediate operation feedback, an icon/label change after actual success, a stable-width control and clear failure recovery.

Applied to shared message Copy: Copy → Copying → Copied, or Try again with selectable-text recovery. Repeated activation while copying is ignored. The label stays in place; feedback is also announced. State changes are immediate, with no new animation loop or timer. No random failures, blaming error copy, moving targets, hold gestures, confetti or shader effect was introduced. The existing explicit confirmation remains the document-removal path.

### UI Arc split button

Reviewed the [split-button documentation](https://uiarc.dev/components/split-button). Applied its default-action/related-alternative pattern to saved documents: Preview document is primary; the adjacent labelled chevron exposes Download original. Removal stays separate because it is destructive, not another way to open a document. Non-ready originals have no download option.

Both halves are native Buttons. Installed Radix DropdownMenu supplies keyboard navigation, portal positioning and Escape/focus return; collision padding keeps the menu on-screen. No split Send control: the app has no genuine send variants. No library-wide registry import, per-letter animation or additional dependency was needed.

### Invisible Details: deeper review

Read the [public index](https://invisibledetails.com/llms.txt), landing examples and all three public lessons in full. Browser DOM inspection supplemented intermittent web-reader failures. Other curriculum chapters are marked locked; their titles are not evidence that their contents were read. No purchase or account access was used.

- [Learning to notice](https://invisibledetails.com/preview/learning-to-notice): inspect the moments that cause hesitation; deliberately test delay, failure, empty data, long text, keyboard navigation and narrow screens. Applied here through explicit copying feedback, readable denial recovery, preserved drafts and keyboard/mobile regression checks. These are product-specific applications, not measured learning benefits.
- [Small details that add up](https://invisibledetails.com/preview/small-details-that-add-up): consistent spacing, appropriate nested radii, first-line icon alignment, stable numeric/text layout and generous hit targets. Applied through shared label/card rules, icons that do not shrink with wrapped filenames, stable Copy width, 44px menu controls and wrapped source links. Existing readable input sizing, text selection and tabular upload counts remain. Scrollable source dialogs retain scrollbars; no imitation of hidden-scrollbar examples.
- [Stepper](https://invisibledetails.com/preview/stepper): keyboard semantics, unambiguous targets, accessible state announcements, reduced-motion behavior and resilience to fast repeated input matter beyond the screenshot. Reused those principles for the menu and Copy interaction. A stepper itself does not fit a free-flowing chat and was not added. Existing progress stays tied to learner evidence, not a decorative sequence of steps.

## Interactive chat visuals: A2UI research and revised plan

Updated 1 October 2026 after the user clarified the target: a visualization tool inside chat, with diagrams, graphs and controls that respond to interaction and follow-up messages. This supersedes the earlier static-first topic-preview roadmap. Research and proposed work below are not implemented capabilities.

### What A2UI provides

[A2UI](https://a2ui.org/) describes interfaces as structured messages that a client renders using a registered component catalog. The model can select and configure components, bind data and update an existing surface. It does not supply every educational visualization or execute arbitrary generated JavaScript. Charts and simulations need suitable components and mathematical behavior in the app. The [custom-component guide](https://a2ui.org/guides/authoring-components/) explains the schema, implementation and registration boundary.

The [maintained renderer matrix](https://a2ui.org/reference/renderers/) currently lists React support for stable protocol v0.9.1; v1.0 support is planned. The [React README](https://github.com/a2ui-project/a2ui/blob/main/renderers/react/README.md), also retrieved through Context7, documents custom catalogs and the `/v0_9` entry points. Use a tested, pinned release compatible with that protocol; package and protocol version numbers are separate.

There is a concrete dependency question before adoption: the [React package manifest on main](https://github.com/a2ui-project/a2ui/blob/main/renderers/react/package.json) declares React 18/19 peers and Zod `^3.25.76`, while Errby uses React 19.3.0 and Zod 4.6.5. Main is not proof of the published npm package. Verify the exact published renderer/core pair in an isolated compatibility check; do not force peer resolution or downgrade Errby's validators to make an installation pass.

[A2UI actions](https://a2ui.org/concepts/actions/) distinguish local registered functions from events sent to the server. Input controls can update bound state locally. This supports immediate slider feedback without a model request for every change; a deliberate follow-up can send the selected state to Errby. Our visual component must implement the actual calculation.

The protocol is [transport independent](https://a2ui.org/concepts/transports/). Reusing Errby's SSE is plausible through a small custom adapter. The official transport page still labels its standalone SSE integration proposed, so this is not a documented drop-in SSE installation. A new agent framework, A2A stack or CopilotKit migration is unnecessary for this proposal.

### The experience to build

OpenAI's [interactive learning announcement](https://openai.com/index/new-ways-to-learn-math-and-science-in-chatgpt/) provides a useful public reference: changing variables immediately updates graphs and outcomes inside a conversation. It does not establish that ChatGPT uses A2UI. The target here is that interaction, including conversational refinement of the visual.

For example, a learner asks to explore how a line's slope works. Errby presents a labelled graph with a slope slider. Dragging changes the line and displayed equation immediately. “Show a negative slope too” updates that figure with a comparison. Errby can ask the learner to explain what changed, preserving its learner role instead of turning every reply into a lecture.

- Show one relevant visual beneath a brief message when requested or useful. Do not attach one to every answer or hide the main experience inside a topic-starter screen.
- Give it a Phosphor chart/diagram icon, a descriptive title, quiet boundary and caption. Mark illustrative models honestly; actual source references remain accessible separately.
- Keep controls beside the figure, with visible values, units, keyboard support and Reset. Offer expansion for detail while preserving draft, scroll and focus.
- Use the app palette, native controls and existing UI primitives. Labels, patterns and geometry carry meaning alongside color. On phones, controls stack below the visual.
- Let deliberate follow-ups use the current visual state. Ordinary dragging stays local and incurs no AI request. An explicit explanation request follows existing server authorization and cost reservations.

### Recommended implementation sequence

1. **Prove the renderer fits.** Resolve the published-package compatibility question, then render one custom graph plus a bound native slider in an isolated local experiment. Check styling, React rendering and bundle cost before adopting A2UI. If integration requires disruptive dependency changes, the same small React visual can be driven by a validated app descriptor first; do not build a second UI framework.
2. **Deliver one complete chat flow.** Add a bounded structured visual request (proposed name: `show_visual`) to the model contract. Server validation accepts only the supported catalog, parameters, data sizes and actions. Deliver it through the existing stream, render inline and support a follow-up updating the same surface. Start with a reviewed mathematical relationship; generated numbers must be labelled as an example, never observational data.
3. **Make history reliable.** Store the accepted descriptor, catalog version and current state with its message for saved sessions. Tie every surface and revision to the owner/session/message, reject stale or foreign actions, and restore the saved figure without asking the model to regenerate it. Opening chat retains its current tab-local persistence policy. Interrupted or invalid updates retain the last valid figure and a text fallback.
4. **Expand by demonstrated need.** Add reusable labelled diagrams/geometry, comparisons and supported simulations. Their controls and deterministic calculations must be implemented and checked. Topic coverage then grows through composition and validated parameters; a new topic does not necessarily require a new hardcoded card. Source figures remain a separate future extraction/storage feature.

Current integration points are `src/lib/chat/entry.ts` and `src/lib/ai/reply.ts` for model replies, `src/lib/http/event-stream.ts` and `stream-response.ts` for transport, and the opening/saved message renderers under `src/app/learn/`. Today the reply contracts produce short text with a 400-token output cap, and the stream has no visual event. Structured visual generation requires an explicit contract and budget change, not parsing diagrams from text. Reuse server-only model access, cancellation, reservations and existing source/evidence rules.

For fully bespoke generated HTML/JavaScript mini-apps, A2UI alone is insufficient. That would be a separate sandboxed artifact runtime with restricted network/host access, resource limits and a validated messaging bridge. Defer it until a required visual cannot be expressed through the catalog; never run model-generated code in the application document. No raw formula `eval`, arbitrary component imports or remote embeds enter the proposed catalog path.

### Acceptance before expanding

The first slice must show a correct graph, immediate keyboard/pointer control updates, a follow-up changing the same figure, saved-state restoration and graceful invalid/aborted-update handling. Check bounds and nonfinite numbers, ownership/stale-action rejection, labelled axes/units, a text/table alternative, 320px layouts, 200% text, dark mode and reduced motion. Verify slider interaction makes no network/model call.

The evaluator must receive assistance context whenever a visual reveals an answer; interacting with it never awards learning credit. Source links must belong to the session, and neither an attractive figure nor a “fact” label establishes truth. Claim-level fact cards still require actual claim-to-reference data. Observe whether the learner can explain the relationship, beyond simply preferring the appearance.

Only documentation changed for this A2UI research. No renderer was installed, no visualization tool was implemented and no model call was made. Implementation verification and remaining limits are recorded in [setup status](../SETUP_STATUS.md).
