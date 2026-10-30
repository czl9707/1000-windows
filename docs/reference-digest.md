# Reference digest — "all my friends are made of javascript"

Digest of the local English copies of the reference project's documentation chapters
(`index.html`, `en-blatt.txt`, `en-rng.txt`, `en-kopfform.txt`, `en-merkmale.txt`,
`en-haar.txt`, `en-zonen.txt`, `en-raum.txt`, `en-stift.txt`, `en-druck.txt`,
`en-wolke.txt`, `en-schichten.txt`, `en-animation.txt`, `en-fallen.txt`).
Each claim names its chapter. The reference is a deterministic avatar press:
nine heads on a sheet, sixty frames a second, zero runtime dependencies besides
Vite/TypeScript/Vitest (index).

## 1. Construction order

The order the reference itself built things in, as far as the chapters reveal it:

1. **One deterministic generator first.** The RNG (mulberry32, warm-up, conveniences,
   forks) predates everything; "the hardest promise this project makes" forced a rule on
   every later change (rng).
2. **Head geometry as pure unit-measure math.** The ellipsoid plus four deformers
   (`kopfPunkt`), everything at `mass = 1`, target size joined only at draw time as
   `ctx.scale` — explicitly "the precondition for the cache" (kopfform).
3. **Layout as its own forked stream before features.** The four layout genes got the
   stream `'layout'` because feature choice depends on position; a fork makes the two
   streams independent so layout could change without re-rolling any face (rng, zonen).
4. **Zones derived from the four genes** — tiled regions in spherical coordinates, so
   feature size is capped rather than derived (zonen).
5. **Rotate/project/field** (`raum`): fixed yaw→pitch→roll order, weak perspective, the
   `Feld` anchor so no feature function knows about rotation.
6. **Drawing order as a layer list** — originally "the order of seventeen calls", later
   written down as a stable-sorted layer list because every stroke may paint over what
   is beneath (blatt).
7. **Point cloud cache** (`wolke`) built on the unit-measure decision: sample the
   surface once per head, per frame only rotate/project/bin.
8. **The pen** (`stift`) — ribbon strokes, named-trace warp, beat — depends on every
   frame being redrawn.
9. **The press** (`druck`) — misregistration, bleed, paper grain, colour roles — added
   because "the surfaces and the sheet beneath them" still looked like vector graphics.
10. **Hair and headwear by successive constructions**: first the shell masses and
    accessories, then the beanie as the first body in a depth buffer, the hat followed
    it, the helmet was "the fifth construction" (haar). The full beard is its own thin
    path (drawn, not measured).
11. **The workshop (re-roll) built on old decisions, not new computation**:
    `zeichneKopf` already took a DNA; the `Wurf` address is seed plus deviation (blatt).
12. **Motion last in the layer sense** — pure computation (`app/blick.ts`), arriving in
    the style ready-made (animation, schichten).
13. **Guards came last of all**, as scripts in `npm run check`, each behind a rule that
    had already been violated once (schichten, fallen).

Features were added over time strictly by appending: `kragen`, `zeichen`, `pupille`,
`zierrat`, colour gene `kleidT` came later and stand at the end of the draw order;
outliers were added August 2026 without any seed's features shifting; `monolid` (weight
1.5) was a later vocabulary gap-fill; per-head mouth width was added 21.08.2026
(rng, merkmale).

## 2. Mechanism summaries

### Seeded RNG (rng)

- PRNG: **mulberry32**, fourteen lines, no `Math.random()` anywhere in the drawing path,
  no library.
- **Stream discipline**: one raw source; `range`, `int`, `pick`, `chance`, `weighted`
  all draw from the same function `r`, so the stream can be recorded and played back.
- **Warm-up**: `macheZufall` throws away **8 draws** before handing a generator out —
  neighbouring seeds (the normal case in a grid) correlate visibly for the first values
  of an LCG-like source.
- **Outliers**: `mitAusreissern(rng, a, b, aussenA, aussenB)` — 8 of 10 draws land
  exactly in the plain range, only the outermost tenth on each side stretches to the
  outlier bound. One draw from the stream, like `range`.
- **Record and play back** (`abspielen`): used once — the nose drawn a second time over
  the beard must be the *same* line. On overflow the tape repeats from the start instead
  of crashing.
- **Forks**: `strom(seed, label)` = an FNV hash over the label combined with the seed;
  same seed + same label always yields the same independent stream. Named side streams
  include `'layout'`, `'handschrift'` (style head data), `'zacken'`, `'feder'` (motion
  dice), `'name'`, `'marke'`, `'kopfform#3'` (edition suffix per throw), `'hand:haar:igel#3'`.
  Formerly `seed ^ 0x64757477`-style hex words; named labels replaced them.
- **Names**: syllable names from `mulberry32(seed · 2246822519)` with four warm-up draws,
  a third syllable in ~1 of 5 cases. Name → seed is the same **FNV-1a** hash starting
  from zero; Unicode-normalised (case-folded, doubled spaces collapsed, composed equals
  decomposed; real diacritics preserved). Measured against 2000 German names: no
  collisions; ~1 collision pair expected per 100,000 distinct names. `?kopf=` beats
  `?name=` in the address.
- **Catalogue is data**: weights + conditions in a list; `nurBei` hard (variant drops
  out), `lieber` soft (weight triples), `nichtMit` pairwise; if everything drops out the
  **unfiltered list wins** (a category may never be empty).

### Trace-name hashing (stift)

- From the trace name (`"kontur"`, `"auge-l"`) an **FNV hash** makes a start value, from
  that **a field of 52 support values**.
- Cached in a **`Map` on the pen** — the same trace is needed several times per frame; a
  head does not have a hundred of them. The cache lives on the pen instance, not
  globally.
- The warp hangs off the name precisely so a skipped stroke (closed lid = one stroke
  instead of four) cannot shift any other line's randomness ("the flickering face", stift
  and fallen).

### Beat and boiling (stift, animation)

- `TAKT_JE_SEKUNDE = 8` beats per second; per head
  `takt = Math.floor(zeit * TAKT_JE_SEKUNDE + d.taktVersatz)`, `taktVersatz` rolled per
  head from the seed (nine heads in lockstep look like a display fault).
- Inside the pen **two streams are mixed 0.62 to 0.5**: one hangs only off the seed
  (the hand), one off the beat too (the frame).
- **Boiling threshold by stroke length** (`koch`): below **0.4** hand only (mouth, brow,
  nose, spike); **0.4 to 1.2** mixed (lid arcs, ears); from **1.2** fully on the beat
  (contour, hair mass). The same length caps the warp amplitude for short strokes
  (`kurz`, capped at half the amplitude). `ruhig` is a hard off switch (eye rings,
  hatching, forehead lines). Dots never boil.

### DNA field order contract (rng, fallen)

- **Draw order is part of the contract**: new fields are appended, never inserted — a
  field drawn in the middle shifts every following draw and changes every existing face.
- Holds one level down in the style's head data too: the star of the star-eye and the
  heart on the mouth stand at the end; when an existing feature gains a new draw, that
  draw is appended (`wuerfleSternForm` and `wuerfleSternGroesse` are separate calls).
- `kleidT` sits *inside* the palette object yet is drawn last: the object is an order for
  the reader, the stream an order for the seeds.
- **Compatibility is struck after the draw, not before** — pre-filtering candidates would
  change the number of values drawn. A silently discarded throw costs nothing.
- Workshop re-roll exception: the handwriting block's draw sequence is a contract and is
  not re-hung; the DNA may instead carry which stream a feature's details come from
  (`dna.stil`), drawn *behind* the block ("the half throw", fallen).

### Pen (stift)

- **Ribbon strokes**: no `ctx.stroke()`; a stroke is a centre line plus half a width to
  each side as one filled polygon, so width can taper within a stroke (thin on touching
  down, full in the middle, thin on lifting off). Base width `0.024` in unit measure
  (~2% of head height).
- **Pressure curve `spitz`**: 0 blunt ends, 1 running out to a point, default **0.75**;
  the sine term kept flat (a 2× mid-thick line looks like a brush).
- **Path prep**: `entdoppeln` (dedupe) → `catmull` (**centripetal** parameterisation,
  provably no cusps or self-intersections) → sampling by arc length. The end point
  always belongs: if the last step lies further than half a step away it is appended,
  otherwise it replaces (fixes short strokes trembling by one step).
- **Closed shapes overshoot 3.5%** past their start — the set-down mark stays visible;
  a circle that closes exactly reads as an ellipse from a drawing program. Sheet edges
  are four strokes that run past the sharp corners (blatt).
- **Warp = two waves**, both interpolated cubically: a **coarse meander with 12 support
  values** and a **fine scratch with 40 support values, weighted at 0.35**. Meander alone
  is rubber hose, scratch alone a short circuit.
- **Ghost underlayer**: under every stroke the same stroke again, **half as wide, at 32%
  opacity**, with its own warp (trace `name~`, amplitude **1.7× + 0.004**) — the pencil
  lives beside, not on, the ink line. `einlagig: true` switches it off (edges of colour
  surfaces, trimmings).
- **Dot construction** (`punkt`): a slightly oval, tilted ring warped with the pen's
  noise; four details — a separate `spur` trace per dot (no twin pupils), edge *not*
  computed as closed (the set-down gap), warp capped at **0.15 r, at most 0.007**
  (no amoeba freckles), `ohneSaum` for dots lying on something. Never boils; takes the
  field (`ex/ey/fx/fy`) unless it is off the head.
- **Scale-independent width**: `strichFaktor` with **exponent 0.4, clamped to 0.62–1.3,
  reference size 95** (grid head size). Set once when the pen is created; multiplies
  every width after that.
- Misregistration direction/amount hang off the seed once per pen, from trace
  `'register'` (druck).

### Press / paper (druck)

- **Misregistration**: `flaeche()` shifts the fill by **0.008–0.016 unit measure** and
  draws it up to **±1.5%** larger/smaller; direction hangs off the seed (one plate per
  colour — everything shifts together, otherwise a "loose contact"). Exception: clothing
  names `platte: 'kleid'` with its own direction.
- **Bleed**: under every printed surface the same surface **3% larger at 14% opacity**;
  around a dot **7% larger at 16%**.
- **Opt-out is the exception** (`trocken: true`): surfaces that must join something
  (neck, ear, hat band), small trimmings (plaster, teeth, tongue), and the lens tint —
  the offset is a fixed amount in head space, huge relative to a small lens.
- **Paper**: grain drawn **once into a 128-px tile** (900 pale dots + 70 short fibres),
  then filled as a pattern; re-rolling per frame would be television static. Sheet gets
  **2–3% darker towards the edges** (radial gradient, centre above middle). The pattern
  belongs to the canvas surface it was created on — the surface is part of the cache key
  (fallen).
- **Colour as roles**: no drawing step names a hex value; roles resolved in
  `palette.ts` (canvas has no CSS variables). Skin in OKLCH, seven rows, `L` 0.72–0.955,
  `C` 0.06–0.012, weights; `HAUT_BUNT_AB = 0.88` starts the fantasy-colour list. Hair:
  10 natural + 7 dyed tones, `BUNT_AB = 0.82`, dyed chroma capped at 0.115.
  `haarDunkel = hl < 0.5` flips dark hair to light strokes. Ink sits at L ≈ 0.27, which
  is why the skin table stops at L = 0.72.

### Point cloud (wolke)

- Problem: `kopfPunkt` costs ~6000 points per head, ~55,000 for nine heads, per frame.
- **Sample once** (`wolke()`), per frame only rotate (one `drehMatrix`), project, and
  sort into **96 angular bins**, largest radius per bin. The cloud is a flat
  **`Float32Array`** of x,y,z (no point objects).
- Contour: fill empty bins (`fuelleLuecken`) **before** smoothing; three smoothing
  passes with a `1/(1+k²)` kernel that skips zeros. Empty bins come from sampling, not
  shape.
- **Angle approximation** instead of `atan2` at ~50k points/frame (~5 ms → under 1 ms):
  one division + third-degree polynomial; measured error 0.0002 rad against a bin width
  of 0.0654 rad.
- **Cache hangs only off the seed**: projection is homothetic (`F = BRENNWEITE · mass`,
  mass cancels out of `s = F/(F−z)`), so an outline at size 1 × mass *is* the outline at
  mass. The same cloud serves the small grid cell and the close-up.
- Partial arcs (`bogenUm`), back-side occlusion with threshold `rz < −0.15` (not 0),
  `schalenPunkt` for single points (hairline = ~80 points).
- Hair shells sampled denser: `nu = 144` longitudes (vs 56), hairdo shells `nv: 16`.
- **Measured: ~3 ms per frame for nine heads at DPR 2 on 1000×1080** — contour, hairdos,
  faces, paper together. Beanie heads cost ~1.9 ms vs 0.6 ms without (depth buffer,
  176×176 cells; skull as coarse 36×40 occluder only).

### Layer split (schichten)

- Folders: `core/` (style-agnostic: randomness, vocabulary, catalogue, DNA, skull
  geometry, OKLCH) / `styles/` (contract `types.ts`, one folder per style) / `app/`
  (grid, gaze, pointer, keyboard, two pages). **Calls only go downwards.**
- Five import rules enforced by `check-boundaries.mjs`; colour-role rules by
  `check-rollen.mjs` (exactly two roles cross the CSS↔canvas bridge:
  `--marke-canvas`, `--flaeche`); language rules by `check-vokabular.mjs`.
- Contracts: **DNA** (who the head is, `core/dna.ts`) / **Wurf** (what was rolled by
  hand, `core/wurf.ts`) / **Motion** (what it is doing, `app/blick.ts`) / **Bogen**
  (what it stands on, `app/bogen.ts`) / **Style** (how it looks, `styles/klar/`).
- Stilbeschreibung (style description): five fields — `id`, `label`, `pose` (rotation
  tolerance), `raum` (space need, optional, default `RAUM_NORMAL = 1.3`), `macheBlatt`
  (mandatory). Kopfplatz: three numbers, no rectangle. New style = one folder + one line
  in the registry. `@core` is a barrel file.
- Drawing order inside a head: strokes collected, **stably sorted by layer**, then
  drawn; 15 layers from `hals` (back) through `kopf`, `haut`, `bart`, `fernes-auge`,
  `nase`, `nahes-auge`, `mund`, `frisur`, `aufgesetzt`, `sternaugen` to `davor`
  (blatt). The nose-erases-eye bug fixed with far eye → nose → near eye, decided by z
  depth, held by a test over 400 seeds.

### Zones (zonen)

- Four layout genes (all with outliers, 8/10 inside the plain range): `augeU` 0.30–0.80
  (outliers 0.20–0.90, half the eye spacing in longitude); `mitte` −0.36–0.14
  (−0.55–0.28, face-field centre); `spreizung` 0.62–1.10 (0.50–1.30, vertical spread);
  `skala` 0.78–1.30 (0.66–1.55, feature size factor). Drawn from the forked stream
  `'layout'`.
- A **zone** is the room a feature has — centre and half-measures in spherical
  coordinates; zones tile (no gap, no overlap); a zone's centre need not be the feature's
  anchor. Constants: `AUGENZONE = 0.34`, `MUNDZONE = 0.5`, `BRUECKE = 0.45` (share of
  half the eye spacing for the nose bridge), `WANGE = 1.35` (eye-zone outward reach, ear
  at 1.48), `BACKE_AUSSEN = 0.22` (capped at 0.9), `BACKE_HALB = 0.16 × eye scale`
  (clamped 0.1–0.19). Half the mouth width is no longer a constant: **0.23–0.8** =
  cheek anchor − cheek reserve.
- **The zone is the ceiling, not the measure**: desired size from `skala`, capped by the
  zone, with a lower bound (eye cap `hoehe * 4.5`, mouth height `hoehe * 1.9`); taking
  zone height as eye size made pinhead eyes and a sheet of babies.
- `platz()` computes both axes foreshortened *back* — measuring in pixels and feeding
  `f.to()` squashes twice.
- Catalogue conditions on position (`nurBei`, `lieber`, `nichtMit`); conditions only
  ever look backwards during DNA build; `sperreFuer` reads the same rule forwards and
  backwards for workshop re-rolls.

### Head shape (kopfform)

- Ellipsoid; every surface point has `u` (longitude, 0 at the nose bridge, ±1.48 at the
  ear) and `v` (latitude, +1.57 crown, −1.57 chin); `kopfPunkt` is the only place the
  shape comes into existence.
- **Eight numbers**: semi-axes `rx` (0.6–0.86, outliers 0.5–0.98), `ry` (0.8–1.08),
  `rz`, plus deformers `kegel` (taper down, up to ±0.58 as outlier), `scheitelHoch`
  (widen up), `beule` (bump with the `cos(u)` term), `kastig` (boxiness via smooth
  radial bump on the diagonals — never an exponent on sin/cos, infinite slope at the
  equator). `kegel` and `scheitelHoch` go through one smooth polynomial hitting
  `k(−1) = 1 − kegel`, `k(0) = 1`, `k(1) = 1 + scheitelHoch`.
- Six named catalogue anchors (vocabulary only, not used when drawing). Without span all
  heads are eggs, and eggs are babies.
- All at `mass = 1`; head ~2 units tall; a 0.024 line ~2% of that.

### Space: rotate, project, anchor (raum)

- Fixed rotation order **yaw → pitch → roll**; one matrix (`drehMatrix`) and one
  single-point helper (`drehUm`) are the same computation.
- **Weak perspective**: `s = F/(F−z)` with `BRENNWEITE = 4.2`; projection flips y.
- The **`Feld`**: anchor sampled at three closely spaced surface points; carries
  x/y/z, local axes ex/ey, squash factors fx/fy (measured against `refU`/`refV` at the
  nose bridge of the unrotated surface), normal `nrm`, `nz`, and `to(lx, ly, lift)` for
  local −1…1 coordinates with normal lift. Feature functions know nothing about
  rotation.
- `sichtbarerAnker` pulls longitude toward centre in 10% steps until facing camera,
  threshold `min = 0.42`; `sichtGrenzen` finds where a round line meets the silhouette
  by bisection.
- Pose limits: DNA stores full rotation, style clamps — clear style `{ yaw: 0.4,
  pitch: 0.26, roll: 0.14 }` (~23°), deterministic, no randomness.
- Glasses are the counter-example: a rigid figure in head space (two frontal-plane
  circles, bridge, temples), foreshortened only by the cosine of rotation — lenses drawn
  through the field look painted on.

### Features variant structure (merkmale)

- **16 eye shapes, 12 mouth shapes** (index says 67 feature variants overall). Distribution
  deliberately skewed toward eyes and mouths; hair/headwear small ("a sheet full of hats
  is a hat shop").
- Eyes: `monolid` weight 1.5 (second most common); `funkeln` (star eyes) weight 0.16
  rarest, the only eye shape with its own layer and no eye shape at all; per-side star
  scatter — 4 or 5 points (never two four-point stars in one face), each scaled
  0.8–1.12, offset up to 0.14 rad; `wuerfleSternGroesse` 0.44–0.72 with outliers
  0.36–0.92; above `lider > 0.72` every eye is the same blink arc.
- Mouths: open state (`oeffnung > 0.16`) is one ellipse-with-tongue for all shapes;
  closed base shapes are a data table `LINIEN`; per-head mouth width 0.8–1.35 from the
  handwriting stream; laughing mouth measured in mouth widths, tongue-or-teeth roll only
  in the middle band (below 0.42 mouth widths nothing, above 0.9 always one);
  `OFFEN_MAX = 0.3` cap for the O mouth, mouth width floor 0.24; mouth size precomputed
  **once per head at the corners of pose space (3 yaws × 3 pitches × 2 rolls)**, the
  tightest wins; laughing-mouth fix measured: 608/1600 images crossed the contour
  before, 5 afterwards (by ≤1%).
- Noses: open strokes, lean `lehn = yaw * 0.5`; brows: `wach` lifts up to 0.38 brow
  heights (the whole pointer reaction, with cheeks and head lift); freckles on the
  **golden angle 2.399 rad** with growing radius, each freckle its own trace; cheek arc
  drawn *inside* the eye stroke via `ctx.clip`, drawn only as cap 1.15π–1.92π stretched
  by `1/cos(0.15π)`, checked against the outline inset by 6%.
- Beards: moustache and full beard are **two categories** (every combination instead of
  paired variants); `NASEN_TIEFE` table + protected space 0.03; mouth is data first
  (`mundForm`: top/bottom edges, outline, corners per head per frame) and the beard
  reads from it; full-beard edge coupling per hairstyle edge: `zacken` angular (factor
  ≈ 1.7, counted as segments — visible segments p10/median/p90: zacken 5/7/8, keine
  2/3/4, kraus 2/4/5, glatt 1/2/2), `kraus` round lobes, `glatt` barely cut, `keine`
  graphic rim (smooth 23% / one 29% / even 28% / free 20% across 20k heads).
- Collars: five variants `rund` 2.6 / `v` 0.6 / `hemd` 1.5 / `wolle` 1.3 / `keiner` 1.5,
  all one ring in body space; rotation damped yaw 0.3 / pitch 0.15 / roll 0.32; neck
  width per head 0.75–1.45; knitting 7–12 ribs, every fourth drops a stitch; the
  knitted hem grows *upwards* (fixed lower edge).
- Variant counts and catalogue ranges are published as data; glasses tint from seven
  colours (smoke ≈ half), strength from 0, outlier to sunglasses.

### Hair and hat (haar)

- **9 hairdos, 7 headwear kinds**; two constructions cover nearly everything: a **mass**
  is the skull surface sampled above a hairline, inflated along the normal (outline =
  outline of the inflated shell); an **accessory** is a few strokes on scalp anchors.
  What sits on the head goes other ways: hat and beanie are **bodies** (surfaces of
  revolution) judged by a **depth buffer**; the helmet is a body cut per column; the
  full beard is drawn, not measured.
- Hairline `haaransatz` + clamp `ansatzKlemme` (lower bound rolled per head — hair may
  touch the eye); teeth are **shares** of the space between baseline and clamp, 2–5 tips,
  exactly one deep one, never an edge tooth (edge teeth capped at a fixed 0.24, arc ends
  at ±1.4, not the silhouette); smooth-clamp smoothing `t*t*(3−2t)` — a jump in a
  boundary function is always a hole in the surface.
- Thickness runs out only in the last stretch above the hairline (0.4 in `v`, smoothed
  to 28%); `nu = 144` longitudes; seam/trim helpers `naht` (try both join directions,
  measured over 53,675 head+pose combinations, 91 different decisions, all better),
  `stutzeAnsatz`, `stutzeAussen`, `rundeZipfel`, sampling `rand = 0.06` past the
  visibility limit.
- Afro: a sphere — thickness *computed* (target radius minus head radius; off-centre
  sphere needs a quadratic; tapering needs three passes); **six kinds** (`kugel`,
  `turm`, `wolke`, `kurz`, `dreieck`, `pilz`) instead of one range; edge roughening,
  fringes, curls hang off the **angle**, not the point index, with integer-frequency
  harmonics; **all rolls fall before the visibility test** (else flicker).
- Curl cloud: the edge itself becomes coils (semicircles, not sine arcs), two size
  classes plus a hero curl; hairline coils bulged inward, divided more coarsely (4–5
  instead of 9–13).
- Hat: crown + brim, two surfaces of revolution with felt thickness 0.03, **five kinds
  with coupled axes** (`fedora`, `trilby`, `sonne`, `zylinder`, `eimer`) — the kind is
  rolled, not each axis; brim measures against the head when perched (`sitz`).
- Beanie: first body; profile shrunk onto the **skull** (allowance 0.055), never skull +
  hair; obstacle table = largest skull radius per height/longitude over neighbouring
  cells; pompom hangs on the beanie's topmost point.
- Helmet: surface of revolution cut off per column (lower edge depends on longitude);
  inflated with **one factor for the whole shell** (rigid, not draped); air and dome
  height are two separate values; centre stripe is a surface with its own buffer id,
  even column count; ears and earring go, beard stays.
- Depth buffer: rasterises bodies into a 176×176 grid (2/100 head per cell), CPU-side,
  never drawn; only beanie, pompom and skull (36×40 coarse occluder) enter it; strokes
  on a surface get a wide tolerance 0.06; hair stuffed under hat/beanie with a cone rule
  (steep 0.5 front/sides, shallow 2.2 at the back); shells under hat/beanie sampled at
  40 rings (vs 16 elsewhere). Cost ~1.9 ms/head with a beanie vs 0.6 without.
- Space requirement is declared by the style: `hutRaum`, `duttRaum`, `kugelRaum`; the
  caller shrinks the **whole sheet** rather than one head.

### Sheet and workshop (blatt)

- Grid: column count from a **threshold table at 560, 900, 1300, 1800 px** (not a
  formula); rows from roughly square cells; prefer one column more over large heads with
  air. Cell seed = **`blattSeed + r · spalten + c`** — neighbouring seeds, hence the
  8-draw warm-up.
- Space: style's `raum(dna)` vs cell's `platzIn`, both in head units; if a hairdo
  demands more than its cell offers, the **whole sheet** scales (nine scales look like a
  fault; a slightly smaller sheet looks like intent). Result is usually 1.
- Close-up is a number: `fokus.t` 0→1, approaching by a fixed share of the remaining
  distance each frame (reversible mid-movement); the veil over the grid is paper-coloured
  and covers fully at the end.
- Workshop: 16 dice groups instead of 40 values; the picture is the menu; the drawn
  head's size is computed **once per throw**, not per frame; the workshop draws **flat**
  (equal weights instead of the sheet's — "none" weighs 8 for glasses, 12 for beard,
  9 for headwear); `Wurf` address: features by word, continuous genes by edition
  (`strom(seed, 'kopfform#3')`); eye tone listens to two dice.
- Export sheet: fixed format (DIN portrait, 600 units wide; file rendered at 1500 px,
  f = 2.5), one function for screen and file; edge and shadow drawn with the same pen;
  the sheet does **not boil**; name painted (it leaves the browser), file name from the
  address (`tomu-118317-auge-stern.png`).
- Names on the sheet page live as DOM `<span>` over the canvas (selectable, accessible;
  canvas keeps an `aria-label`); two names `wunsch`/`gezeigt` re-evaluated every frame.
- Dev-only test handles on `window.presse`: `wuerfle(seed)`, `schaue(x, y, s)` (advances
  springs in 1/60 s steps without a frame loop), `zellen()`, `abzug(name)`; whole branch
  under `import.meta.env.DEV`.

### Motion (animation, raum)

- Motion is **pure computation** (`app/blick.ts`, no DOM/canvas): pointer position, head
  centre, elapsed time → a `Regung` (rotation, pupil direction, blink, attention, mouth
  opening). Testable without drawing.
- Direction: eyes follow clearly (`klemm(dx * 2.1)`), head with restraint (max
  **0.34 rad**); clamp before the multiply — beyond reach the head keeps *looking* there
  without turning further.
- **Spring**: `v += (k·(ziel − x) − 2·√k·v)·dt` — critical damping; per-head stiffness
  **7–16** from the seed (test: "two heads do not move in lockstep"). Pupils and
  attention run **without a spring**, smoothed `1 − exp(−dt·12)`.
- Life: breath = sine on pitch (0.012) and roll (0.006); blink = **0.14 s, half a sine
  wave**, scattered pauses from the per-head `'feder'` stream (stiffness, breath phase
  and tempo, blink pauses, chatter pauses — the `Math.random in the blink` pitfall);
  chatter = envelope × syllable × stress, at least 10 s after a bout.
- **Attention** `wach`: soft ramp over distance — zero from **3.4 head sizes**, one from
  **1.6**, no edge in between. Six small effects: head lifts 0.05·mass, brows rise,
  cheeks strengthen, eyes open a slit wider, smile broadens, blink 1.6 s instead of 3 s
  and chatter 4 s instead of 10 s. More would be fidgeting.
- Without a pointer: heads look around on two sines with **non-round periods (0.24 and
  0.61 · 0.24)** — round periods would nod in lockstep.
- `prefers-reduced-motion`: sheet stands still, no frame loop, draw only after input.
  Idle for 12 s → half frame rate.

### Pitfalls (fallen) — each trap and its fix

Recurring patterns called out up front: a jump in a boundary function is always a hole
in the surface built from it; a roll after a visibility test is always a flicker;
anything hung off an index instead of an angle jumps at the next rotation.

Signs and directions:
- **The pout** — anchor y points up (latitude), canvas y down; fix: each shape function
  flips the sign in its own `to`.
- **The roof under the eye** — eye ring drawn as upper half circle below the eye; fix:
  lower half (0.12π–0.88π) around a centre just below the eye; ends at 0.57 eye radii,
  dip to 0.96, second arc the exception.
- **The inverted cheek** — normal flipped toward viewer so `nz < 0` never fires; fix:
  normal points outward from the head centre, checked by dot product.
- **The ear as a fallen-off handle** — arc attached flush to the smoothed contour which
  lies inside; fix: surface reaches further in than the line (seam behind the root).
- **The bitten ear** — near ear under the head surface; fix: its own layer
  (`zugewandtes-ohr`), decided by the ear's normal, arc runs over the contour by the
  inset.
- **The neck beside the chin** — neck hung off surface anchors that run away under
  rotation; fix: hang off the outline; width/collar from the unrotated head.
- **The nose erases the near eye** — fix: far eye → nose → near eye by z depth, held by
  a 400-seed test.

Edges and surfaces:
- **The squeeze** — bump depending only on height = a ridge all round; fix: `cos(u)`
  term.
- **The exponent on sin and cos** — infinite slope at the equator, gaps in the
  silhouette; fix: smooth diagonal bumps via `sin(2u)`/`sin(2v)`.
- **The dent in the cheek** — empty angular bin smoothed into a dent; fix: bridge gaps
  *before* smoothing, smoothing skips zeros.
- **The flap across the face** — outline took the shell's back side; fix: `hinter`
  visibility test, threshold `rz < −0.15`.
- **The spike at the bottom of the afro** — last visible bin short of the contour; fix:
  `laufeAus` appends one bin per end, radius = contour, just inside.
- **The hairdo as a bubble beside the head** — seam end guessed at an endpoint; fix:
  try both directions through `naht`, take the one that closes (53,675 combos, 91
  changed, all better); tip bounded at ~two shell thicknesses.
- **The thread at the temple** — hairline beyond outline / too few longitudes; fix:
  `stutzeAnsatz`, `nu` 56 → 144.
- **The lobe on the far side** — radial outline sees through the low-hanging mass; fix:
  `stutzeAussen` trims ends close to the hairline and inside the contour.
- **The hole in the fill** — stepped clamp; fix: smooth `t·t·(3−2t)`.
- **The horizontal wedge / wet hair** — thickness runout wrong both ways; fix: only the
  last stretch above the hairline thins.
- **The truncated tongue / cut at eye level** — cut at narrowest instead of latest
  narrow place; chord instead of arc; fix: cut at the last point under 0.055,
  `rundeZipfel` arc.
- **The string of beads and the saw** — bales on a smooth edge / sine arcs; fix: the
  edge becomes coils, bulges are semicircles.
- **Three waves instead of two arcs** — heart assembled from fixed peaks; fix: one base
  arc plus one bell disturbance.
- **The pattern from the wrong surface** — grain tile cached by device ratio only; fix:
  canvas surface in the cache key.
- **The colour plate beside the frame** — fixed misregistration offset huge relative to
  a small lens; fix: print the tint dry; ask how large the offset is relative to *this*
  surface.
- **The staircase along the beard's edge** — radial outline outside its range of
  validity for a thin coat; fix: don't measure — offset the head contour, close at the
  two corners (found by nz sign flip + bisection from inside).
- **The beard cut on a slant** — curvature eats the point; fix: tip rises steeper than
  the edge turns, drawn `eckig` (not Catmull-rounded).
- **The sliced melon** — strands along meridians converge at the pole; fix: spread by
  `cos v₀ / cos v` (`spreiz`, beard uses 0.8).

Measures and sizes:
- **The zone as the measure** / **small features in a large head** / **squashed twice** /
  **the mouth that ran off the face** / **the breathing mouth** / **the astonishment
  that turned into a yawn** / **the beard that grew along** — see Zones and Features
  above; general rule: a size that is a share of another measure inherits every change
  to that measure; a feature's size may never depend on the pose.
- **The hat in mid-air** / **the mushroom and the vanished brim** / **the beanie as a
  plate with a frill** / **the bonnet over the crown** / **the edge that vanishes under
  its own beanie** — see Hair and hat above; roll the *kind*, not the axes; garments
  shrink onto the skull, never skull + hair; wide tolerance 0.06 for strokes on a
  surface.
- **One sheet at nine scales** — fix: style declares space need; whole sheet scales.
- **The moustache guesses the mouth** — mouth became data first (`mundForm`), drawing
  second.
- **The walrus grows out past the chin** — negative denominator; fix: floor on the
  denominator, clamped fraction.
- **The lampshade / the stacked neck / the second collar under the collar** — collar
  ring measured from the neck, grows upwards, ground area follows the shape.
- **The box that measures itself** — canvas deriving size from a box it sits in;
  fix: measured element sits absolute, holder sized by the scaffold.

Randomness and streams:
- **The shifted DNA** — field inserted mid-order; fix: always append, or fork a stream.
- **The flickering face** — warp from a running stream shifted by a skipped stroke; fix:
  warp hangs off a trace name.
- **The flickering pattern** — rolls after a visibility test; fix: all rolls first; no
  draw may depend on a condition that changes per frame.
- **The jumping trimmings** — hung off edge indices; fix: hang off fixed angles.
- **The loose contact and the television static** — per-surface misregistration /
  per-frame grain; fix: register off the seed, grain in a tile.
- **The half throw** — re-roll did not change the handwriting; fix: `dna.stil` names the
  stream, drawn behind the (untouched) handwriting block.
- **The condition that only looks backwards** — `nichtMit` is directional; fix:
  `sperreFuer` reads rules both directions.

Movement:
- **The boiling dot** — dots never boil; warp off the seed only.
- **The trembling of short lines** — end point always belongs; warp scales with length.
- **The comb and the pot** — per-head stiffness, breath phase, `taktVersatz`; non-round
  idle periods.
- **The painted-on glasses** — rigid figure in head space.

Pitfalls no picture shows (all now behind guards):
- **The copy that drifts apart** — a demo re-enacted random draws instead of asking the
  style; fix: demos fetch strokes; if an export is missing, add it.
- **The translated attribute** — renaming pass caught string literals
  (`font-size` → `font-mass`); fix: `check-vokabular.mjs` knows damage-only forms.
- **The bridge that was two** — docs said one CSS role crossed to canvas, the app read
  two; fix: the bridge is a list in `check-rollen.mjs`.
- **The path that serves the wrong page** — `/docs` without slash served the app with
  200; fix: 301 in dev and preview servers alike.

Closing rule (fallen): most mistakes were errors of *order* — smooth first, then fill
gaps; check first, then roll; measure first, then squash. In a generator the order is
part of the correctness, and it stands in no signature; comments record it, guards
enforce it.

## 3. Facade equivalents

Mapping each mechanism to the new project (an infinite wall of windows, each window a
seeded tenant; window identity = hash(meta-seed, world-grid coordinates)):

| Reference mechanism | Facade equivalent |
| --- | --- |
| Sheet (grid + blattSeed + viewport thresholds) | The wall: the viewport slides over an infinite world grid; window seed = hash(metaSeed, col, row); column thresholds become chunk/level-of-detail rules for how many windows per screenful |
| Cell seed `blattSeed + r·spalten + c` with 8-draw warm-up | Window seed derivation — keep the warm-up: neighbouring windows on the wall will have neighbouring seeds by construction |
| Head (ellipsoid + deformers) | The tenant/window scene: one scene per window, built in unit measure so its cache is viewport-independent |
| DNA (who the head is) | Tenant genes: light colour/warmth genes, curtain kind, plants, window-box, tenancy details — append-only draw order carries over unchanged |
| Motion (what it is doing now) | What the tenant/window is doing now: TV flicker, curtain sway, lamp steps — pure computation, no DOM |
| Style (how it looks) | The wall's drawing style: pen settings, palette roles |
| Blink (0.14 s half-sine, scattered pauses) | TV flicker / curtain sway — per-window phase from the window's own `'feder'`-style stream |
| Pointer attention (`wach` ramp 3.4 → 1.6 head sizes) | Tenant notices gaze: light warms, curtain twitches, silhouette appears at the pane — same soft distance ramp, small effects only |
| Spring (critical damping, stiffness 7–16 per head) | Per-tenant idle springs; non-round idle periods so the wall never twitches in lockstep |
| `taktVersatz` (per-head beat offset) | Per-window beat offset — mandatory on an infinite wall or the whole facade boils as one pot |
| "Neues Blatt" / `wuerfle(seed)` / name→seed | Meta-seed regeneration ("New wall"): a fresh meta-seed re-addresses every window; shareable state = meta-seed (+ camera) in the URL, `?kopf=`-style pinning for a single tenant |
| Pen (ribbon, traces, beat, ghost layer) | Ported as-is — the boiling line draws the wall; trace names must embed window identity (e.g. `kontur#col:row`) so the same pane warms identically every frame |
| Trace hashing (FNV → 52 supports, Map on pen) | Same; cache is per pen instance and unbounded in name space only by what is on screen — a panning wall needs either an LRU or per-window pen reuse |
| Point cloud (sample once, rotate/bin per frame, 96 bins) | Pre-render each window scene once to an offscreen canvas keyed by window seed + pose bucket; per frame only composite — the reference's cloud cache is the analog of wall-chunk caching |
| Homothety / unit measure (cache hangs off seed only) | Window scenes drawn at unit size, scaled by `ctx.scale` at composite — one cached render serves zoom levels |
| Press (misregistration, bleed, paper grain tile) | Facade texture: brick/render grain as a one-time tile, per-building ink misregistration off the building seed, `trocken` for window frames that must meet their panes |
| Colour roles / OKLCH palette | Wall palette as roles: night sky, glass, curtain, brick; per-window light genes pick rows from a table with weights, fantasy rows above a threshold |
| Zones (tiled regions, zone is ceiling) | Window pane layout: frame subdivisions per window (panes, transom) as tiled zones; pane content is capped by its pane, never sized by it |
| Head shape constants / named anchors | Window archetypes: sash, casement, arched, round — named kinds rolled instead of independent axes |
| Hair masses vs accessories | Attached clutter: awnings, shutters, window boxes (masses) vs vines, cables, decals (accessories) |
| Hat/beanie bodies + depth buffer | Probably unnecessary on flat facades; occlusion stays painter's-order. Flag: no obvious equivalent |
| Glasses (rigid figure in head space) | Flag: no obvious facade equivalent |
| Workshop / `Wurf` re-roll | Flag: no direct equivalent — a tenant inspector would be a docs-site affordance, not a wall feature |
| Sheet export (DIN format, painted name) | Flag: no wall equivalent; a docs-site share/screenshot could reuse the pattern |
| Names as DOM spans / aria-label | Nameplates and doorbells as DOM text over the canvas, computed positions from the same layout |
| Catalogue as data (weights, nurBei, lieber, nichtMit) | Decoration catalogue per window kind, compatibility struck after the draw |
| Layers (stable-sorted stroke layers) | Same painter's-order discipline per window scene; wall-level order = by depth/building |
| Guards (check-boundaries, check-rollen, check-vokabular) | Adopt the pattern: boundary checks between engine / scenes / site, role-only colours |
| `prefers-reduced-motion` + idle half frame rate | Direct port: stand still under reduced motion; drop to half rate when idle |
| Hairline clamp, boiling thresholds, koch by length | Direct port — pen constants travel unchanged |

Mechanisms flagged with **no obvious facade equivalent**: hat/beanie depth-buffer
bodies, the helmet, glasses as rigid figure, the workshop re-roll UI and `Wurf`
addresses, sheet export/print, and the beard-edge/hairline coupling (windows have no
hairlines; the analogous "edge says which unrest the trim gets" idea could map to
awning vs shutter styles but is speculative).
