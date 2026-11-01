---
title: Window shell archetypes — frame variants
labels: [wayfinder:grilling]
assignee: zane
state: closed
blocked-by: []
---

### Question

Which pre-built frame archetypes exist (sash, casement, arched, round, and what else), their weights, each archetype's sub-variants (pane layouts, transom bars), and the measured parameters per sub-variant (frame thickness, sill presence and depth). The seed picks archetype, then sub-variant, then measured values. Schema context in [Tenant DNA schema — what genes define a window](003-tenant-dna-schema.md); the pen that will draw these is prototyped in [The pen on facade shapes — first hand-drawn window frame](004-pen-prototype.md).

## Resolution

Decided 2026-10-31, grilling with zane (visual design + code pattern in one pass).

**Visual design**

- Every window shares one outer ratio: a wide rectangle, 1.6 × 1.0 in unit measure. Archetypes are frame constructions inside that box, not outer shapes; arched/round forms are out.
- Archetypes and weights: **sash** 4, **casement** 3, **picture** 2. An industrial grid variant was proposed and dropped by zane.
- Pane layouts — named kinds, one weighted roll each, never independent axes:
  - sash: `1-over-1` 4, `2-over-2` 3, `6-over-6` 1
  - casement: `pair` 4, `single` 3, `four-pane` 1
  - picture: `single` (only)
- Open state rolls for operable archetypes only (sash, casement); picture is fixed glass. Weights: closed 4, open 2, half-open 1. Sash open/half-open slides the bottom sash up; casement open/half-open swings the sash as a trapezoid toward the viewer. Hinge side rolls when a casement opens.
- **No fills anywhere in the shell**: openings, glass, everything is strokes only.
- Sill on sash, casement, picture.
- Seeded measured roll: frame thickness jitter ±15% around the archetype constant. Sill depth, pane margin, bar and rail positions are constants per archetype — they read as noise at wall distance, so they don't spend seed draws.

**Code pattern**

- `src/core/window-shell/`: `archetypes.ts` (pure data: weights, layout lists, constants), one drawer per archetype with signature `(pen, ctx, plan)`, `shell.ts` exporting `expandShell(seed): ShellPlan` and the `drawWindow(ctx, pen, seed)` dispatcher. `expandShell` is the only place that rolls; drawers are pure consumers of the plan.
- Shell rolls draw from `fork(seed, 'shell')`, separate from the DNA stream, so shell and DNA vocabularies grow without re-randomizing each other. Roll order: archetype → pane layout → open state → (hinge side, when a casement opens) → measured — documented in `archetypes.ts`.
- Catalogue is freely editable between versions (weights may change, variants may be inserted); the only invariant is stream purity — a window seed's roll sequence is a pure function of the seed, never of pan position or render order. Cross-version distribution shifts are acceptable because the meta-seed is random per page load.
- The old demo scene in `window.ts` (curtains, glass tint fill) is dropped: curtain/insider drawing leaves the shell entirely and returns with the DNA layers. The pen chapter demo draws bare shell windows. This milestone ships chapter `03-window-shell` with a strip demo of ~8 seeds showing the archetype spread.

### Addendum — revisions after landing, 2026-11-01

- **Glass wash replaces "no fills anywhere"** (user decision, revising the line-only rule): every pane is a drawn piece of glass — a flat rectangle washed in pen ink via the new `Pen.fill` at 0.05 alpha. Openings stay bare paper. Where two panes overlap (a lifted sash over the glass behind it), the washes stack; no dedupe. All non-glass drawing stays line-only.
- **Open representation keyed by archetype, geometry keyed by layout**: sash slides (raise 55% / 25% of sash height); casement swings — the leaf is drawn from its real bounds (hinge to mullion, or the full opening on a single), its free edge pulls toward the hinge as the leaf opens (60% / 25% of leaf width) and runs taller. Wash with it, no hinge-edge or stay strokes (user verdict).
- Demo is a 3 × 2 grid on `windowSeed(metaSeed, col, row)` with a reseed button styled as the shared theme-toggle button (`ShuffleIcon`); the meta-seed slider was dropped.
