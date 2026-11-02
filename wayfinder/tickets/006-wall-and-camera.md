---
title: Wall and camera — infinite pan
labels: [wayfinder:grilling]
assignee: zane
state: closed
blocked-by: [002]
---

## Question

How does an endless wall actually render while panning? Decisions to reach: world-grid addressing (window pitch in wall units, floor rows, how coordinates map to screen pixels); viewport culling (which windows render, at what margin); what the wall between windows is — mortar/brick lines, pipes, grime, variance that is itself seeded per wall cell; pan input handling (pointer drag, inertia?) and device-pixel-ratio handling; whether the wall is drawn window-by-window each frame or batched. Decisions must keep window seeds independent of pan history: the same coordinates render the same tenant no matter how the camera got there.

## Resolution

Settled by grilling across three rounds (2026-11-01), with the wall texture settled through the throwaway prototype at `/prototype/wall-texture` (see also the prototype skill run):

- **Grid**: every cell holds a window — no vacancy roll. Pitch is 3 × 2 units around the 1.6 × 1.0 window box. Addressing stays `windowSeed(metaSeed, col, row)`; seeds are independent of pan history by construction.
- **Scale**: adaptive to the viewport, no fixed px-per-unit — the landed rule (`wallUnits` in `core/wall/grid.ts`) fits the minimum view of five columns and three rows, clamps the visible count at the thirty-cell cap, and holds a 120 px floor under each window's rendered size; where the bounds conflict the count bounds yield before the floor, so a shrinking viewport drops columns and rows rather than shrinking tenants into specks (a phone shows a couple of large windows).
- **Wall texture**: the prototype's settled treatment, ported verbatim — the paper stipple tile (SVG feTurbulence data-URI, drawn at 3.4 units) across the whole wall, ragged illustrative brick-patch islands over it (sparse overshooting course lines with staggered vertical joints, `ruhig`, seeded per wall slot), drawn before the windows so it reads through the glass.
- **Camera**: the eye stays at the screen's centre, never moved by panning; panning moves the world offset. Pointer drag pans; release glides with inertia under friction decay; a click (movement under a small threshold) never nudges the wall. DPR handled by the existing demo loop.
- **Rendering**: full redraw of every visible window every frame — the standing decision from ticket 002 reaffirmed. No trace cache anywhere: window pens and wall-texture pens share one lifecycle — a pen is created when its window or wall slot enters the viewport and dropped when it leaves, so the pen's internal trace cache dies with the instance and memory stays bounded by what is on screen.
- **Culling**: visible cell range computed from the camera and viewport with a margin of at least one cell; cells outside it never touch a pen.
- **Layer separation (standing constraint from the human)**: the wall composites windows strictly through the per-window entry `drawWindow(ctx, pen, palette, eye)` — it must never know window internals; the focal lives inside the projection. Future window features (tenants, light genes, idle motion, attention) land behind that entry, and the page and wall are never revisited for them. The page hosts the wall's wiring — the frame's view, the real eye, the gestures, the shuffle — and imports the engine's wall entrypoints to do it; everything inside a window stays below `drawWindow`.
- **Home page**: the wall is the page — canvas only, header on top. The header gains a docs navigation button (top right) linking to a new minimal `/docs` index (h2 + chapter listing with landed/draft status), and a shuffle button that re-rolls the meta-seed in place — camera kept, no reload, no URL state.
- **Landing**: the milestone ships as chapter 06 with the strip demo — the wall at rest, the same engine with the gestures unbound — through the existing demo discovery; the pannable painter lives in `pages/index.astro` beside its only canvas, registered and mounted through the demo runtime; the throwaway `/prototype/wall-texture` route moves to a throwaway branch when folded in.
