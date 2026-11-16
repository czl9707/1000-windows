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

Decided 2026-11-16, amended the same day after the eyeball rejected the first build. Plants join the furniture layer wholesale — no plant block, no new stream position, no new mechanism: the kinds enter `FURNITURE_KINDS` and roll from the same pool under every furniture rule (the zero-to-two cap counting the lamp, distinct planes 2–6, distinct kinds per room, the edge hug, the one flat gray silhouette).

- **Kinds**: four floor-standing kinds — monstera, palm, yucca, olive — at weights 3, 3, 2, 2. Ten candidates were tried across two rounds on a throwaway eyeball bench; trailing and hanging plants were ruled out with the fold (every furniture piece stands on the floor line).
- **The first build was rejected at the eyeball**: eight constructions landed from round one read as random geometries — lumpy leaf blobs, leaves floating beside trunks, mechanically staggered arrangements, one smooth dome for a canopy. Round two rebuilt every construction from illustration references (flat houseplant icons and botanical plates, kept under `scratch/plant-refs/`): fronds arc and droop, leaves are pointed almonds on visible stems, crowns are scallop clusters with gaps, rosettes fan from one point. The eye then picked the four kinds above from the rebuilt sheet.
- **The sightline rule the bench enforced**: every kind's construction clears the floor's 0.85 drop — a plant that never clears the sightline is invisible — and every measure is the piece's own footprint and height, never the opening's. Plants also stand further in than the furniture hug (`PLANT_EXTRA_GAP` in the drawer), because a spreading crown hugging the wall draws half behind it — the finding that explained round one's half-hidden kinds. The sightline sweep test covers the plants with the rest of the catalogue, and a test pins the longer plant gap on both edges.
- **Judging**: the bench (`prototype/plant-bench`, primary source, pushed out of main) drew each candidate in a real window — a kinds sheet in daylight, the same windows at street density as the pass/fail strip, `?kind=` for the close look; the merged street was re-eyeballed in day and night.
- **New drawer helpers**: the tapered ribbon along a quadratic arc (fronds, stems, crowns' trunks), the pointed almond leaf, the scallop circle — all phase-deterministic with no stream draw, like the gap wobble.

Built on `plants-layer`, merged to `main` (commit `55cd35d`): the four constructions and helpers in `src/core/furniture/drawFurniture.ts`, the kinds and weights in `src/core/furniture/catalogue.ts`, the glossary's furniture entry carrying the plants. No chapter, per the furniture decision. Typecheck, 185 tests, and build green.
