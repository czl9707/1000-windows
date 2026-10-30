---
title: The pen on facade shapes — first hand-drawn window frame
labels: [wayfinder:prototype]
assignee:
state: open
blocked-by: [002]
---

## Question

Does the reference's pen survive transplantation onto rectangles? Port the pen into `src/demo/`: ribbon strokes with a pressure curve (thin at touchdown and liftoff), tremor hashed per trace name, boiling at the reference's beat rate with per-window beat offset, the ghost underlayer at reduced opacity, warped oval dots, closed shapes overshooting their start. Deliverable: one static window — frame, sill, glass, curtain — drawn by this pen in a browser page, eyeballed by the human. Key question to answer by looking at it: do the reference's short-stroke and warp-cap rules (tuned for curved heads) need different constants for long straight window lines, or do straight lines read as dead without extra meander? Run the prototype skill to build it; the human reacts to the render.
