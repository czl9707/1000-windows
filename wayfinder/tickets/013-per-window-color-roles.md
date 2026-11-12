---
title: Per-window colour roles — genes pick table rows
labels: [wayfinder:grilling]
assignee: zane
state: closed
blocked-by: [007]
---

## Question

How does colour randomness enter the wall? Today `src/styling/roles.ts` resolves three static roles (`ink` / `glass` / `paper`) from the theme's two colours; the reference resolves roles through weighted OKLCH tables picked by per-head genes. Decide: which roles gain per-window colour (the lit pane wash, curtain fabric, add-ons like awnings and window boxes) and which stay theme-bound; the gene → weighted-table-row structure in OKLCH (row list, weights, fantasy-colour threshold above a gene value, the reference's `HAUT_BUNT_AB`/`BUNT_AB` pattern); the dark→light flip analog (`haarDunkel`: a gene flips dark surfaces to light strokes) and how it interacts with ink at fixed L ≈ 0.27 so washes never sink to ink darkness; how a coloured pane wash stays quieter than the lines at `GLASS_WASH`-like alphas; where the tables live (`src/styling/`) so drawing code keeps naming only roles; whether a guard script (the reference's `check-rollen.mjs`) backs the role-only rule. Also settle the ordering contract: the colour gene appends at the end of the insider layer's stream (the `kleidT` pattern — reader-facing grouping never constrains stream order), so existing tenants never re-randomize. Read the digest's "Colour as roles" section (`docs/reference-digest.md`) before deciding.

## Resolution

Decided across three grilling rounds with the human; supporting research verified against a hand-rolled OKLab implementation (findings summary in `scratch/colour-research.md`, gitignored — the durable numbers land in the styling tables).

**What takes colour.** The soft surfaces and the painted architecture: curtain cloth (`fabric` / `shade` / `blind`), awning canvas, shutter slats, window-box wood, and the frame face (`mullion`, opaque house paint). Staying theme-bound: `ink`, `paper` (the wall texture and the window backing), and `glass` — the pane wash's colour belongs to [Light](017-light.md), which this decision unblocks toward (its other blockers stand).

**Where colour lives.** Entirely in `src/styling/`. Each coloured surface rolls its own colourway off the window seed, on a fork per group (`colourway:mullion`, `colourway:cloth`, ...), so colour never rides the `dna` or `shell` streams and adding or retuning colour rules never re-randomizes a tenant. Sharing was never the rule: "multiple roles can share the same group" is chance, not policy — each roll lands where the weighted list sends it, and the three curtain constructions roll together as one cloth. Within the colour stream, rolls append, never insert. The number of rolls grows freely as features arrive.

**Colourway, not per-role tables.** A *colourway* is a finished colour — hue, chroma, and its own lightness — picked whole from one weighted list, rarity carried in the weights: louder rows are simply rare, and the reference's two-gate threshold pattern is dropped by user decision. A role carries no lightness of its own; it applies only its wash alpha, a chroma cap, and whether the fill carries the pooling echo, plus the roll's hue jitter of about ±6° so neighbours never match exactly. The shipped catalogue is the pastel street the prototype dial settled on (chroma × 0.7 over the pastel base, every row at L 0.8). New roles and new colourways grow as two independent lists.

**Night.** The site's dark theme means night. Night is a mix, chosen over a lightness re-target after the prototype eyeball: every tinted colour sinks into the theme paper, nine parts ground to one part day colour (the dialed 0.9), computed per colour inside the palette resolution, hue and chroma carried through the mix.

**The watercolour recipe.** Fills draw as two overlapping passes (second at +0.05 L, half coverage) so a wash reads as pigment pooling rather than a flat tint; granulation does not survive low alpha. The rim pass (edge darkening) is deferred to the press-layer fog on the map.

**Opening tables.** The pastel street the prototype dial settled on — powder, mint, blush, butter, lilac, chalk at chroma × 0.7, every row L 0.8 — lands as the opening catalogue, freely editable afterwards; roll purity is the only invariant. Alphas: the curtain cloth washes at 0.14 / 0.14 / 0.16 (the dialed strength); every painted surface — the frame face, the awning canvas, the shutter slats, the window-box wood — goes down opaque, because those fills exist to hide the wall and the layers behind them.

**Mechanics.** OKLCH → sRGB conversion hand-rolled in `src/styling/` (zero runtime dependencies); drawing code sees only resolved CSS strings and keeps naming only roles. The guard is a throw in styling when a mark's role has no registered resolution — no grep test (user decision). Roles may merge later if the wall reads too colourful.

Build plan: [Land the colour layer](023-land-colour-layer.md).
