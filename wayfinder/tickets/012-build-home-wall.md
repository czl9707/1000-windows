---
title: Build the home wall — the infinite pan lands as the home page
labels: [wayfinder:task]
assignee: zane
state: closed
blocked-by: []
---

## Question

Nothing left to decide — the decisions live in [Wall and camera — infinite pan](006-wall-and-camera.md). This is the build that lands them: the milestone's code merged as a milestone, its chapter shipped.

The build, in dependency order:

1. **Branch**: feature branch off `main` (pull first).
2. **Wall engine** (`src/core/wall/`): grid constants (pitch 3 × 2), the viewport scale rule (`min(vw/15, vh/6)`, clamped below by `sqrt(vw·vh/180)`), camera state + visible-cell culling with a ≥ 1 cell margin, and the wall texture ported verbatim from the prototype (stipple tile + ragged brick patches, `ruhig`, per-slot seeds). Pens for wall slots live and die with viewport entry/exit — no trace cache anywhere, same lifecycle as window pens. Core may use `pen/` and `motion/`; the wall texture module belongs in the engine, not in site UI.
3. **Chapter + demo painter**: next free chapter folder (`06-the-wall/`) with its `demo.ts` registering the wall demo through `registerDemo`; the painter drives the loop — culling, drag + inertia (click threshold), full redraw per frame, texture before windows, each window drawn strictly through `drawWindow(ctx, pen, palette, eye, focal)`. Chapter MDX records the decisions and quotes the code; chapter lands with the milestone.
4. **Demo runtime**: the mount registry exposes the live wall instance so the header's shuffle button can re-roll the meta-seed in place (camera kept, no reload, no URL). Site UI still never imports the engine — it talks only to the registry.
5. **Home page**: `index.astro` becomes the wall under the header — canvas fills the viewport, existing intro and chapter list deleted.
6. **Header**: docs navigation button (top right) and shuffle button beside the theme toggle.
7. **`/docs` index**: minimal page — h2 + chapter listing in reading order with landed/draft status.
8. **Prototype route**: `/prototype/wall-texture` moves to a throwaway branch, as its own header comment records.
9. **Verify**: `npx tsc --noEmit && npx astro build`; the wall pans, glides, shuffles; ≥ 5 × 3 windows visible, ≤ 30 at the extreme.

## Resolution

Built on branch `home-wall` (commit dd89181) through TDD at four agreed seams (`wallUnits`, `visibleCells`, `planPens`, `glide` — all in `src/core/wall/` with tests beside), then looped on code-review + quality-review until clean (the click-never-nudges defect and the drag pointer-id holes were the real catches). Landed: the `src/core/wall/` engine behind the `Wall` entrypoint — `wall.draw(ctx, box, frame, time, colors)` owns the meta-seed, the camera, and both layers' pens, with the pan gestures in `wall/drag`; chapter `06-the-wall` with the strip demo (the wall at rest, the engine with gestures unbound, the eye following the cursor) discovered like every chapter demo; the pannable painter in `pages/index.astro` beside its only canvas, registered and mounted through the demo runtime; the header's shuffle (rendered on the home page only) re-rolling through `reseedHandleFor(canvas)`; `/docs` index; each window drawn strictly through `drawWindow(ctx, pen, palette, eye)`. The prototype route lives on branch `prototype/wall-texture`. `tsc` clean, 61 tests pass, 8-page build green; drag, glide, and shuffle verified headless in a live browser.
