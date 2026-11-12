---
title: Sill items — clutter on the inside ledge
labels: [wayfinder:grilling]
assignee: zane
state: closed
blocked-by: []
---

## Question

What sits on the sill inside the glass? Decide the vocabulary (books, mugs, radio, folded laundry, a row of jars — the small-prop end of the tenant's life), how many items a sill carries (a weighted count, none dominant, per the add-on pattern from ticket 010), each item's drawing construction (flat silhouettes versus measured masses — which props earn real construction), how items sit in the painter's order (behind the glass, in front of curtains or behind them, occluding the pane wash without piercing the frame), item placement along the sill (a seeded spread with a minimum-gap rule so props never stack into a tower), and the append-only stream position for the sill-item block at the end of the insider layer's prop section. Read the digest's hair-masses-versus-accessories split and the catalogue rules (`docs/reference-digest.md`) before deciding.

## Resolution

Decided with the user over two grilling rounds:

- **Layer and stream position**: the sill items are their own tenant layer between the curtain and the insider layer — not the insider layer's first block. The layer rolls unconditionally after the curtain block on the DNA stream (a mug with no curtain is a fine tenant), and plants, furniture, and the occupant append after it when their tickets land. `AGENTS.md` now names this shape: the tenant walk reads curtain, sill, then whatever appends, each layer contributing a roll function and importing nothing of the layer before it.
- **Presence and placement in one roll**: one roll decides both — side `left : right : none` at `1 : 1 : 2`. Half of all sills stay empty; when an item is present it anchors into the rolled corner with a small inset from the jamb. No free placement, no spread, no gap rule.
- **Vocabulary**: five kinds, one item per sill at most — books 3 / mug 3 / jars 2 / small plant 2 / clock 1. The radio and folded laundry were dropped for detail discipline; a small plant entered.
- **Construction**: one flat side-silhouette style for every kind — a closed outline mass plus a few interior strokes carrying the kind's identity. No measured 3D masses at wall distance. An item never grows taller than about half the pane opening.
- **Painter's order**: items draw in front of the curtain cloth, behind the pane wash — one depth bucket between cloth and glass. A fully closed curtain never hides the sill item; the sill ledge sits in front of the curtain plane. The item's base sinks a hair past the opening's inner edge, behind the frame's bottom rail — the outer frame runs at the sill's level, so an item standing on the indoor ledge shows its base cut by the rail (amended after the visual review round); the frame paints over it, and the item never pokes past the frame run.
- **Colour**: no new mechanism — no per-item colourway groups. Line work at the lightest weight; fills dress in the existing normal colour roles, chosen case-by-case per kind when each construction is drawn.
- **Boundary with ticket 016**: the sill plant is a sill-sized potted silhouette, its own thing. Ticket 016 keeps floor plants, hanging baskets, and window boxes. A shared plant-drawing helper may emerge when 016 lands — noted, not built now.

Build plan: [Land the sill layer](024-land-sill-layer.md). No new MDX chapter for this step (user decision); the home wall is the exhibit.
