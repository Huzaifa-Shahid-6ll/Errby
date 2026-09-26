# Landing-page visual assets

Created 19 September 2026 with the built-in imagegen tool. Source identity: [approved desktop concept](concepts/desktop.png). No external model API, packages, real pupil imagery, or production integration was used.

## Delivered assets

| Asset             | Workspace path                                               | Native size | Format           | Intended use                                           |
| ----------------- | ------------------------------------------------------------ | ----------- | ---------------- | ------------------------------------------------------ |
| Errby mascot      | [errby-mascot.png](../../public/images/errby-mascot.png)     | 1254 × 1254 | PNG, 32-bit RGBA | Hero, Errby transcript avatars, closing call to action |
| Fictional learner | [learner-avatar.png](../../public/images/learner-avatar.png) | 1254 × 1254 | PNG, 32-bit RGBA | Both “You” transcript avatars                          |

Retain a square aspect ratio. Use `object-fit: contain` for the mascot and a circular clipped box for the learner. The mascot already includes its indigo excitement strokes. Use one source per character in both themes to preserve identity. Do not treat the learner as a real user or testimonial.

Original files are 790,699 bytes (mascot) and 1,110,645 bytes (learner); serve appropriately sized optimized derivatives through the application's existing image pipeline.

## Validation and limitations

- Inspected all generated images visually. Checked final PNG dimensions, `Format32bppArgb`, and top-left alpha 0 with a read-only System.Drawing inspection.
- Both have actual alpha transparency, not an opaque white or drawn checkerboard background.
- Robot preserves white body, navy face, cyan arch eyes, lilac antenna, and indigo excitement marks. Complete subject is uncropped.
- First mascot output had stray edge fragments. One alpha-cleanup edit reduced them; a separate regeneration was worse and rejected. The selected cleanup version still has tiny white/blue fragments around the silhouette at native scale. **This is a known limitation, not a claim of perfect extraction or pixel identity.** Check the rendered 120–144 px asset on dark backgrounds during page QA.
- Learner portrait is fictional and matches the reference's dark hair, blue shirt and pale blue disk. A circular CSS clip keeps outer alpha-edge fragments outside its displayed disk.
- These are recreated bitmap subjects, not exact lossless crops of the concept. Native generation geometry and shading differ slightly.
- No Python or other programmatic image editing was performed. Selected tool outputs were copied unchanged into the workspace.

## Provenance

Tool: built-in `image_gen.imagegen`, referenced local concept.

Selected mascot: `C:/Users/HUZAIFA/.codex/generated_images/01a0bac3-c4f8-7122-9760-2f79fe9407c7/exec-4cccdeb0-de88-4720-bc2d-9cb47687fe99.png`

Selected learner: `C:/Users/HUZAIFA/.codex/generated_images/01a0bac3-c4f8-7122-9760-2f79fe9407c7/exec-24e7926f-51d9-49c5-89fc-487d68bf981e.png`

The selected files are copied into the project and do not depend on those generation paths.

## Exact mascot creation prompt

```text
Use case: background-extraction.
Asset type: reusable website mascot PNG cutout with genuine alpha transparency.
Input image 1 is the approved Errby landing page concept, a subject reference only. Extract and faithfully recreate ONLY its friendly 3D white robot mascot, as visible above the conversation card and in the final call-to-action. No page elements or lettering.
Subject invariants: small squat white glossy rounded robot, wide rounded rectangular white head, inset very dark navy face screen, two luminous pale cyan smiling inverted-U eyes, no mouth, stubby white body, two short rounded arms, subtle white feet, lilac spherical antenna on a short pale stem, pale lavender ears, three small indigo excitement strokes upper right. Preserve the original proportions and soft 3D rendering; do not add features.
Centered complete robot, front view with same tiny friendly tilt, generous uncropped margin. Subject occupies roughly 85% of a square canvas. Soft self shading, clean antialiased edges. Transparent background all around it with true alpha; no checkerboard drawn into pixels, no white rectangle, no gray floor, no background halo or cast floor shadow. Must composite cleanly on white and dark navy. No text, badge, border, watermarks, or unrelated objects. Produce one high resolution subject asset only.
```

Initial output: `exec-f029e108-d5aa-49f2-abe1-517235cdccb6.png`.

## Exact mascot cleanup prompt — selected output

Input: initial mascot output, inspected before editing.

```text
Use case: background-extraction. Edit only the alpha cutout edges of this existing mascot. Preserve the robot, its precise pose, face, materials, proportions, color, three excitement strokes, and all shading without redesigning. Remove ALL stray white/blue fragments, debris, ragged shards and disconnected flecks from the background, especially above its head, around antenna, around arm gaps, and under its feet. Produce a clean solid silhouette with smoothly antialiased edges and genuine transparent alpha everywhere outside the robot and its three intended excitement strokes. No extra shapes. Do not add a background, checkerboard, floor, halo, shadow or text. It must look crisp composited on dark navy or white. Keep square canvas and complete uncropped subject.
```

## Exact alternate mascot prompt — rejected output

Input: desktop concept. Rejected because edge fragmentation increased and body proportions drifted.

```text
Create a production-ready TRANSPARENT PNG of the white robot mascot in the reference screenshot. This is a clean new rendering of that subject, not a page screenshot. Square canvas 1024x1024. Match the small white rounded 3D toy robot with dark navy rounded-rectangle face, two cyan happy arch eyes, white stubby body and arms, lilac ball antenna, pale lilac ear plates. No mouth. Front view, slight friendly tilt. Keep THREE detached short indigo excitement lines beside its upper-right side. The entire backdrop must be fully transparent alpha, including every gap between limbs, antenna and excitement lines. Absolutely ZERO white haze, zero dust, zero scattered pixels, zero confetti, zero flecks outside the perfectly clean silhouette. Clean smooth hard-edged cutout, restrained self shadows only. No ground plane, background glow, or drop shadow. Soft glossy 3D surface matching the reference. Robot occupies about 80% canvas with all parts uncropped. No text, cards, UI, other subjects, or checkerboard pattern.
```

Rejected output: `exec-64612a79-aa13-4c63-b57d-024e960d6a70.png`.

## Exact learner prompt

Input: desktop concept.

```text
Use case: stylized-concept. Asset type: small fictional learner avatar for Errby's example conversation. Input image is the approved landing-page design reference. Recreate ONLY the circular learner portrait shown beside its two "You" chat messages: a friendly illustrated fictional school-age boy with short dark navy hair, peach/tan skin, small warm smile, simple blue shirt, shoulders visible, centered head looking forward, on a pale sky-blue circular disk. Match the compact polished illustration style of that reference, clear simple shapes, not photographic, no real person. Square 1024x1024 canvas, circle fills canvas edge-to-edge, all face/hair/shoulders safely inside the circle, transparent genuine alpha outside the circle at corners. No lettering, words, badges, robot, chat bubble, background rectangle, UI or watermarks. Keep good small-size legibility at 48px.
```
