---
title: Curtains — fabric on the pane
labels: [wayfinder:grilling]
assignee: zane
state: closed
blocked-by: []
---

## Question

What does the curtain layer grow into? The old `drawCurtain` (panels / cafe / full, drawn straight to canvas) died with `window.ts` in the shell rework — nothing tenant-shaped has landed since, so nothing re-randomizes and the layer is rebuilt fresh into the marks pipeline, in the curtain-layer stream position ticket 003 reserved. Decided: the curtain's drawing construction (a fabric mass draped in the shell's plane — where does it hang from, how does it fold), density as a measured gene (how much pane it covers — a zone ceiling, never a measure), fabric appearance without naming colours (fold shading through ink density or washes, per the role-only rule), how a curtain reads at wall distance versus in a single-window demo, and where the light-interaction gene appends later (a lit window behind a full curtain must read differently — the hook lands here, the light genes themselves in [Per-window colour roles and light](017-light.md)). Read the digest's zones and layer sections (`docs/reference-digest.md`) before deciding.

## Resolution

Decided 2026-11-03. The curtain is the tenant's first layer, hung behind the glass, living in `src/core/curtain/` (catalogue stream + pure cloth drawer, the window-shell pattern).

- **Presence gate** — the curtain stream's first roll: `none 2 / covered 3`, so roughly 40% of windows stand bare. When the gate rolls false the layer's stream ends: no kind roll, no coverage roll, no cloth.
- **Kinds** — one flat weighted catalogue of home coverings: `panels 4 / drapes 3 / roller 2 / venetian 2 / roman 2` (the old `full` renamed `drapes`). Café tiers, vertical blinds, sheers, tie-backs, and valances stay out; the append-only rule lets any of them land later as an append without touching an existing tenant (sheer = a fill-strength variant of drapes, tie-back = a panels variant, valance = a top trim over any kind).
- **Coverage** — one desired-coverage roll skewed small (plain range roughly 0.15–0.6, outlier stretch upward, the reference's `mitAusreissern` pattern), clamped after the draw by the kind's zone ceiling — the zone is the ceiling, never the measure: drapes and roman may reach near the whole opening, panels stay in the side strips, roller and venetian descend to their rolled height.
- **Construction** — cloth as a fill in a new `fabric` role, fold strokes in `ink` on the band edges; the curtain reads from per-band opacity steps plus a slight ink-strength mottling (no texture pass, never a colour name). Rod, hem, slats, and the roller bar are ink lines. The cloth hangs inside the frame's inner opening with per-window jitter on rod height and widths; its points sit at small negative depth behind the wall plane, so the pane wash draws over it and an open casement leaf plausibly swings in front. One construction at every render size — no level of detail; the only size variance is coverage.
- **Light** — nothing reserved here. The per-window light genes and their cloth interaction (a lamp glowing behind drapes, TV flicker through them) are [Per-window colour roles and light](017-light.md)'s alone; this layer hands over the genes 017 needs.
- **Glossary** — curtain density moved out of the "Light gene" entry into the **Curtain** entry: it is curtain-layer identity, and the light genes are on/off, warmth, and source only.

Build plan lives in [Land the curtain layer](022-land-curtain-layer.md).

### Addendum — revised during the build, 2026-11-03

Two verdicts from the page while [Land the curtain layer](022-land-curtain-layer.md) was in flight: **roller** leaves the catalogue (too plain a read; three kinds of top-hung cloth were too many of the same silhouette) — the kinds are `panels 4 / drapes 3 / venetian 2 / roman 2`; and **every curtain line draws at the texture weight** (`WEIGHTS.texture`, the catalogue's lightest) — rod, hem, folds, slats, bars alike, the cloth's hand reading quieter than the frame's own lines. Both changes are catalogue/dress edits the free-edit rule permits; the stream's roll shape is unchanged.

Two further verdicts the same session: the cloth resolves **per construction** — `fabric` for the hanging cloth (panels, drapes), `shade` for the roman's flat cloth, `blind` for the venetian's slat rows, styling-owned strengths behind the role rule, tuned on the page against the strong test backing to 0.6 / 0.6 / 0.8 — and the stream appends a **blind openness** roll after drape side (0–0.35 mostly, outliers to 0.8, rolled for every covered window, read by the venetian alone: each slat row runs opaque down its closed share of the row, transparent below, hard to both jambs with no padding — closed, the rows join into one opaque blind).

### Addendum — revised during review, 2026-11-04

Three verdicts from the page and the review loop: the **coverage roll became discrete levels** — `0 / 0.3 / 0.6 / 1` at weights `4 / 4 / 1 / 1` — replacing both the presence gate and the outlier roll; the zero level *is* the bare window (roughly two in five) and ends the stream, and the zone ceiling still clamps after the pick (panels pull 0.6 and 1 both onto their 0.4 dressing ceiling). The dense line work obeys the **hand rule** — a run of dense lines is never fully drawn: some omitted outright, a kept line drawn over only part of its run, the fill carrying the texture (glossary entry added). The hanging cloth hangs on **verticals alone**: panels and drapes draw no line across the top; the roman's rod and the venetian's rail stay as object edges. The first two are catalogue/stream edits the free-edit rule permits; the wall re-randomizes once as the stream shape changes.

A later verdict the same day: the cloth resolves in the **ink colour at a whisper** — 0.08 for `fabric` and `shade`, 0.12 for `blind` — reading as a shade darker than the paper it covers, visible at wall distance, quieter than the lines (the earlier paper-coloured cloth vanished against the backing); and the venetian's row ratio **reversed**: the roll now *is* each slat row's opaque share (renamed `slatShare`, same range 0–0.35 mostly with outliers to 0.8), so lighter rolls show more glass and the 0 roll stays the closed blind drawn full.
