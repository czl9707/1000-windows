# Glossary

## Chapter
One milestone's document on the site: born as a draft when the milestone's decisions start landing, carrying those decisions as they are made, and growing into the milestone's record as its code lands. One chapter per milestone, always the single document for it.

## Meta-seed
The master random value generated on every page load (and on "new wall"). Every window's identity derives from it. Different on each load -> a different wall every visit; stable within a session.

## Window seed
The per-window random value, derived deterministically from the meta-seed and the window's world-grid coordinates. Same coordinates within a session always yield the same window seed, no matter when or in what order the window was first rendered.

## Tenant
Who lives behind one window — the window's identity as a whole: occupant (if any), furniture, curtain, plants, animals, and light. "A window seed is a tenant."

## Furniture

The insider layer's standing pieces — what the room behind the glass holds. A room owns zero to two pieces, plain pieces with no dominant one among them; the lamp counts toward that cap whenever the room owns one. Each piece hugs one edge of the room and stands on the room's real floor at its own depth plane, drawn as one uniform gray silhouette. A desk's screen belongs to the desk's construction and never emits, wearing the same silhouette gray as its desk. The plants — the room's greenery, from the monstera to the cactus — are furniture kinds like any other, rolled from the same pool with no mechanism of their own. Furniture is tenant identity, not state.

## Curtain
The window covering — cloth or blind hung behind the glass. A tenant trait: some windows carry one, some stand bare. Four kinds — panels, drapes, venetian, roman — each a named construction with its own ceiling on how much of the opening it may cover; coverage rolls in discrete levels — bare, lightly dressed, half, full — mostly bare or light, a rare window full. Its dense line work obeys the hand rule, and the hanging cloth (panels, drapes) hangs on verticals alone. The curtain's density is curtain identity, not a light trait.

## Sill layer
The tenant layer between the curtain and the insider layer: at most one small prop on the inside ledge. One roll decides presence and corner — half of all sills stand empty, and a present item anchors into its rolled corner. Sill items draw in front of the curtain cloth and behind the pane wash, so even a fully closed curtain never hides them. The sill-sized potted plant belongs here; larger greenery rolls with the furniture.

## Colourway
The finished colour one of a tenant's coloured surfaces wears — curtain cloth, awning canvas, sill ledge, window box, and the painted frame face each roll their own off the window seed, from one weighted list; the curtain's three constructions roll together as one cloth. Two surfaces land on the same colour only by chance. A colourway is tenant identity, not state — it never changes with the page theme. Most rolls land on quiet, pale families; louder ones exist and stay rare.

## Night
What the site's dark theme means for the wall: the same tenants and the same scene re-read under darkness, never a different scene. Every coloured surface sinks most of the way into the dark ground — the same mix for every surface — so night is the day palette mixed into the paper, hue kept, and no separate night palette exists.

## Hand rule
How dense line work is drawn on paper: a run of dense lines is never fully drawn — some are omitted outright, and a kept line runs over only part of its span, the fill carrying the texture instead. Picked by the golden-angle sine, deterministic, no stream draw. Object edges (hems, bars, rails, the roman's rod) are not dense line work and draw full.

## Light gene
A per-window inherited trait describing the apartment's lighting: whether the room owns a lamp (two rooms in three do), whether it burns (even odds among owned lamps), and the warm tone and strength of its colour. Identity, not global state — the gene rolls off the window seed regardless of theme, and draws only under the night theme: nobody turns a lamp on in daylight. The lamp always occupies the room's frontmost depth plane, standing in front of every furniture piece; a lampless room is simply a dark one. The lamp's emitting part keeps its own colour whenever off; the sill items stand in front of a lit lamp, so they keep their unlit faces.

## Aura
The lamp's local light in a lit room: a glow whose shape follows the lamp construction — a shade throws its cone, a bare bulb radiates its pool. Drawn as flat low-alpha washes laid directly over the layers behind it, ink lines included, and kept inside the opening. The falloff is nested passes anchored on the emitting part, so the glow fades away from the lamp and never drifts off it when the opening clips the shape. A `Still` mark: it never boils.

## Ambient
The room-wide light of a lit room: one simple low-opacity warm fill covering the whole interior, beneath the aura, so the room reads lit before the eye finds the lamp.

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
One emitted drawing instruction: a discriminated union — a stroke (trace name, width), a fill, or a dot (radius) — each carrying its 3D points, a dress role (`ink` draws solid; `glass` is the pane wash; `paper` occludes in the background colour; the painted roles `mullion`, `awning` with its laid-thin rung `awningThin`, `sill`, and `box` occlude in their own paint; the cloth roles `fabric`, `shade`, and `blind` dress curtain fills by construction; the interior roles carry the light layer — `lamp` and `lampShade` its structure and unlit emitter, `light`, `ambient`, and `aura` a lit room's warmth, `veil` an unlit night room's darkening — and the furniture role `furniture` dresses the room's pieces as one gray silhouette), and a numeric depth sort key. Colour and strength both live in the role, resolved by styling from the window's colourway. Geometry emits marks; motion places them; style dresses them; the pen draws them.

## Depth
The z coordinate of a point, in unit measure; 0 is the wall plane, larger stands nearer the viewer. The draw stage stable-sorts marks by their depth key and projects each point through weak perspective before the pen sees it.

## Eye
The projection's fixed viewpoint: always the screen's centre, never the pointer, never moved by panning. Each scene feeds the projection its origin's offset from the eye, in unit measure — on the wall, each window feeds its own: its world position minus the camera, plus the canvas's offset from the screen centre. Each point lands at `p·s + eye·(s − 1)` — the parallax: the wall plane stays pinned, nearer layers drift away from the screen's centre in proportion to depth.
