---
title: Land the light layer
labels: [wayfinder:task]
assignee: zane
state: open
blocked-by: []
---

## Question

Build the light layer fresh per ticket 017's resolution and addendum, with the six lamp constructions picked in ticket 025. Two earlier runs lived as branches (`light-layer`, `light-layer-2`, both stacked on `colour-layer`); both were deleted by user decision and this is a restart, not a continuation. The plan:

1. **Clean slate.** Done 2026-11-08: both rejected branches deleted, the half-torn-out working tree discarded, fresh branch `light-layer` cut from `colour-layer` (the accepted base — `main` predates the colour and sill milestones).
2. **Styling — the veil narrows.** The night mix keeps sinking the street-side painted roles only (mullion, awning, box). Interior roles — cloth/shade/blind, sill ledge, sill-item fills, the lamp — resolve without it; their night look comes from the interior background holding the ground colour in both themes. New light palette on its own colour fork: a warm table of rows varying tone and strength in the amber family (rare strong rows above a threshold, the reference's pattern), the bulb resolving its row whole, the ambient sunk to its low-opacity dial, the aura at its dial alpha.
3. **DNA.** The light block appends after the sill block, never ending early: on (`2 dark : 1 lit`) → kind (six constructions from the picked sheet) → seat (floor line or ceiling line by kind, a slot along the room) → facing (left/right where the construction supports it). The warmth row rolls on the light colour fork, never the dna stream.
4. **The module.** `src/core/light/` on the established entry pattern: `index.ts` exports the base shape only (`expandLight`, `lightMarks`, the plan type); `catalogue.ts` holds the six constructions (the hanging line drives the hangers); `light.ts` expands the genes into the state table (day / night-unlit / night-lit); `drawLight.ts` emits structure marks (fill + ink like any object), emitter marks (ink + light fill at night, ink + ordinary fill otherwise), ambient (one low-opacity warm fill over the room, lit nights), and aura rings (anchored at the emitting part, layered flat washes, `Still`, clipped to the opening, stronger than the sheet). Depth band: interior → light marks → curtain cloth → sill items → pane wash → frame.
5. **Assembly.** `window.ts` appends the light block after the sill stream-side; the night flip derives from the theme paper's lightness, one authority handed down per window.
6. **Tests.** Stream purity and append-only order; roll weights; catalogue invariants (hanging kinds hang, seats in bounds); the state table per theme × lit; aura clipping and depth order; interior roles resolving veil-free; sill items and street roles unchanged.
7. **Chapter 09.** Maker's-log prose per the chapter rules, DemoCanvas with the tuning handle (aura alpha, ambient alpha, warmth strength dials), the six lamp plates as the exhibit.
8. **Verification.** `npx tsc --noEmit`, vitest, `npx astro build`; both review rounds in loop.
