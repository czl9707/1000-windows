---
title: The human — tenant silhouette at the glass
labels: [wayfinder:grilling]
assignee:
state: open
blocked-by: [018]
---

## Question

When is a window occupied by a person, and what does the tenant look like? Ticket 003 reserves occupant presence (some windows empty) and silhouette pose. Decide: the presence gene and its weight (how many windows hold a human — the street should not read as a crowd), the silhouette construction (dark ink mass at the glass — head and shoulders, or full figure back-lit by the room; which poses read at wall distance), pose vocabulary (facing out, phone glow at the chin, holding a mug, waving — a short named list, the archetype pattern: roll the pose kind, never independent limb angles), how the silhouette sits in the painter's order (in front of furniture and curtains, behind the glass line, maybe holding a sill item), scale rules (a human taller than the visible pane reads wrong — the zone-ceiling rule), and the append-only stream position of the occupant block. Read the digest's DNA field-order contract and feature-variant weighting (`docs/reference-digest.md`) before deciding.

### Note from ticket 018 (furniture)

The insider layer now has a depth model: six planes, at most one occupant per plane, the lamp always in plane 1 ([Furniture](018-furniture.md)). The human silhouette must take a plane in that model — likely its own or the nearest furniture plane — and draws under the light block's veil, ambient, and aura like every interior mass.
