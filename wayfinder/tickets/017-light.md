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
- **Warmth gene**: when lit, a row picked from a weighted table of warm tones varying in tone and strength — no cool rows, all warm. Rare strong rows sit above the reference's `HAUT_BUNT_AB`-style threshold. The hue settles with the lamp construction (ticket 025), so the table's exact rows wait for that pick.
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

## Resolution addendum — drawing sequence

Revised again 2026-11-08, replacing the night-mix model above with the sequence the window actually draws in:

- The night mix becomes selective. The curtain cloth takes no night veil — it relies on the colour behind it (a lit room glows through the cloth, a dark room sinks it). The interior objects — the lamp, and everything the insider layers will add — take no night mix either. The shell/exterior roles keep the existing night mix.
- The window background — the shell's biggest fill — stays the theme paper colour at all hours, both themes.
- Light off, night: a night veil draws right behind the curtain — one dark fill over the interior, darkening everything behind it. This veil is the only thing that makes an unlit interior read dark; nothing is pre-mixed.
- Light on, night: no veil; the interior draws at full colour, the ambient fill and the aura lay over it, and the curtain cloth reads the lit room through its own wash.
- Day theme: everything at full colour, no veil ever, the bulb part draws like a normal object.

Each lamp construction carries three parts: the structure (a normal object — fill plus ink line, dark silhouette), the emitting part (ink plus light fill when lit at night; ink plus a normal-object fill whenever unlit, both themes), and the aura (stronger than the prototype sheet, light colour stronger too). A new gene aspect joins the light block: the lamp's location in the opening and its facing, rolled simply.
