// The colour brain: each coloured surface rolls a colourway off the window
// seed — a finished pastel colour picked whole from one weighted list — and
// resolves its finish through its own constants. Colour never rides the dna
// or shell streams: it lives on its own fork per surface group, so adding
// or retuning colour rules never re-randomizes a tenant.
//
// Night is a mix, not a re-target: when the theme paper goes dark, every
// tinted colour sinks into it, most of the way to the ground. The mix
// happens inside the palette resolution: night is a property of a colour,
// never a layer drawn over the wall.
import { fork } from "@/core/randomness/rng";
import { mixCss, oklchToCss } from "./oklch";
import {
  type ColorRole,
  type Palette,
  type ResolvedColor,
  type Theme,
  FURNITURE_INK_MIX,
  GLASS_WASH,
  OCCLUDE,
} from "./roles";

export interface Colourway {
  name: string;
  hue: number;
  chroma: number;
  lightness: number;
  weight: number;
}

type ColourGroup =
  "mullion" | "awning" | "sill" | "box" | "cloth" | "lamp" | "light";

// Rarity lives in the character: the quiet families dominate, the dyed-looking
// ones are rare rows, not a separate gate. Each row is a finished colour —
// the pastel street at its dialed chroma — picked whole by the roll.
export const COLOURWAYS: readonly Colourway[] = [
  { name: "powder", hue: 243, chroma: 0.025, lightness: 0.8, weight: 0.2 },
  { name: "mint", hue: 155, chroma: 0.023, lightness: 0.8, weight: 0.17 },
  { name: "blush", hue: 20, chroma: 0.023, lightness: 0.8, weight: 0.15 },
  { name: "butter", hue: 95, chroma: 0.025, lightness: 0.8, weight: 0.13 },
  { name: "lilac", hue: 315, chroma: 0.019, lightness: 0.8, weight: 0.09 },
  { name: "chalk", hue: 90, chroma: 0.007, lightness: 0.8, weight: 0.26 },
];

// The light's own table: rows of one warm family, varying in tone and
// strength — never a cool row. Stronger chroma than the street rows: the
// light reads over the interior, not beside it.
export const WARMTH: readonly Colourway[] = [
  { name: "firelight", hue: 65, chroma: 0.15, lightness: 0.78, weight: 0.125 },
  { name: "candle", hue: 80, chroma: 0.16, lightness: 0.82, weight: 0.1875 },
  { name: "amber", hue: 90, chroma: 0.13, lightness: 0.88, weight: 0.375 },
  { name: "honey", hue: 105, chroma: 0.11, lightness: 0.94, weight: 0.3125 },
];

const ECHO_L = 0.05;

// Each coloured surface rolls its own family off the window seed, on a fork
// per group, so a tenant's frame, awning, sill, box, and cloth mostly
// differ and share a family only by chance. The three cloth roles are one
// construction per window, so they roll together as one group.
function rollColourway(
  seed: number,
  group: ColourGroup,
): Omit<Colourway, "weight"> {
  const rng = fork(seed, `colourway:${group}`);
  const table = group === "light" ? WARMTH : COLOURWAYS;
  const row = rng.weighted(
    table.map((way) => ({ value: way, weight: way.weight })),
  );
  return {
    name: row.name,
    hue: rng.float(row.hue - HUE_JITTER, row.hue + HUE_JITTER),
    chroma: row.chroma,
    lightness: row.lightness,
  };
}

// A role carries no lightness: the colourway row is the finished colour.
// Wear is a role's per-construction strength: the scaled chroma and
// shifted lightness it lays its family colour down with.
interface Wear {
  chromaScale: number;
  lightnessShift: number;
}

const NO_WEAR: Wear = { chromaScale: 1, lightnessShift: 0 };

// The band a roll may wander inside its family, the saturation ceiling
// every tinted street role wears, the awning's laid-thin rung, and the
// curtain washes' ceiling — no curtain fill goes fully opaque: the room
// always reads through the cloth, the venetian's slats included. Fixed
// values of the model, the same for every group.
export const HUE_JITTER = 6;
export const CHROMA_CAP = 0.09;
export const CURTAIN_ALPHA_CAP = 0.8;
const AWNING_CHROMA_SCALE = 0.6;
const AWNING_LIGHTNESS_SHIFT = 0.05;
// The awning's laid-thin rung: quieter and lighter than the canvas above it.
const AWNING_WEAR: Wear = {
  chromaScale: AWNING_CHROMA_SCALE,
  lightnessShift: AWNING_LIGHTNESS_SHIFT,
};

// The backlit cloth: a lit room's warmth passes through the cloth at
// night, dimmed by the fabric — the glow mixes the transmitted warmth over
// the cloth's night-mixed body, and carries the wash's alpha up with it,
// so the curtain reads as dark cloth lit from inside. Never a luminous
// panel: the transmitted light stays well under the warmth's own lightness.
export const BACKLIGHT_GLOW = 0.3;
export const BACKLIGHT_TRANSMIT_L = 0.2;

// The dials of the colour model, all in one place: the scale on the families'
// chroma, the lift on their lightness, the cloth washes' tint, the night
// mix, and the light layer's own wear and strengths. The tuning bench drives
// these live; production always runs the defaults.
export interface ColourwayTuning {
  chromaScale: number;
  lightnessLift: number;
  washAlpha: number;
  nightMix: number;
  lightChromaCap: number;
  veilAlpha: number;
  ambientAlpha: number;
  auraAlpha: number;
  lampLightnessShift: number;
}

export const DEFAULT_COLOURWAY_TUNING: ColourwayTuning = {
  chromaScale: 1,
  lightnessLift: 0,
  washAlpha: 0.5,
  nightMix: 0.85,
  lightChromaCap: 0.1,
  veilAlpha: 0.9,
  ambientAlpha: 0.26,
  auraAlpha: 0.3,
  lampLightnessShift: -0.35,
};

interface RoleContext {
  theme: Theme;
  night: number;
  // The window's own lamp gene: whether its room burns. Only the backlit
  // cloth reads it — a lit room's warmth shows through its curtain.
  lit: boolean;
  wayFor: (group: ColourGroup) => Omit<Colourway, "weight">;
  tuning: ColourwayTuning;
}

// The day colour: the family row passes the chroma (scaled, capped) at its
// lightness plus the lift, wearing the role's strength. Night is a separate
// pass, applied by the finish kind below.
function familyColour(
  ctx: RoleContext,
  group: ColourGroup,
  wear: Wear = NO_WEAR,
): { color: string; l: number; chroma: number; hue: number } {
  const { wayFor, tuning } = ctx;
  const way = wayFor(group);
  const l = way.lightness + tuning.lightnessLift + wear.lightnessShift;
  const chroma = Math.min(
    way.chroma * tuning.chromaScale * wear.chromaScale,
    CHROMA_CAP,
  );
  return { color: oklchToCss({ l, c: chroma, h: way.hue }), l, chroma, hue: way.hue };
}

// The night pass every tinted colour ends in. The street's tints sink into
// the ground ("sink"); the interior's paint keeps its own ("keep") so a
// lit room reads its warmth through what lies over it; the cloth
// "transmits" — in a lit room the lamp's warmth passes through diminished,
// mixed over the dark body by the glow, which lifts the fill toward opaque
// so the light passing through makes the cloth read.
type NightKind = "sink" | "keep" | "transmit";
function nightPass(
  ctx: RoleContext,
  dress: ResolvedColor,
  kind: NightKind,
): ResolvedColor {
  const { theme, night, lit, wayFor, tuning } = ctx;
  if (!night || kind === "keep") return dress;
  const sunk = {
    color: mixCss(dress.color, theme.paper, tuning.nightMix),
    alpha: dress.alpha,
  };
  if (kind !== "transmit" || !lit) return sunk;
  const warm = wayFor("light");
  const transmitted = oklchToCss({
    l: (warm.lightness + tuning.lightnessLift) * BACKLIGHT_TRANSMIT_L,
    c: Math.min(warm.chroma, tuning.lightChromaCap),
    h: warm.hue,
  });
  return {
    color: mixCss(sunk.color, transmitted, BACKLIGHT_GLOW),
    alpha: sunk.alpha + (1 - sunk.alpha) * BACKLIGHT_GLOW,
  };
}

// One resolver per finish kind, so a new role is one map row naming its
// kind. The street's painted faces occlude in their family colour and sink
// at night; the interior's painted furniture keeps its colour; the curtain
// cloth reads through — the hanging cloth as a pooling wash, the venetian's
// slats as one plain fill, both capped at CURTAIN_ALPHA_CAP so the room
// always shows through, whatever the wash dial says.
const painted =
  (group: ColourGroup, wear: (ctx: RoleContext) => Wear = () => NO_WEAR) =>
  (ctx: RoleContext): ResolvedColor =>
    nightPass(
      ctx,
      { color: familyColour(ctx, group, wear(ctx)).color, alpha: OCCLUDE },
      "sink",
    );

const interiorPainted =
  (group: ColourGroup, wear: (ctx: RoleContext) => Wear = () => NO_WEAR) =>
  (ctx: RoleContext): ResolvedColor =>
    nightPass(
      ctx,
      { color: familyColour(ctx, group, wear(ctx)).color, alpha: OCCLUDE },
      "keep",
    );

// The hanging cloth: a wash at the tuning's tint, pooled with its lighter
// echo. The two passes composite into the one fill they draw as — canvas
// blending is linear per channel, so they collapse to a compounded alpha
// and the matching channel blend of echo and base — and the curtain cap
// holds on the fill they actually land as.
const clothWash =
  (group: ColourGroup) =>
  (ctx: RoleContext): ResolvedColor => {
    const { tuning } = ctx;
    const family = familyColour(ctx, group);
    const echo = oklchToCss({
      l: family.l + ECHO_L,
      c: family.chroma,
      h: family.hue,
    });
    const echoAlpha = tuning.washAlpha / 2;
    const compounded =
      1 - (1 - tuning.washAlpha) * (1 - echoAlpha);
    const dress = {
      color: mixCss(echo, family.color, (tuning.washAlpha * (1 - echoAlpha)) / compounded),
      alpha: Math.min(compounded, CURTAIN_ALPHA_CAP),
    };
    return nightPass(ctx, dress, "transmit");
  };

// The venetian's slat rows: one plain fill, no echo, at the curtain cap.
const blindSlat =
  (group: ColourGroup) =>
  (ctx: RoleContext): ResolvedColor =>
    nightPass(
      ctx,
      { color: familyColour(ctx, group).color, alpha: CURTAIN_ALPHA_CAP },
      "transmit",
    );

// The warmth roles resolve from one roll off the light table: the emitter
// wears it opaque, the aura and the ambient lay the same colour over the
// room at their own alphas. No pooling echo — the aura's falloff comes
// from its nested passes — and no night mix: the light is the thing the
// night exists to show.
const warmthResolver =
  (alphaOf: (tuning: ColourwayTuning) => number) =>
  (ctx: RoleContext): ResolvedColor => {
    const { wayFor, tuning } = ctx;
    const way = wayFor("light");
    const color = oklchToCss({
      l: way.lightness + tuning.lightnessLift,
      c: Math.min(way.chroma, tuning.lightChromaCap),
      h: way.hue,
    });
    return { color, alpha: alphaOf(tuning) };
  };

// One resolver per role, so a new role is one map row: theme-bound roles read
// the theme pair, tinted roles resolve their colourway group through a tint.
// A role missing from the map fails the compile — and a caller casting past
// the type still fails at the resolution site.
// The furniture grays: one factory shared by the five depth roles, each
// wearing its plane's own ink mix — the deeper plane's lighter shade.
const furnitureAt =
  (mix: number) =>
  ({ theme }: RoleContext): ResolvedColor => ({
    color: mixCss(theme.paper, theme.ink, mix),
    alpha: OCCLUDE,
  });

const ROLE_RESOLVERS: Record<ColorRole, (ctx: RoleContext) => ResolvedColor> = {
  ink: ({ theme }) => ({ color: theme.ink, alpha: OCCLUDE }),
  glass: ({ theme }) => ({ color: theme.ink, alpha: GLASS_WASH }),
  paper: ({ theme }) => ({ color: theme.paper, alpha: OCCLUDE }),
  mullion: painted("mullion"),
  awning: painted("awning"),
  awningThin: painted("awning", () => AWNING_WEAR),
  sill: painted("sill"),
  box: painted("box"),
  fabric: clothWash("cloth"),
  shade: clothWash("cloth"),
  blind: blindSlat("cloth"),
  lamp: interiorPainted("lamp", ({ tuning }) => ({
    chromaScale: 1,
    lightnessShift: tuning.lampLightnessShift,
  })),
  lampShade: interiorPainted("lamp"),
  light: warmthResolver(() => OCCLUDE),
  ambient: warmthResolver((tuning) => tuning.ambientAlpha),
  aura: warmthResolver((tuning) => tuning.auraAlpha),
  // The veil never flips in as a mark: by day it resolves at alpha 0, so
  // the theme crossfade carries the wash in with the same clock as every
  // other role, and an unlit room's interior dims instead of snapping.
  veil: ({ theme, night, tuning }) => ({
    color: theme.paper,
    alpha: night !== 0 ? tuning.veilAlpha : 0,
  }),
  furniture2: furnitureAt(FURNITURE_INK_MIX[2]),
  furniture3: furnitureAt(FURNITURE_INK_MIX[3]),
  furniture4: furnitureAt(FURNITURE_INK_MIX[4]),
  furniture5: furnitureAt(FURNITURE_INK_MIX[5]),
  furniture6: furnitureAt(FURNITURE_INK_MIX[6]),
};
// The window's own palette: theme-bound roles resolve from the theme's two
// colours; tinted roles resolve from the colourway. A role with no
// registered resolution throws — drawing code names roles, styling alone
// decides colour, and an unregistered role must crash at the resolution
// site rather than draw in a guessed colour.
const paletteCache = new Map<string, Palette>();
// A pure function of (seed, theme, lit) needs no eviction policy beyond a
// bound: the wall's meta-seed re-roll would otherwise grow the cache
// unbounded across a long session, and dropping a palette only costs a
// re-derive.
const PALETTE_CACHE_MAX = 512;

export function windowPalette(
  seed: number,
  theme: Theme,
  lit = false,
  now: number = performance.now(),
): Palette {
  const resolved = cachedPalette(seed, theme, lit);
  const ms = theme.transitionMs;
  if (!(ms > 0)) return resolved;
  const key = `${seed}|${lit ? 1 : 0}`;
  const identity = `${theme.ink}|${theme.paper}|${theme.night}`;
  const to = resolveAll(resolved);
  let entry = fades.get(key);
  if (!entry) {
    entry = { identity, start: now, from: to, to };
    fades.set(key, entry);
    if (fades.size > FADES_MAX) fades.clear();
    return paletteOf(to);
  }
  if (entry.identity !== identity) {
    // A theme change mid-fade starts the return from the blend on screen,
    // so the colour never jumps back to where the previous fade began.
    entry = { identity, start: now, from: blend(entry.from, entry.to, ease((now - entry.start) / ms)), to };
    fades.set(key, entry);
  }
  const e = ease((now - entry.start) / ms);
  if (e >= 1) {
    entry.to = to;
    return resolved;
  }
  if (e <= 0) return paletteOf(entry.from);
  return paletteOf(blend(entry.from, to, e));
}

// The fade state per window seed: the identity of the theme it fades to,
// when it began, and the two fully resolved palettes it blends between.
// Bounded like the palette cache — a dropped entry only costs a snap to the
// current target.
interface FadeEntry {
  identity: string;
  start: number;
  from: Record<ColorRole, ResolvedColor>;
  to: Record<ColorRole, ResolvedColor>;
}
const fades = new Map<string, FadeEntry>();
const FADES_MAX = 512;

function resolveAll(palette: Palette): Record<ColorRole, ResolvedColor> {
  const all = {} as Record<ColorRole, ResolvedColor>;
  for (const role of Object.keys(ROLE_RESOLVERS) as ColorRole[]) {
    all[role] = palette(role);
  }
  return all;
}

function blend(
  a: Record<ColorRole, ResolvedColor>,
  b: Record<ColorRole, ResolvedColor>,
  e: number,
): Record<ColorRole, ResolvedColor> {
  const out = {} as Record<ColorRole, ResolvedColor>;
  for (const role of Object.keys(ROLE_RESOLVERS) as ColorRole[]) {
    out[role] = {
      color: mixCss(a[role].color, b[role].color, e),
      alpha: a[role].alpha + (b[role].alpha - a[role].alpha) * e,
    };
  }
  return out;
}

// The CSS 'ease' curve — the fade's clock matches the page's token
// transition exactly.
function ease(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const at = (t: number, p1: number, p2: number) => {
    const omt = 1 - t;
    return 3 * omt * omt * t * p1 + 3 * omt * t * t * p2 + t ** 3;
  };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid, 0.25, 0.25) < x) lo = mid;
    else hi = mid;
  }
  return at((lo + hi) / 2, 0.1, 1);
}

function cachedPalette(seed: number, theme: Theme, lit: boolean): Palette {
  const key = `${seed}|${theme.ink}|${theme.paper}|${lit ? 1 : 0}`;
  let palette = paletteCache.get(key);
  if (!palette) {
    palette = buildPalette(
      theme,
      (group) => rollColourway(seed, group),
      DEFAULT_COLOURWAY_TUNING,
      lit,
    );
    if (paletteCache.size >= PALETTE_CACHE_MAX) paletteCache.clear();
    paletteCache.set(key, palette);
  }
  return palette;
}

function paletteOf(resolved: Record<ColorRole, ResolvedColor>): Palette {
  return (role) => {
    const dress = resolved[role];
    if (!dress)
      throw new Error(
        `no registered resolution for colour role: ${String(role)}`,
      );
    return dress;
  };
}

// The tuning bench's entry: the same resolution, unmemoized and wearing
// whatever tuning the bench's sliders hold.
export function tunedWindowPalette(
  seed: number,
  theme: Theme,
  tuning: ColourwayTuning,
  lit = false,
): Palette {
  return buildPalette(
    theme,
    (group) => rollColourway(seed, group),
    tuning,
    lit,
  );
}

function buildPalette(
  theme: Theme,
  wayFor: (group: ColourGroup) => Omit<Colourway, "weight">,
  tuning: ColourwayTuning,
  lit: boolean,
): Palette {
  const ctx: RoleContext = {
    theme,
    night: theme.night,
    lit,
    wayFor,
    tuning,
  };
  // Resolved eagerly, so a role's roll happens even when a bare window never
  // reads it — a silently discarded throw keeps the stream's shape honest.
  const resolved = {} as Record<ColorRole, ResolvedColor>;
  for (const [role, resolve] of Object.entries(ROLE_RESOLVERS)) {
    resolved[role as ColorRole] = resolve(ctx);
  }
  return paletteOf(resolved);
}
