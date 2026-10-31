---
title: The pen on facade shapes — first hand-drawn window frame
labels: [wayfinder:prototype]
assignee: zane
state: closed
blocked-by: [002]
---

## Question

Does the reference's pen survive transplantation onto rectangles? Port the pen into `src/demo/`: ribbon strokes with a pressure curve (thin at touchdown and liftoff), tremor hashed per trace name, boiling at the reference's beat rate with per-window beat offset, the ghost underlayer at reduced opacity, warped oval dots, closed shapes overshooting their start. Deliverable: one static window — frame, sill, glass, curtain — drawn by this pen in a browser page, eyeballed by the human. Key question to answer by looking at it: do the reference's short-stroke and warp-cap rules (tuned for curved heads) need different constants for long straight window lines, or do straight lines read as dead without extra meander? Run the prototype skill to build it; the human reacts to the render.

## Resolution

Yes — the pen survives transplantation onto long straight window lines, and
the reference's constants carried over unchanged: amplitude 0.008, scratch
weight 0.35, koch bands 0.4/1.2, stream gains 0.62/0.5, 8 beats per second,
ghost layer at half width / 32% opacity / 1.7× amplitude, closed-shape
overshoot 3.5%, dot warp cap 0.15 r. No extra meander was needed to keep
straight lines alive.

One deliberate divergence: the pressure curve. The reference's
thin-at-touchdown taper read as a brush on window lines; the human verdict
was thick ends thinning through the middle, tuned at spitz 0.6. Recorded
beside the curve in pen.ts and in GLOSSARY.md (Pressure).

Deliverable shipped as the landed chapter `the-pen`: one static window —
frame, sill, glass tint, curtain — drawn by the pen at seed 1335613256,
pinned for the prototype only (a real window will derive its seed from the
wall). The pen, randomness, and window-shell code lives permanently in
`src/core/`; the demo registers itself from the chapter's demo.ts into the
shared demo runtime in `src/components/mount.ts`. Stroke widths are static
per-trace constants in the scene; width tuning is deferred until the wall
renderer wants it.
