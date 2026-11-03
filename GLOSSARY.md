# Glossary

## Chapter
One milestone's document on the site: born as a draft when the milestone's decisions start landing, carrying those decisions as they are made, and growing into the milestone's record as its code lands. One chapter per milestone, always the single document for it.

## Meta-seed
The master random value generated on every page load (and on "new wall"). Every window's identity derives from it. Different on each load -> a different wall every visit; stable within a session.

## Window seed
The per-window random value, derived deterministically from the meta-seed and the window's world-grid coordinates. Same coordinates within a session always yield the same window seed, no matter when or in what order the window was first rendered.

## Tenant
Who lives behind one window — the window's identity as a whole: occupant (if any), furniture, curtain, plants, animals, and light. "A window seed is a tenant."

## Dominant element
The single most readable thing in a window scene (an occupant silhouette, a cat on the sill, a lone lamp). Every window has at most one; it carries the story at a glance. Everything else in the window is supporting props.

## Light gene
A per-window inherited trait describing the apartment's lighting: whether lights are on, their warmth (amber lamp, cool ceiling, TV-blue flicker), and curtain density. Identity, not global state.

## Trace
A named drawing path (for example a window frame, a curtain edge). The line tremor is derived from the window seed and the trace's name, so the same window shows the same tremor every frame and across re-renders while panning.

## Boiling
The hand-drawn line's slow wobble: strokes stay still within a beat and slip between beats, at a fixed tempo per second, with each window offset so the wall never twitches in lockstep.

## Beat
One tick of the boiling tempo (8 per second). From the reference study's `takt`. Every stroke's boil re-rolls on the beat; dots never do.

## Beat offset
The per-window phase shift of the beat (reference: `taktVersatz`), derived from the window seed so neighbouring windows never boil in lockstep.

## Hand stream, frame stream
The two noise streams mixed into every stroke's warp. The hand stream hangs on the trace name only — the drawing hand, identical every frame. The frame stream re-rolls on the beat and carries the boiling.

## Hand-only / on-beat bands
Stroke-length bands deciding how much frame stream enters (reference: `koch`). Below the hand-only bound a stroke holds still like real ink; above the on-beat bound it boils fully; between, the boil fades in.

## Pressure
How far a stroke's mid-line thins relative to its ends (reference: `spitz`): 0 leaves a constant-width line, 1 pinches the middle. Divergence from the reference, recorded by human verdict: window lines read best fat at the ends, so the ends never thin and the middle carries the taper.

## Pane
One piece of glass — the unit the shell draws, washes, and opens. A pane carries a flat wash of ink; an opening is bare paper where a pane's wash is gone.

## Shell
The frame construction of a window — archetype, pane layout, open state, sill — as opposed to the tenant behind it (curtain, insider, light). The shell precedes the tenant: its geometry is decided before the DNA stream begins.

## Archetype
The frame construction a window is built as: sliding, casement, or picture. One small weighted catalogue; the seed picks the archetype before anything else about the shell. Every window shares one wide-rectangle outer ratio.

## Pane layout
The named arrangement of glass inside one archetype (for example a two-panel slider, a casement pair). Named kinds picked by one roll, never assembled from independent axes.

## Open state
Whether a window is closed, half-open, or open. Only operable archetypes roll it (sliding, casement); picture is fixed glass. An open slider's back panel glides behind its fixed neighbour, stopping while a strip of its glass still shows; an open casement leaf swings out of the wall — narrowed by the swing's cosine, standing out of the wall at the swing's depth — and carries its pane's glass wash with it.

## Still
A stroke's hard switch that disables the frame stream entirely (reference: `ruhig`) — for marks that must never move, such as hatching.

## Mark
One emitted drawing instruction: a discriminated union — a stroke (trace name, width), a fill, or a dot (radius) — each carrying its 3D points, a dress role (`ink` draws solid; `glass` is the pane wash; `paper` occludes in the background colour), and a numeric depth sort key. Colour and strength both live in the role, resolved by styling. Geometry emits marks; motion places them; style dresses them; the pen draws them.

## Depth
The z coordinate of a point, in unit measure; 0 is the wall plane, larger stands nearer the viewer. The draw stage stable-sorts marks by their depth key and projects each point through weak perspective before the pen sees it.

## Eye
The projection's fixed viewpoint: always the screen's centre, never the pointer, never moved by panning. Each scene feeds the projection its origin's offset from the eye, in unit measure — on the wall, each window feeds its own: its world position minus the camera, plus the canvas's offset from the screen centre. Each point lands at `p·s + eye·(s − 1)` — the parallax: the wall plane stays pinned, nearer layers drift away from the screen's centre in proportion to depth.
