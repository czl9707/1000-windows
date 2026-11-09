---
title: Land the light layer
labels: [wayfinder:task]
assignee: zane
state: open
blocked-by: []
---

## Question

Build the light layer per ticket 017's resolution and both addenda, with the six lamp constructions picked in ticket 025, and ship chapter 09.

### The drawing sequence the build implements

- Night, light off: paper background → interior at full colour (no night mix) → night veil (one dark fill right behind the curtain, darkening the interior) → curtain cloth (no night mix — it relies on the colour behind) → sill items (unchanged) → pane wash.
- Night, light on: no veil; interior at full colour → lamp structure (dark silhouette, fill + ink) → emitting part (ink + warm light fill) → ambient (one low-opacity warm fill over the room) → aura (lamp-shaped flat washes, laid over the interior ink lines, under the curtain cloth) → curtain cloth → sill items → pane wash.
- Day: everything at full colour; no veil, no lit bulb, no ambient, no aura; the bulb part draws as a normal object.

### Implementation plan

1. **Styling — roles and the selective night mix** (`src/styling/roles.ts`, `colourway.ts`):
   - New roles: `light` (the warmth colour — emitting fill, ambient, aura), `veil` (the theme paper at a veil alpha — the night veil), `lamp` (the lamp structure's dark fill, no night mix).
   - The night mix becomes per-role: cloth roles (`fabric` / `shade` / `blind`) and the interior roles (`lamp`, `light`) skip it; shell/exterior roles keep it. The `veil` role resolves as the paper colour and only draws at night.
   - The warmth table: rows in the amber family varying tone and strength, stronger than the prototype sheet (higher lightness/chroma); rolled on the `colourway:light` fork — colour never rides the DNA stream.
2. **Engine — the light layer** (`src/core/light/`, mirroring curtain/sill):
   - `index.ts` entry: `expandLight` (rolls the plan), `lightMarks` (draws it off the live DNA stream), `LightPlan`.
   - `catalogue.ts`: the six constructions — tapered-shade floor lamp, arc floor lamp, drum-shade table lamp, small bedside lamp, pendant with shade, bare-bulb pendant — each with structure paths, its emitting region, and the aura shape it casts; two hang from the ceiling line, four stand on the floor line.
   - `drawLamp.ts`: composes structure + emitting + ambient + aura fills per state (night/day, lit/unlit), auras as layered flat washes kept inside the opening, aura fills still (never boil).
   - DNA stream appends after the sill block, fixed order: on/off (2 dark : 1 lit) → lamp kind → location (left : centre : right) → facing (left : right; mirrors the construction and skews the aura). Appending never shifts earlier rolls.
3. **Assembly** (`src/core/window.ts` and its callers):
   - `windowSceneMarks` gains a night flag (callers already derive night from the theme paper); the light block composes between the interior and the curtain cloth. Wall, home page, and demo loops thread the flag.
4. **Tests** (vitest, TDD at the seams):
   - Stream order: appending the light block never re-randomizes existing tenants.
   - Palette: cloth roles skip the night mix; `veil`/`ambient`-strength alphas resolve per the warmth row; unregistered-role guard still throws.
   - Constructions: six kinds roll, location and facing mirror correctly, auras stay inside the opening.
   - Draw order: aura under cloth, veil behind cloth, sill above cloth.
   - Theme gate: day emits no veil, no lit fill, no ambient, no aura.
5. **Chapter 09** (`src/content/chapters/09-light/`): maker's-log prose per the chapter rules, a demo bench with the shared controls (force lit/unlit, lamp kind, location, facing, warmth row, theme), and the demo painter registered via `registerDemo`.

### Verification

`npx vitest run`, `npx tsc --noEmit`, `npx astro build`; both reviews in loop; human eyeball on the wall before close.
