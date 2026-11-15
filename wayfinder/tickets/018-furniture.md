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

Decided 2026-11-15 with the user. An earlier furniture effort on the `furniture-layer` branch was discarded with this resolution — the decisions here supersede it and are the starting point for the rebuild.

- **No dominant element**: a room holds zero to two furniture pieces, plain pieces with no size classes and no dominant roll. The lamp (the light layer's) counts toward the cap whenever the room owns one — even in daylight, where it draws nothing — so a lampless room rolls zero, one, or two pieces and a room with a lamp rolls zero or one. Flipping the theme never re-randomizes a room's furniture.
- **Catalogue** (starting list, weights tuned at build): coat stand, coat rack, ladder shelf, room divider, desk with laptop or monitor. The laptop or monitor is part of the desk construction and never emits — the light layer owns all light; it reads as a small dark shape on the desk top. No TV, no plants (ticket 016 owns greenery).
- **Depth planes**: the room owns six depth planes. The lamp always occupies plane 1; furniture pieces take distinct planes rolled from 2–6, one piece per plane.
- **The room rectangle and the floor**: the insider layer draws a room rectangle larger than the opening — a small margin grown on every side, extra room at the bottom, tuned at build — with a floor line at its base. Furniture stands on that floor line and is drawn even where the wall hides it, so the parallax drift never bares a hard cut, and no piece ever anchors to the opening's bottom edge. The floor sits a short distance below the opening's bottom edge — roughly a tenth of the opening's height, tuned at build — so a desk still clears it into view. The floor line stays undrawn as a stroke; the furniture bases carry it.
- **Edge placement**: each piece hugs one edge of the room rectangle — its side rolled left or right, sitting very close to the edge with a small gap allowed. A soft bias prefers the second piece to the opposite side; overlap stays possible and resolves by plane depth.
- **Colour**: every piece is one uniform gray silhouette — a dedicated furniture role — with the interior detail strokes in light gray, also a dedicated role. No colourways, no per-piece colours; the night theme re-resolves the two roles automatically.
- **Construction**: flat silhouette masses; any interior stroke stays silhouette too. Repeated interior strokes obey the hand rule. No boiling exceptions — furniture boils with the wall. Furniture emits nothing and casts no shadow.
- **Draw order**: planes back to front (6 → 2), then the light block over them — night veil, ambient, aura, lamp on top — so the lamp always stands in front of every furniture piece. Then curtain, then sill: a fully drawn curtain hides the furniture, unlike the sill items, which draw in front on purpose. The furniture block appends after the light on the DNA stream — the stream order is independent of the draw order.
- **No chapter** (user decision, standing from the discarded effort). Build plan: [Land the furniture layer](027-land-furniture-layer.md).

Amended 2026-11-15 at the eyeball bench, the user's call: the interior detail strokes and their light gray role are dropped — every piece draws as one flat gray silhouette, the ladder shelf's boards joining the mass as bars of the same gray. The desk screen wears that same gray at a 4:3 ratio, replacing the small dark shape. The floor dropped from a tenth of the opening's height to the standing line the light layer's lamps already own, with pieces sized in real units so only the upper body clears the sightline. Catalogue grown to fifteen kinds; note the sightline is the gate — the floor sits 0.85 below it, so any piece shorter than 0.85 units is never visible through the window (low tables would need the floor drop shrunk or a placement rule of their own).
