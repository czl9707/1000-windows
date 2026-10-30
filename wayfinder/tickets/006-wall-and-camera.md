---
title: Wall and camera — infinite pan
labels: [wayfinder:grilling]
assignee:
state: open
blocked-by: [002]
---

## Question

How does an endless wall actually render while panning? Decisions to reach: world-grid addressing (window pitch in wall units, floor rows, how coordinates map to screen pixels); viewport culling (which windows render, at what margin); what the wall between windows is — mortar/brick lines, pipes, grime, variance that is itself seeded per wall cell; pan input handling (pointer drag, inertia?) and device-pixel-ratio handling; whether the wall is drawn window-by-window each frame or batched. Decisions must keep window seeds independent of pan history: the same coordinates render the same tenant no matter how the camera got there.
