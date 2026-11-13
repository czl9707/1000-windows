---
title: Land the furniture layer
labels: [wayfinder:task]
assignee: zane
state: open
blocked-by: []
---

## Question

Build the furniture layer per ticket 018's resolution. No chapter ships (user decision 2026-11-13) — the layer shows on the home wall only, like the sill layer.

### Implementation plan

TDD in five steps, both reviews (code-review, quality-review) in loop per step, `npx tsc --noEmit && npx astro build` green at the end.

**Step 0 — catalogue (pure data, `src/core/furniture/catalogue.ts`).** The twelve kinds and their street weights; per-plane occupancy weights for planes 2–6 (deeper planes more often empty); the soft bias as a `lieber` multiplier — the TV's kind weight tripled on planes 2–3; per-plane constants: the unit-measure depth (negative z, plane 6 deepest) and the sort bucket (bucket scheme: furniture sits under the light block's `LIGHT_Z = -7`, so plane 2 takes -8 and the buckets step down to plane 6 at -12; a bucket value never reaches the points); the anchor share's range; the furniture weight (one step heavier than the sill items' — `WEIGHTS.detail`, the weights catalogue stays the single authority); the variant roll documented per kind (crate count, rack lean, easel tilt — rolled for every kind, read only by the kinds that need it, the slatShare pattern). Comment carries the block's roll order: plane 2 → plane 6, and within a plane occupied → kind → anchor share → width jitter → variant.

**Step 1 — the roll (`light.ts` pattern, `src/core/furniture/furniture.ts`).** `expandFurniture(rng): FurniturePlan` — a fixed five-slot plan (one per plane), each slot `empty | { kind, ...kind rolls }`; a lampless plane 1 stays the light block's business, the furniture block never reads the lamp plan. Tests: same seed same plan; the plan is a pure function of the seed; kind weights respect the plane bias.

**Step 2 — colour (`src/styling/`).** One `colourway:furniture` fork per window — every piece in a room reads the same family, the curtain-cloth pattern. New roles: `furniture` (the tinted body fill, interior paint — kept off the night mix like the lamp's own) and `tvScreen` (fixed dark in both themes, no colourway roll). Resolver rows in `ROLE_RESOLVERS`; the guard test extended — an unregistered furniture role still throws.

**Step 3 — the constructions (`src/core/furniture/drawFurniture.ts`).** Twelve construction functions, one per kind: a flat fill mass in `furniture` (the TV's screen fill in `tvScreen`), plus a few interior strokes naming the kind — shelf lines, the screen seam, the mirror's glass wash. Repeated interior strokes go through the existing hand-rule helper the curtain drawer uses. Geometry: each piece bottom-anchored below the opening's bottom edge (a per-plane base drop, the standing-line pattern from the lamp's `FLOOR_DROP`/`DESK_DROP`), the piece's height in unit measure scaled per plane so deeper planes read smaller; the opening clips at the sides for free (marks are drawn under the shell's frame). Every mark carries its plane's depth on its points and its bucket on `z`, so the projection scales and the draw stage orders it — no plane 1 interaction.

**Step 4 — the module entry and wiring (`src/core/furniture/index.ts`, `src/core/window.ts`).** Entry follows the base shape: `expandFurniture`, `furnitureMarks(rng, opening)`, `FurniturePlan`. In `window.ts`: the walk appends the furniture block after the light block (`lampLit` untouched — verified by its existing test), the assembly places `...furniture` first of the tenant layers so the z-bucket sort draws it 6 → 2, then light, curtain, sill. The entry comment updated: the furniture block is the walk's last layer, drawn deepest.

**Step 5 — scene tests (`src/core/window.test.ts` additions).** A room with rolled furniture carries furniture marks sorting under `LIGHT_Z` and over the veil; a fully curtained room's furniture still sorts under the cloth (the cloth hides it at draw time); `lampLit`'s walk and every earlier layer's plan are byte-identical on old seeds (append-only purity).
