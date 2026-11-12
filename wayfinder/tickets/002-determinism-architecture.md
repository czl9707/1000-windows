---
title: Determinism architecture — meta-seed, window seeds, traced randomness
labels: [wayfinder:grilling]
assignee: zane
state: closed
blocked-by: [001]
---

## Question

How does randomness flow through an infinite wall? Decisions to reach: how a window seed is derived (hash of meta-seed + world-grid coordinates — which hash, how coordinates encode); how the reference's traced-randomness idea (tremor keyed to a trace name, hashed and cached) maps to windows that pop in and out of existence while panning — how trace names get namespaced per window so a re-rendered window reproduces its exact tremor; which hand-rolled RNG the engine uses and how many independent streams a window needs; what gets cached per window and what is recomputed on every frame. Read the digest from [How the reference actually builds it — chapter digest](001-reference-digest.md) before deciding.

## Resolution

Decided 2026-10-31. Baseline first: two tracers confirmed the scheme was settled (hash(meta-seed, coords), 8-draw warm-up, beat offset from seed, append-only DNA order) while the formula and namespacing were not — three spellings of the window identity shipped with the pen chapter (bare `SEED`, `fnv1a("SEED:w:0,0")`, `w0,0:` trace prefixes).

Decisions:

1. **Window seed**: `windowSeed(metaSeed, col, row)` = `fnv1a(`${metaSeed}:w:${col},${row}`)` — the only place grid coordinates exist. Helper added to `src/core/randomness/rng.ts`.
2. **Trace names**: bare ad-hoc ids (`frame-outer-top`), no registry, no address anywhere below the wall layer. The Pen takes the window seed and hashes it into every trace's warp (`fnv1a(`${seed}:${name}`)`) and rolls the beat offset from the seed (`fnv1a(`takt:${seed}`)`) — one Pen serves one window, rendering is a pure function of the seed. (The reference embeds per-figure identity in trace names too, e.g. `kopfform#3`; seed-as-prefix is the same move.)
3. **Streams**: one DNA stream per window (`new Rng(windowSeed)`), append-only, drawn once at mount. Future motion rolls get their own named stream via `fork(seed, label)` (helper added to core) so they never shift the DNA order.
4. **Pen lifetime on the wall**: per-window Pen, created on viewport enter, dropped on exit — no LRU.
5. **Pre-render reversed** (supersedes the recommendation in ticket 001): at most 15–20 windows on screen at once, so every frame redraws every visible window; no offscreen scene cache. This also dissolves the boiling-vs-frozen-cache tension outright.
6. **One spelling**, applied immediately (user asked the cleanup ride this ticket, deviating from the map's decision-only default for grilling): `Pen(tuning, seed, ink)`, bare trace names, `drawWindow(ctx, pen, seed)` signature unchanged; demo drops its inline derivation. Code on branch `canonical-window-seeds`.

Not decided here (stays fog / later tickets): meta-seed generation and "new wall" UX, zoom behavior, motion streams' actual labels.
