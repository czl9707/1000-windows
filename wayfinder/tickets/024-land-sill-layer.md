---
title: Land the sill layer
labels: [wayfinder:task]
assignee:
state: closed
blocked-by: []
---

## Question

Build what [Sill items — clutter on the inside ledge](015-sill-items.md) decided. No new MDX chapter for this step (user decision) — the home wall is the exhibit; the chapter ships later with the insider layer's story.

## Implementation plan

Consumers of the entry points today: `src/core/window.ts` (`windowSceneMarks`, `drawWindow`), `src/core/window.test.ts`, the curtain module's own tests, and chapter 07's demo (pinned plans — unaffected). The colour benches never touch the streams.

1. **The layer entries** — `src/core/curtain/index.ts`, `src/core/sill/index.ts`:
   - Each layer exposes one drawing entry over the shared DNA stream: `curtainMarks(rng, opening)` / `sillMarks(rng, opening)` roll the layer's block off the live `Rng` and draw it. `expandCurtain` takes the live `Rng` (`fork(seed, 'dna')` replays identically for existing tests); `pinnedCurtain` stays as-is for the plates.
   - The plan-based drawers stay exported as `clothMarks(plan, opening)` / `itemMarks(plan, opening)` — the pinned-plan seam for demos and drawer tests.
   - `windowSceneMarks(seed, plan)` in `src/core/window.ts` assembles the layers off one `fork(seed, 'dna')` in append order; the cloth → ledge → wash ladder is pinned by the drawer tests, not a runtime guard.

2. **Catalogue** — `src/core/sill/catalogue.ts`, pure data following the curtain's catalogue shape:
   - `SIDES`: `left : right : none` at `1 : 1 : 2` — one roll decides presence and corner; `none` ends the block (no kind roll, plan says `present: false`).
   - `KINDS`: books 3 / mug 3 / jars 2 / small plant 2 / clock 1.
   - Constants: `CORNER_INSET` (the anchor's gap from the inner jamb), `MAX_HEIGHT` (about half the inner opening's height), `SILL_ITEM_DEPTH` (point depth between the curtain's `-0.06` and the wall plane, e.g. `-0.03`), `SILL_ITEM_Z` (sort bucket between `CURTAIN_Z` = −5 and `SHELL_Z.glass` = 0, e.g. −2).

3. **Roll** — `src/core/sill/sill.ts`:
   - `SillPlan` discriminated union like `CurtainPlan` (`BareSill` / `AnchoredSill` with `side: 'left' | 'right'`, `kind`, and the measured jitters).
   - `expandSill(rng: Rng)`: side → kind (skipped entirely on `none`) → the item's measured rolls (width jitter within its silhouette band; appended at the end, never between).
   - `pinnedSill(kind, side, overrides)` for future plates, mirroring `pinnedCurtain`.

4. **Drawer** — `src/core/sill/drawSillItems.ts`, pure emitter like `drawCurtain.ts`:
   - One construction per kind, all one style: a closed side-silhouette outline (`fill` mark) plus a few interior identity strokes (`stroke` marks) — spine lines for books, a handle arc for the mug, rim lines for the jars, leaf strokes for the plant, face and hands for the clock.
   - Every stroke at `WEIGHTS.texture`; fills dress **existing** roles case-by-case per kind, chosen when each construction is written — no new `ColorRole`, no styling change at all (`ROLE_RESOLVERS` already covers every role).
   - Points live on the ledge inside `innerRect(plan.faceWidth)` at `SILL_ITEM_DEPTH`, the mark's `z` only ever `SILL_ITEM_Z`; trace names `sill-<kind>-<part>`, unique within a window.
   - The anchored item hugs its rolled corner with `CORNER_INSET`; height capped by `MAX_HEIGHT`.

5. **Wiring** — `src/core/sill/index.ts` exports `expandSill`, `pinnedSill`, `sillMarks(plan, opening)`, `SILL_ITEM_Z`; `windowSceneMarks` appends `sillMarks(...)` after the curtain marks. `drawWindow`'s signature does not change; the wall, the demos, and the home page get the layer without further edits.

6. **Tests** — beside, the curtain precedent (`curtain.test.ts` / `drawCurtain.test.ts`):
   - Catalogue: side weights (`1 : 1 : 2` — about half the sills bare), kind weights.
   - Stream: `expandSill` reads **after** the curtain's draws (replay both rolls by hand off one `fork(seed, 'dna')`, the existing stream-order test's pattern, extended through both layers); appending the sill block shifts no curtain roll; the shell's `fork(seed, 'shell')` untouched.
   - `none` draws nothing: `sillMarks` of a bare plan is `[]`.
   - Geometry: the anchored silhouette sits inside `innerRect`, honours `CORNER_INSET`, never exceeds `MAX_HEIGHT`; unique trace names.

7. **Verify**: `npx tsc --noEmit && npx astro build` green; eyeball the home wall — an item reads in front of a fully closed curtain, stays under the glass wash, and the wall never re-randomizes (same meta-seed, same tenants).

## Resolution

Built and verified — 152 tests, `npx tsc --noEmit`, and `npx astro build` all green, uncommitted on `colour-layer` pending the user's go-ahead.

- `window.ts` walks the DNA stream: one `fork(seed, 'dna')`, curtain then sill through the layer entries. The cloth → ledge → pane-wash ladder is pinned by the drawer tests — the sort puts every mark in its place, and a constant drift is a code change the tests catch.
- `src/core/sill/` follows the curtain's shape: `catalogue.ts` (side 1:1:2, kinds, width-jitter band, the ledge depth and bucket), `sill.ts` (`expandSill` over the live generator), `drawSillItems.ts` (five flat silhouette constructions, `WEIGHTS.texture` line work, fills in existing roles — paper for the ink-only kinds, glass for the jars, mullion pot with fabric foliage for the plant), `index.ts` carrying `sillMarks` as the public seam.
- `window.ts` appends `sillMarks(tenant.sill, opening)` after the curtain marks; no consumer below changed.
- Tests at four seams: the sill block's append order and roll sequence (`src/core/sill/sill.test.ts`, expectation replayed by hand off a fresh fork), the sill rolls, the drawer's geometry (both corners, containment, height ceiling, unique traces, per-kind roles), and the assembled scene (sill marks present iff the stream rolled one, sorting under the wash).
- Reviewed in loop with the two-axis code review and the quality review; fixed from their findings: the mug handle now turns toward the room (it previously poked past the jamb on right-anchored items), the drawer test runs both corners, the z-ladder prose no longer copies bare numbers (the walk's guard is the one authority), the shell/cloth assertions in `window.test.ts` compose their layers directly instead of sniffing the merged scene, and `KIND_ROLL` → `KINDS` to match the curtain catalogue's vocabulary.
- Two plan amendments: `pinnedSill` is deferred until a sill chapter or demo needs plates (no consumer exists in this step; building it now would be a dead export), and the `MAX_HEIGHT` constant is unnecessary — the per-kind silhouette heights are the one authority and the test pins the ceiling.
- Visual review round four (user picks from the ten-type prototype sheet): the sill plant gained a vocabulary of seven constructions — rubber, snake, split-leaf, cactus row, fan palm, bushy herb, flowering — picked uniformly off a new `plantKind` roll appended after the book count (rolled for every kind, read only by plants, the slatShare pattern); the plant's sill-kind weight doubled to 4; the books tuck into the side frame band (`SIDE_TUCK`), the row's outer end cut by the jamb like the base by the bottom rail. Every construction verified in the browser through the real pipeline, then mass-tuned (blade widths, lens fills, wedge spread) until the fills read at wall distance.
- Visual review round five (user: mugs, jars, and some plants still stuck to the jamb): the books-tuck rewrite had silently dropped the corner inset — every non-book item sat flush at the jamb, and the old inset test asserted only an upper bound, so it passed vacuously at zero. The inset is restored in `spot()`, and the test pins both bounds: non-book kinds hold `CORNER_INSET` from the jamb on either side, books cross it into the band. Verified in the browser, both themes.
- No chapter, no demo, per the user decision; the home wall is the exhibit. Human eyeball pending.
- Visual review round (user screenshots through a headless browser, both themes): the item base now sinks behind the frame's bottom rail (`LEDGE_OVERLAP`, always under the thinnest face so the rail covers it), and the shell's frame face narrowed (`FACE_WIDTH_RANGE` to `0.03`–`0.06`) — the mullion read heavy against the glass. Both verified in the browser, night and day.
- Visual review round two (user verdict: bare line work, unreadable constructions): nothing fills in `paper` any more — every kind wears a visible wash from the existing roles (books and clock in the frame paint, the mug in box wood, the jars keep their glass bodies and gain fabric contents, the plant keeps pot-plus-foliage); the mug gains a rim line, the jars a content line, the clock a centre dot.
- Visual review round three (user verdict on the constructions): the books roll a volume count (3–6, appended after the width jitter on the sill block, the curtain's rolled-but-unread pattern) and vary each volume's height and thickness off the golden-angle sine, with a sine pick giving some books a second fill pass — two strengths of the frame paint, never all; the books and the jars draw every vertical (each volume's left edge, the row's closing edge, both sides of every jar — no omissions); the books and clock shrank; the corner inset widened so nothing reads as stuck to the frame. Verified in the browser, both themes.
- Refactor (user ask): `src/core/tenant.ts` dissolved — the walk is two calls in `window.ts`; each layer's module entry unified into one drawing function off the live stream (`curtainMarks(rng, opening)`, `sillMarks(rng, opening)`), with the plan-based drawers renamed `clothMarks` / `itemMarks` as the pinned-plan seam for the demo and the drawer tests. The z-ladder guard dropped with it (user call: draw order is the sort's job, and the drawer tests pin each layer's bucket between its neighbours — a runtime throw is overkill). The assembled scene's SHA-256 fingerprint is identical before and after on four seeds — no draw moved; the stream-order tests live in `src/core/sill/sill.test.ts`.
