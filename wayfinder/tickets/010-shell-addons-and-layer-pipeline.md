---
title: Shell add-ons and the layer pipeline
labels: [wayfinder:grilling]
assignee: zane
state: closed
blocked-by: []
---

## Question

More variance on the window shell — the frame itself, the sill, and attached masses (awning, shutters, window box) — and the layer abstraction the growing scene needs before more of it lands: who owns geometry, who owns placement, who owns style, and where depth lives so pointer parallax can arrive later without a rewrite. Schema context in [Tenant DNA schema — what genes define a window](003-tenant-dna-schema.md); the shell it extends is [Window shell archetypes — frame variants](009-window-shell-archetypes.md).

## Resolution

Decided 2026-11-01, grilling with zane across three rounds.

**Variance**

- Frame variance stays in the shell: head kinds `plain` 5 / `lintel` 2 / `keystone` 1, plus a face-width roll (0.05–0.09) appended to the measured rolls.
- Sill kinds, one roll: `flat` 5 / `bracketed` 2 / `flush` 1. Depth is a constant per kind, never a roll.
- Awning, shutters, and window box are **add-ons mounted over frame and sill**, each its own roll with none dominant: awning `none` 4 / `slope` 2 / `canopy` 1; shutters `none` 4 / `louvered` 2 / `paneled` 1; box `none` 4 / `box` 1. Accessories (vines, cables, decals) stay in the map's fog.
- Add-on reach bounds, enforced in the drawers: ±0.35 sideways, 0.4 above the box.
- Roll order appends: … → thickness jitter → face width → sill kind → head kind → awning → shutters → box.

**The layer pipeline** (adopted discipline, recorded in the map Notes)

- Core geometry emits **marks** — `{ kind: stroke|fill|dot, pts, name?, width?, alpha?, z }` — in 3D: `z` lives on *points* (depth in unit measure, 0 = wall plane), while each mark's numeric `z` is its sort key only, ties broken by emission order so the append-only draw order survives.
- Depth constants per consumer block, spaced for interleaving (shell: glass 0, frame 10, sill 20, open 30, addon 40); call sites write plain numbers where a one-off is honest.
- **Projection lands now**: the draw stage projects every mark through weak perspective (`s = F/(F−z)`, F = 4.2, stroke width scaled by the mark's mean s) before the pen sees it. The pen stays 2D and unchanged — it wobbles on the projected path.
- The open casement leaf is emitted as a true rectangle (hinge edge depth 0, free edge at swing depth); the hand-drawn trapezoid is deleted — projection produces the skew for real.
- Folder split: `src/core/` (randomness, scene, window-shell), `src/pen/` (moved out of core), `src/motion/` (owns projection from day one), `src/styling/` (owns the glass wash and ink rules). Import direction: chapters → core → pen/motion/styling.
- **Cursor parallax is staged as the next session**: motion grows the pointer shift then; nothing else waits on it.
- New chapter on the code layering, reading order right after Randomness (`02-the-layers`; the pen becomes `03`, the shell `04`).

**Addendum — page verdicts, same day**

- Head kinds are removed from the catalogue and the roll order (`… → sill kind → awning → shutters → box`); on the page they read as clutter, not dress.
- The open casement leaf is drawn flat on the wall — a true rectangle narrowed by the swing's cosine, depth untouched. The projected skew read as a drawing error, and a flat leaf also ends the "picture window standing open" confusion (single-pane casements and pictures share one pane of glass; only the leaf told them apart).
- Add-ons that stand in front of the wall fill **opaque in the paper role** (`role: 'paper'`): the awning fabric hides the frame top and the wall; the window box mounts over the sill (top edge y 0.54) so the sill reads as passing behind it. Styling resolves the role to the theme's ground colour, opaque.
- The awning runs wider than the window box (half-width 1.0 slope / 0.95 canopy): at 0.75 it read as a trim, not a roof.
- Window box weights move to `none` 8 / `box` 1, later `none` 8 / `box` 1 / `pair` 1 — the pair being two narrower planters side by side under the sill, each drawn by the same box hand with its own opaque fill and trace names.
- Shutters hang half open, swung outward on hinges at the opening's outer edges: each panel is half the opening's width (shut, the pair would meet over the glass), but swung flat on the wall at a fixed 1.05 rad it draws narrowed by the cosine and covers no part of the window. The panel fills opaque in the paper role; the reach bound still holds.

**Addendum — colour as roles, same day**

- `Mark` becomes a discriminated union — stroke (trace name, width), fill, dot (radius) — every kind carrying its points, a dress `role`, and the sort key. The role is the whole dress, colour and strength together (`ink` solid, `glass` the 0.05 wash, `paper` opaque ground); `src/styling/` owns what each role means (`dress`, `Palette`), and `execute` dresses every mark per frame. No alpha on the mark.
- The pen goes colour-blind: no ink or paper in its constructor, every stroke/fill/dot call names its colour. A theme switch re-renders the same scene — `demoLoop` hands the palette down with each frame, and no demo rebuilds a pen on theme change.
