---
title: Paint 1000 windows — construction map
labels: [wayfinder:map]
---

## Destination

An Astro MDX site in this repo that documents the construction of an infinite hand-drawn window wall as it is built — each chapter quoting the real code behind it and recording the chain of thought — with an embedded demo: a dependency-free TypeScript canvas engine showing an endless wall of windows in every direction. Meta-seed is random per page load; window identity = hash(meta-seed, world-grid coordinates); every window is a seeded tenant with per-window light genes, drawn with the boiling-line pen, idle motion, and pointer reaction.

## Notes

- Methodology source: the reference project ("all my friends are made of javascript"), full docs saved locally at `~/temp-project/site/en-*.txt` (index, blatt, rng, kopfform, merkmale, haar, zonen, raum, stift, druck, wolke, schichten, animation, fallen). The digested form lives in this repo on branch `research/reference-digest` at `docs/reference-digest.md` — read with `git show research/reference-digest:docs/reference-digest.md`.
- Adopted discipline: the engine has zero runtime dependencies; RNG, geometry, pen, and springs are hand-rolled; three-layer split — DNA (who lives there) / Motion (what is happening now) / Style (how it looks); the DNA random-number order is append-only, fields appended never inserted.
- Repo layout: demo engine = vanilla TS modules under `src/demo/` mounted by Astro pages via `<script>`; docs site = Astro + MDX + CSS modules + Radix. Routes: `/` home tracking progress (full demo lives here later), `/docs/[slug]` per chapter. Chapters are working documents: a chapter exists as a stub the moment its decisions start, and each closed milestone fills its chapter in. Header stays title (logo later) + theme switch; chapter navigation moves to a left sidebar later.
- Execution rides on this map (user decision): prototype/task tickets produce code merged to `main` as milestones land; each closed milestone ships its MDX chapter. Research and grilling tickets stay decision-only.
- Comments and docs in English.

## Decisions so far

<!-- one line per closed ticket: gist of the answer, link to the ticket that holds the detail -->

- [How the reference actually builds it — chapter digest](tickets/001-reference-digest.md): deterministic via seed-hash + append-only draw order + named warp traces cached per pen; ~3 ms/frame for 9 heads means the wall must pre-render window scenes keyed by window seed, not recompute per frame.
- [Astro docs scaffold — MDX chapters hosting the demo](tickets/008-astro-docs-scaffold.md): Astro 7 static site with portfolio styling (Geist/Red Hat Mono, token sheet, fixed header); chapters are a typed collection with draft/landed status; demo mounts via `mountAll()` from vanilla-TS `src/demo/`, DPR-aware loop with reduced-motion support; Radix island proven.

## Not yet specified

- Global day/night knob: one uniform time-of-day multiplier over the whole wall. Revisit once per-window light genes exist.
- Pan performance: caching or pre-rendering windows so panning stays smooth with hundreds of windows on screen (the reference's point-cloud chapter is the analog).
- The press layer: paper grain, ink bleed, misregistration — the reference's print-look chapter, not yet mapped to a wall.
- Pitfalls: which of the reference's recorded traps transfer to windows (short strokes, boiling flicker, lockstep twitching).
- Narrative depth: names/doorbells, story vocabulary per tenant, how much written text (if any) lives in the demo.
- "New wall" regeneration UX and shareable seed state.
- Zoom behavior on the infinite canvas.
- Content page structure: left sidebar navigation taking over chapter listing (per-page chapter nav, draft/landed states); header stays title + theme switch.

## Out of scope

- Docs in any language other than English (user decision — single-language site).
