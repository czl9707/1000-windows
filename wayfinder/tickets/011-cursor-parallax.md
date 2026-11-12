---
title: Cursor parallax — the wall shifts with the gaze
labels: [wayfinder:prototype]
assignee: zane
state: closed
blocked-by: []
---

## Question

How does the scene shift under the pointer so depth reads as depth? Marks already carry `z` (unit measure, 0 = wall plane) and projection landed in [Shell add-ons and the layer pipeline](010-shell-addons-and-layer-pipeline.md); the pointer shift computes from that depth and grows `src/motion`. Decisions to reach: the pointer-to-shift mapping (direction — do near layers move against the pointer like a real camera pan, and how far), the shift factor per depth (derived from the projection's `s = F/(F−z)` or an independent curve), what the transform anchors to (wall centre, viewport centre), how the shift composes with the wall pan when the camera ticket [Wall and camera — infinite pan](006-wall-and-camera.md) lands later, and the per-frame cost of re-projecting every visible mark. Deliverable: a prototype where the existing scene's layers shift by depth under the pointer; the human judges whether the wall reads as deep or as wobbling glass. Run the prototype skill.

## Resolution

Decided 2026-11-01, prototyped and judged on the page by zane.

- **The eye sits at the screen's centre, always** — never the pointer, never moved by panning. The input is each canvas's offset from that centre, in unit measure. In chapter demos the pointer stands in for it (the cursor at the canvas's edge reads as the strip sitting at the screen's edge); the home wall will feed the canvas's real position instead.
- **The shift is the projection's own term**: each point lands at `p·s + eye·(s − 1)` — the wall plane pinned, nearer layers drifting away from the screen's centre in proportion to depth. Anchor, factor, and direction are one formula derived from the weak-perspective model, not an independent curve.
- **`FOCAL = 30`**: magnification stays under 4% at the deepest mark in the shell (a single casement leaf swung fully open, depth ≈ 1.14).
- **Swung geometry carries real depth**: the open casement leaf's points ride the swing (free edge at `span · sin(swing)`, rails connecting back along the gradient), and shutter panels grow depth from their hinges at the swing's tangent. Both revise the earlier flat-on-wall verdict, which read as glued to the wall once the parallax arrived.
- **The demo loop resolves the eye per frame** through an injectable resolver — `createDemoLoop(canvas, paint, resolveEye)`, defaulting to centred — so demos map the pointer and the home wall maps its canvas position into one seam. Per-frame cost: one multiply-add per point per axis, inside the projection the draw stage already runs.
- **Composition with the wall pan stays open for the camera ticket**: the eye is screen-space, pan is wall-space; [Wall and camera — infinite pan](006-wall-and-camera.md) decides how they meet.
- Verdict: the shift reads as depth. The chapter landed as `05-motion` (title Motion).

