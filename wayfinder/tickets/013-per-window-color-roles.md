---
title: Per-window colour roles — genes pick table rows
labels: [wayfinder:grilling]
assignee:
state: open
blocked-by: [007]
---

## Question

How does colour randomness enter the wall? Today `src/styling/roles.ts` resolves three static roles (`ink` / `glass` / `paper`) from the theme's two colours; the reference resolves roles through weighted OKLCH tables picked by per-head genes. Decide: which roles gain per-window colour (the lit pane wash, curtain fabric, add-ons like awnings and window boxes) and which stay theme-bound; the gene → weighted-table-row structure in OKLCH (row list, weights, fantasy-colour threshold above a gene value, the reference's `HAUT_BUNT_AB`/`BUNT_AB` pattern); the dark→light flip analog (`haarDunkel`: a gene flips dark surfaces to light strokes) and how it interacts with ink at fixed L ≈ 0.27 so washes never sink to ink darkness; how a coloured pane wash stays quieter than the lines at `GLASS_WASH`-like alphas; where the tables live (`src/styling/`) so drawing code keeps naming only roles; whether a guard script (the reference's `check-rollen.mjs`) backs the role-only rule. Also settle the ordering contract: the colour gene appends at the end of the insider layer's stream (the `kleidT` pattern — reader-facing grouping never constrains stream order), so existing tenants never re-randomize. Read the digest's "Colour as roles" section (`docs/reference-digest.md`) before deciding.
