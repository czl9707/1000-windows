---
title: Furniture — the room behind the glass
labels: [wayfinder:grilling]
assignee: zane
state: closed
blocked-by: [017]
---

## Question

What furniture does the insider layer hold? Ticket 003 reserves the dominant element choice (TV, plant, lamp, …) and the prop vocabulary. Decide: whether a dominant element exists per tenant (one big readable shape behind the glass — a bookshelf, an armchair, a floor lamp — chosen from a weighted catalogue with none-dominant) and how it differs from the fine props (sill items, plants — already ticketed), the furniture drawing construction at wall distance (silhouette masses a few strokes wide, foreshortened against the shell's plane), how furniture interacts with the light genes (a lamp as light source versus a lit pane, furniture casting no shadow at this distance), depth in the room (does the insider layer get a second plane behind the sill, or everything pressed to the glass plane), and the append-only stream position of the furniture block. Read the digest's catalogue-as-data and zone-ceiling rules (`docs/reference-digest.md`) before deciding.

## Resolution

Furniture is a plain tenant layer of tall pieces — no dominant variants, 0–5 pieces per room.

**Catalogue** — twelve silhouette kinds: bookshelf, wardrobe, dresser or cabinet, TV on a low stand (permanently off — a fixed dark screen), coat stand, coat rack with hanging shapes, ladder shelf, drying rack, easel, standing mirror, room divider, stacked crates. Three exclusions hold: no lamp (the light layer owns lamps), no plant (ticket 016), and nothing that lives below the sill line — tables, floor cushions, sofas are invisible, because the room's floor sits below the opening and only a piece tall enough to break the sill line can read. Weights tuned at build.

**Depth planes** — six planes behind the glass. The lamp occupies plane 1 whenever the room owns one (the presence gene; drawn only at night, so plane 1 reads empty by day). Planes 2–6 each roll independently: piece or empty, then kind. Any kind is allowed on any plane, soft biases only (reference `lieber` — for example the TV prefers near planes so its silhouette stays readable); deeper planes stand slightly more often empty, so the room thins as it recedes.

**Geometry** — each piece bottom-anchored below the sill line, only its upper part rising into the opening; deeper planes project smaller through the weak perspective; the opening clips at the sides; no interior floor line is drawn.

**Draw order** — depth order, independent of stream order: furniture planes 6 → 2 back to front, then the light block over them (night veil, ambient, aura, then the lamp itself — the lamp always stands in front of every furniture piece), then the curtain cloth (a fully drawn curtain hides the furniture, unlike sill items), then sill items, then the pane wash.

**Colour** — one colourway fork per room: every piece in a room shares one roll, like the curtain's three constructions sharing one cloth. The TV screen wears a fixed dark role instead of a colourway.

**Construction** — a flat filled silhouette mass per piece, one line weight heavier than the sill items', plus a few interior strokes naming the kind (shelf lines, the TV's screen seam, the mirror's glass wash). Repeated interior strokes obey the hand rule. No still marks — furniture boils with the wall.

**Stream position** — the furniture block appends last on the DNA stream, after the light block; `lampLit`'s walk is untouched.
