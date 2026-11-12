---
title: Land the colour layer
labels: [wayfinder:task]
assignee: zane
state: closed
blocked-by: []
---

## Question

Build what [Per-window colour roles — colourways and role-resolved tints](013-per-window-color-roles.md) decided:

- Hand-rolled OKLab/OKLCH → sRGB conversion in `src/styling/` (`oklch.ts`), round-trip tested, plus the encoded-channel mix the night model uses.
- The colourway catalogue in `src/styling/`: one weighted list of finished colours (rarity in the weights), plus the per-role constants — wash alpha, chroma cap, echo — for cloth, awning canvas, shutter slats, window-box wood, and the frame face.
- The seeded colourway resolution, a fork per surface group off the window seed, never the `dna` or `shell` streams; the roll's hue jitter; each coloured surface resolves its own group's roll, the three cloth constructions sharing one cloth roll.
- The tint merge in `execute` — a role with no registered resolution throws; drawing code keeps naming only roles and never sees a colour value outside `src/styling/`.
- The two-pass fill (second pass +0.05 L, half coverage) on the coloured washes; night verified as the paper mix — every tinted colour resolved as nine parts theme paper, one part day colour, inside the palette resolution — over the dark theme, both themes eyeballed in the browser.

`npx tsc --noEmit && npx astro build` green, then ship the chapter per the map's execution note.

## Resolution

Landed on `colour-layer`: commit `e3d20a6` brought the hand-rolled OKLCH conversion, the weighted colourway catalogue with per-role constants in `src/styling/`, the per-group forks off the window seed, and the role-resolution throw guard; commit `d49f350` retuned the roles (sill in its own paint, shutters under the frame colour, the two-wear awning stripe); commit `506adec` shipped chapter `08-colourways` with the day/night compare benches and the feelings knobs over the street. Night resolves as the paper mix inside the palette resolvers; both themes eyeballed in the browser during the bench work.
