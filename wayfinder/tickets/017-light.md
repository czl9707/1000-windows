---
title: Light — lit panes, warmth genes, the lamp, and the aura
labels: [wayfinder:grilling]
assignee: zane
state: closed
blocked-by: []
---

## Question

How does a window carry light? Scope fixed by the user (2026-11-08), replacing the earlier wording:

- the on/off gene and its street-readable weight (some windows dark at all hours),
- the warmth gene as a row picked from a weighted OKLCH table (the reference's `HAUT_BUNT_AB` pattern),
- the light's shape: a drawn lamp, and which lamp constructions exist,
- how the aura around the lamp is drawn,
- how the light's colour lands on the other layers — per z-depth layer handling, with the curtain cloth expected to colour differently from the rest,

no TV, no flicker, no source split — the lamp is the only source. The global day/night knob and its boundary against the theme stay in the map's fog. Read ticket 013 (colourway machinery) and the colour chapter before deciding.

## Resolution

Decided 2026-11-08 with the user:

- **On/off gene**: one roll, weights 2 dark : 1 lit — roughly a third of the street reads lit at any hour. Identity off the window seed, never theme-dependent.
- **Warmth gene**: when lit, a row picked from a weighted table of warm tones varying in tone and strength — no cool rows, all warm. Rarity lives in the weights, the colourway's pattern — the strongest rows the rarest, no separate gate. The hue settles with the lamp construction (ticket 025), so the table's exact rows wait for that pick.
- **The lamp**: a drawn lamp is the only source — no TV, no flicker, no source split. It draws as a plain fill in near-pure warmth, the brightest shape in the pane, and takes the dominant-element slot when a window has one. Which constructions exist is ticket 025's question: ten home lamp types, the user picks.
- **Aura**: local, anchored at the lamp, its shape following the lamp construction — a lamp fills the room in its own shape of light. Drawn as a `Still` fill (never boils), kept inside the opening: no spill past the frame.
- **Colour model**: in a lit room under the night theme, everything behind the glass resolves against the light colour instead of the night ground — the room background (the largest fill) and the curtain cloth take the warmth as their mixing ground, and the aura lays on top of that. Whether the aura composes through colour mix or as layered washes is landing-time tuning. Sill items stand in front of the source, so the face turned to us is unlit — they keep the existing night-mix resolution and stay dark.
- **Theme gate**: light draws only under the dark theme — nobody turns a lamp on in daylight. The gene still rolls off the seed regardless of theme, so identity never changes; the light theme draws every window as if off.

Build plan: [Land the light layer](026-land-light-layer.md). Lamp constructions: [Lamp constructions — ten home lamps](025-lamp-constructions.md).

## Resolution addendum

Revised 2026-11-08 after the lamp-sheet prototype round (see ticket 025):

- The aura lays directly over the layers behind it as drawn marks — an overlying wash that passes over the ink lines too — replacing the mixing-ground model above: the room background and curtain cloth resolve as any night surface, and the light arrives on top of them.
- A lit room also carries an ambient light: one simple low-opacity warm fill covering the whole room interior, beneath the aura.
- Auras run stronger in general than the prototype sheet showed.
- The night veil narrows to the street side: the painted street roles keep sinking into the ground at night; the interior roles — curtain cloth, sill ledge, sill items, the lamp, everything yet to come inside — resolve without the veil, their night look coming from the interior background holding the ground colour in both themes. A lit room's interior reads through the marks laid on top.
- The lamp is furniture in both themes: its structure and emitter draw unlit in daylight (ink + ordinary fill); the light itself — the emitter's light fill, the ambient, the aura — draws only at night. The earlier "light draws only under the dark theme" narrows to the light, never the lamp.
- The lamp has three parts: the structure, drawn like any object (fill + ink line); the emitter, the part that lights (ink + light fill when lit at night, ink + ordinary fill otherwise); the aura, stronger than the prototype sheet in both reach and colour strength.
- The gene gains location and facing: where the lamp sits in the room and which way it faces, rolled simply.
