---
title: Plants — green life in the window
labels: [wayfinder:grilling]
assignee: zane
state: closed
blocked-by: []
---

## Question

What plant vocabulary does a tenant grow? The digest maps the reference's hair masses versus accessories onto attached clutter: window boxes are masses, vines are accessories — but inside the window plants are their own question. Decide: the plant kinds (a monstera in the corner, trailing pothos on the sill, a cactus row, hanging baskets — few kinds with coupled axes, the hat-kind pattern: roll the kind, never each axis independently), which plants are masses with a measured silhouette versus accessory strokes, placement (floor plant beside the frame — the ledge itself is settled: [Sill items](015-sill-items.md) owns the sill-sized potted silhouette, this ticket keeps everything larger, and a shared plant-drawing helper may emerge here), leaf drawing construction that survives boiling at wall distance, and the stream position of the plant block in the insider layer (appending after the sill layer's block). Read the digest's hair chapter for the mass construction pattern (`docs/reference-digest.md`) before deciding.

## Resolution

Decided 2026-11-16. Plants join the furniture layer wholesale — no plant block, no new stream position, no new mechanism: the kinds enter `FURNITURE_KINDS` and roll from the same pool under every furniture rule (the zero-to-two cap counting the lamp, distinct planes 2–6, distinct kinds per room, the edge hug, the one flat gray silhouette).

- **Kinds**: eight floor-standing kinds — monstera, palm, fiddle-leaf fig, cactus (a saguaro with two arms), snake plant, yucca, olive, banana — at household weights (3 for monstera, fiddle fig, snake plant, banana; 2 for the rest). Ten candidates were tried on a throwaway eyeball bench; trailing and hanging plants were ruled out with the fold (every furniture piece stands on the floor line), and two landed candidates were dropped at the strip: the fern, whose blades converged with the snake plant's at street density and never cleared it, and the rubber tree, whose tiers converged with the fiddle fig's trunk-and-foliage.
- **Masses, not accessory strokes**: every kind one measured silhouette — leaf blobs, fronds, blades, rosettes as fill masses of the furniture gray — standing on the room floor. Two shared shape helpers joined the drawer: the jittered blob (leaf mass, canopy) and the tapered spike (frond, blade, cactus arm), both phase-deterministic with no stream draw, like the gap wobble.
- **The sightline rule the bench enforced**: every kind's construction clears the floor's 0.85 drop — a plant that never clears the sightline is invisible, the same trap the furniture ticket's low tables fell into — and every measure is the piece's own footprint and height, never the opening's. The existing sightline sweep test now covers the plants with the rest of the catalogue.
- **Judging**: the bench (`prototype/plant-bench`, primary source, pushed out of main) drew each candidate in a real window — a kinds sheet in daylight, then the same windows at street density as the pass/fail strip; the merged street was re-eyeballed in day and night.

Built on `plants-layer`, merged to `main` (commit `aeaa3b8`): the eight constructions and helpers in `src/core/furniture/drawFurniture.ts`, the kinds and weights in `src/core/furniture/catalogue.ts`, the glossary's furniture entry carrying the plants. No chapter, per the furniture decision. Typecheck, 184 tests, and build green.
