---
title: Land the curtain layer
labels: [wayfinder:task]
assignee: zane
state: open
blocked-by: []
---

## Question

Nothing left to decide — the decisions live in [Curtains — fabric on the pane](014-curtain.md). This is the build that lands them: the layer's code in `src/core/curtain/`, wired into `entry.ts`, the chapter shipped, reviewed with `/quality-review`.

The build, in dependency order:

1. **Branch**: feature branch off `main` (pull first).
2. **Catalogue stream** (`src/core/curtain/`): a `CurtainPlan` (`present`, `kind`, `coverage`) and the one place that rolls it, following the window-shell pattern — the shell stays on its own `fork(seed, 'shell')`, the curtain is the DNA stream's first tenant layer. Stream order fixed: coverage level (`0 / 0.3 / 0.6 / 1` at weights `4 / 4 / 1 / 1` — the zero level is the bare window) → kind (`panels 4 / drapes 3 / venetian 2 / roman 2`) → the level clamped by the kind's zone ceiling → measured (rod jitter, width jitter, drape side, blind slat share) → future appends at the end, never between. The zero level ends the stream: no kind roll, plan says `present: false`.
3. **Cloth drawer** (`src/core/curtain/`, pure emitter like the shell drawers): one construction per kind — panels, drapes, venetian, roman — each emitting cloth fills in its construction role (`fabric` hanging cloth / `shade` roman / `blind` venetian backing, resolved in `src/styling/`), fold/slat strokes in `ink`, per-band opacity steps and slight ink-strength mottling, hem/bar/rail lines full and the dense interior line work under the hand rule (some lines omitted outright, a kept line drawn over only part of its run, the fill carrying the texture) — every curtain line at the texture weight (`WEIGHTS.texture`, the catalogue's lightest), the cloth's hand reading quieter than the frame's own lines, the hanging cloth (panels, drapes) on verticals alone — per-window jitter on rod height and widths, coverage clamped after the roll by the kind's zone ceiling, the venetian's slat rows running opaque down their rolled share of each row (transparent below, hard to both jambs; the 0 roll the closed blind, drawn full) with its rolled slat share. Points hang inside the frame's inner opening at small negative depth with their own sort bucket, so the pane wash draws over the cloth. Trace names stay bare ids unique within a window; no drawing step names a colour.
4. **Wiring** (`src/core/entry.ts`): `windowMarks` appends the curtain marks behind the glass wash. Depth sorting places them; every consumer (`drawWindow`, the wall, the demos) gets curtains without further change.
5. **Tests** (beside, the `shell.test.ts` / `addons.test.ts` precedent): catalogue values and weights, stream purity (appending a roll shifts no earlier roll; the shell's stream is untouched), the zero level draws nothing, coverage never exceeds its kind's ceiling, unique trace names.
6. **Chapter + demo**: next free chapter folder `07-curtains/` with its `demo.ts` — catalogue plates pinning `CurtainPlan`s by hand (one per kind, a bare plate, coverage-level variants), mounted through the `04-window-shell` `mountPlates` pattern with the shell seed pinned to a constant so a plate always draws the same shells behind the same plans, plus the reseed button. `index.mdx` records the decisions (coverage levels, kinds, zone ceilings, the cloth roles, behind-the-glass depth) and quotes the code; chapter lands with the milestone.
7. **Verify**: `npx tsc --noEmit && npx astro build`; the wall still renders identically where its tenants roll the zero level, and the new kinds read at wall scale in the home wall.

## Resolution
