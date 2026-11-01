---
title: How the reference actually builds it — chapter digest
labels: [wayfinder:research]
assignee: wayfinder-charting-session
state: closed
blocked-by: []
---

## Question

Digest every local copy of the reference project's docs chapter (`~/temp-project/site/en-*.txt` — index, blatt, rng, kopfform, merkmale, haar, zonen, raum, stift, druck, wolke, schichten, animation, fallen) into `docs/reference-digest.md` in this repo. The digest must give: (1) the construction order the reference itself followed, step by step; (2) for each mechanism — seeded RNG, trace-name hashing, DNA field order, pen ribbons/pressure curve/boiling, press/paper, point cloud, layer split, motion springs, pointer attention, recorded pitfalls — a short precise summary of how it works with the exact constants it publishes (beat rate, hash sizes, overshoot percentages, width exponents, budget numbers); and (3) the facade equivalent of each mechanism (head -> tenant, sheet -> wall, blink -> TV flicker, and so on). Findings land in the digest file; this ticket holds the pointer, not the content.

## Resolution

The chapters were found at `/home/zain_chen/temp-project/site/` (the `~/.claude/skills/wayfinder/` copies exist only as SKILL.md; the site directory holds the full English set). All thirteen chapters plus the index were read in full and digested with chapter citations.

The two findings most relevant to how determinism and the pen must be designed for an infinite panning wall: first, the reference never lets a random draw depend on draw order in a frame — the pen's warp hangs off an FNV-hashed trace name into a cached field of 52 support values, so the same stroke wobbles identically whether or not other strokes were drawn that frame. That is exactly the property a wall needs: draw whatever subset of windows the viewport shows, in any order, and every pane still boils on its own seed + trace + beat (with a per-window beat offset, or the whole facade twitches in lockstep). Second, determinism is layered: window identity must come from hash(meta-seed, grid coords) with an 8-draw warm-up (neighbouring seeds correlate otherwise), the DNA draw order is append-only as a contract, and every geome cache hangs off the seed only because everything is computed in unit measure and scaled at draw time (homothety) — the same pattern that lets one cached window render serve zoom levels.

Performance numbers that size the wall budget: the reference renders nine heads — contour, hairdos, faces, paper together — in ~3 ms per frame at DPR 2 on 1000×1080 (about 0.3–0.6 ms per head; a depth-buffer head costs 1.9 ms vs 0.6 ms without). That means hundreds of live windows cannot each be re-geometried per frame; the point-cloud chapter's "sample once, per frame only rotate/project/bin" becomes, on the wall, pre-rendering each window scene once to an offscreen canvas keyed by window seed and pose bucket, and per frame only compositing visible chunks — the same cache-key discipline the reference uses (seed-only key, grain tile belongs to its canvas surface, pattern in the key).

Full digest: `docs/reference-digest.md` on branch `research/reference-digest` (construction order, all mechanism summaries with exact published constants — beat 8/s, warp supports 52/12/40 at 0.35, mix 0.62/0.5, ghost layer 32%, overshoot 3.5%, width exponent 0.4 clamped 0.62–1.3, reference size 95, boiling thresholds 0.4/1.2, 96 bins, 67 variants, ~3 ms budget — and a facade-equivalent table including the mechanisms with no obvious wall equivalent).

## Addendum (2026-10-31)

The pre-render recommendation above is superseded by [Determinism architecture — meta-seed, window seeds, traced randomness](002-determinism-architecture.md): the wall shows 15–20 windows at once and every frame redraws every visible window. The ~3 ms/frame measurement stands as the reference's number, not as a wall constraint.
