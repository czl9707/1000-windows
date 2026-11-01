---
title: Tenant DNA schema — what genes define a window
labels: [wayfinder:grilling]
assignee: zane
state: closed
blocked-by: [001, 002]
---

## Question

What genes does one window seed expand into, and in what order? Decisions to reach: the gene list and its append-only order (occupant presence + silhouette pose, dominant element choice, furniture/prop vocabulary, curtain style, light genes: on/off, warmth, source incl. TV flicker, curtain density, plant/pet); how much variance lives in the window itself (frame shape, sill, glass panes) versus in the wall around it; how the reference scales feature variants (67 feature variants, named feature modules) maps to a prop vocabulary that can grow without re-randomizing existing tenants; which genes are cheap booleans versus measured geometry. Read the digest from [How the reference actually builds it — chapter digest](001-reference-digest.md) before deciding.

## Resolution

Decided 2026-10-31. No up-front gene list. The schema reuses the decision already embodied in `src/core/window-shell/window.ts`: a window seed expands in the fixed nesting **window → curtain → insider (human, light, props, …)**, one DNA stream per window drawn in that draw order.

- The **window layer** (frame shape, sill, panes) carries no DNA genes here; its variance is owned entirely by "Window shell archetypes — frame variants" (009), which feeds measured geometry into the shell before the DNA stream begins.
- The **curtain layer** holds the existing curtain-style gene (panels/cafe/full, already seeded in `window.ts`) and whatever appends later (curtain density, light interaction).
- The **insider layer** holds occupant presence and silhouette, light genes (on/off, warmth, source including TV flicker), and props, appended as chapters demand them.
- Growth rule: the list keeps growing for the life of the project, so new genes **append at the end of their layer's stream, never inserted** — the append-only rule from [Determinism architecture — meta-seed, window seeds, traced randomness](002-determinism-architecture.md). Existing tenants never re-randomize when the vocabulary grows.

### Gene inventory inherited from earlier sessions

Traced from the charted question, the digest's facade-equivalents table (`docs/reference-digest.md`), and the determinism resolution — the starting contents of each layer, in stream order per layer:

- **Window layer** — frame archetype and pane layout (tiled zones; named kinds rolled, never independent axes) come from the archetypes ticket and precede the DNA stream. Attached clutter hangs off the shell: *masses* (awnings, shutters, window boxes) versus *accessories* (vines, cables, decals).
- **Curtain layer** — curtain style (panels / cafe / full, already seeded in `window.ts`), then curtain density (how much pane the curtain covers).
- **Insider layer** — occupant presence (some windows empty); silhouette pose when present; dominant element choice (TV, plant, lamp, …); light genes: on/off, warmth/colour (a row picked from a palette table with weights, fantasy rows above a threshold), source (lamp / TV — TV flicker belongs to motion via `fork(seed, label)`, never the DNA stream); plant / pet; furniture and prop vocabulary; tenancy details (nameplates, doorbells — parked in the map's "narrative depth" fog).

Inherited rules for the catalogue: compatibility is struck **after** the draw, not before (the reference's `nurBei`/`lieber`/`nichtMit` equivalents — pre-filtering candidates would change how many values are drawn); variance skews toward what reads from the street (light and silhouette genes weighted heavy, fine props light — the reference weights eyes over hats deliberately); when an existing gene later gains detail, the new draw appends as its own roll (the `wuerfleSternForm`/`wuerfleSternGroesse` pattern), and the reader-facing grouping order never constrains the stream order (the `kleidT` pattern).
