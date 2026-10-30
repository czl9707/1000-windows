---
title: Determinism architecture — meta-seed, window seeds, traced randomness
labels: [wayfinder:grilling]
assignee: zane
state: open
blocked-by: [001]
---

## Question

How does randomness flow through an infinite wall? Decisions to reach: how a window seed is derived (hash of meta-seed + world-grid coordinates — which hash, how coordinates encode); how the reference's traced-randomness idea (tremor keyed to a trace name, hashed and cached) maps to windows that pop in and out of existence while panning — how trace names get namespaced per window so a re-rendered window reproduces its exact tremor; which hand-rolled RNG the engine uses and how many independent streams a window needs; what gets cached per window and what is recomputed on every frame. Read the digest from [How the reference actually builds it — chapter digest](001-reference-digest.md) before deciding.
