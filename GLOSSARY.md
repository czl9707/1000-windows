# Glossary

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
A named drawing path (for example a window frame, a curtain edge). The line tremor is derived by hashing the trace's name, so the same window shows the same tremor every frame and across re-renders while panning.

## Boiling
The hand-drawn line's slow wobble: strokes stay still within a beat and slip between beats, at a fixed tempo per second, with each window offset so the wall never twitches in lockstep.
