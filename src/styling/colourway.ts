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
  FURNITURE_DETAIL_INK_MIX,
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

type ColourGroup = "mullion" | "awning" | "sill" | "box" | "cloth" | "lamp" | "light";

// Rarity lives in the character: the quiet families dominate, the dyed-looking
// ones are rare rows, not a separate gate. Each row is a finished colour —
// the pastel street at its dialed chroma — picked whole by the roll.
export const COLOURWAYS: readonly Colourway[] = [
  { name: "powder", hue: 243, chroma: 0.042, lightness: 0.8, weight: 0.2 },
  { name: "mint", hue: 155, chroma: 0.038, lightness: 0.8, weight: 0.17 },
  { name: "blush", hue: 20, chroma: 0.038, lightness: 0.8, weight: 0.15 },
  { name: "butter", hue: 95, chroma: 0.042, lightness: 0.8, weight: 0.13 },
  { name: "lilac", hue: 315, chroma: 0.032, lightness: 0.8, weight: 0.09 },
  { name: "chalk", hue: 90, chroma: 0.011, lightness: 0.8, weight: 0.26 },
];

// The light's own table: rows of one warm family, varying in tone and
// strength — never a cool row. Stronger chroma than the street rows: the
// light reads over the interior, not beside it.
export const WARMTH: readonly Colourway[] = [
  { name: "firelight", hue: 40, chroma: 0.15, lightness: 0.62, weight: 0.1 },
  { name: "candle", hue: 55, chroma: 0.16, lightness: 0.66, weight: 0.15 },
  { name: "amber", hue: 65, chroma: 0.13, lightness: 0.72, weight: 0.3 },
  { name: "honey", hue: 80, chroma: 0.11, lightness: 0.78, weight: 0.25 },
  { name: "lamplight", hue: 90, chroma: 0.06, lightness: 0.85, weight: 0.2 },
];

const ECHO_L = 0.05;

// Each coloured surface rolls its own family off the window seed, on a fork
// per group, so a tenant's frame, awning, sill, box, and cloth mostly
// differ and share a family only by chance. The three cloth roles are one
// construction per window, so they roll together as one group.
function rollColourway(
  seed: number,
  group: ColourGroup,
  hueJitter: number,
): Omit<Colourway, "weight"> {
  const rng = fork(seed, `colourway:${group}`);
  const table = group === "light" ? WARMTH : COLOURWAYS;
  const row = rng.weighted(table.map((way) => ({ value: way, weight: way.weight })));
  return {
    name: row.name,
    hue: rng.float(row.hue - hueJitter, row.hue + hueJitter),
    chroma: row.chroma,
    lightness: row.lightness,
  };
}

// A role carries no lightness: the colourway row is the finished colour.
interface RoleTint {
  alpha: number;
  echo: boolean;
  // The street roles sink into the ground at night; the roles that read
  // what is behind them — the cloth — and the interior roles keep their
  // colour and let the layers on top do the darkening.
  skipsNightMix?: boolean;
}

const ROLE_TINTS: Record<
  | "mullion"
  | "awning"
  | "sill"
  | "box"
  | "fabric"
  | "shade"
  | "blind"
  | "lamp"
  | "lampShade",
  RoleTint
> = {
  mullion: { alpha: 1, echo: false },
  awning: { alpha: 1, echo: false },
  sill: { alpha: 1, echo: false },
  box: { alpha: 1, echo: false },
  fabric: { alpha: 0.14, echo: true, skipsNightMix: true },
  shade: { alpha: 0.14, echo: true, skipsNightMix: true },
  blind: { alpha: 1, echo: false },
  lamp: { alpha: 1, echo: false, skipsNightMix: true },
  lampShade: { alpha: 1, echo: false, skipsNightMix: true },
};

// The dials of the colour model, all in one place: the hue jitter band, the
// saturation ceiling every tinted role wears, the scale on the families'
// chroma, the lift on their lightness, the scale on the cloth washes' alphas,
// the awning's laid-thin rung, and the night mix. The tuning bench drives
// these live; production always runs the defaults.
export interface ColourwayTuning {
  hueJitter: number;
  chromaCap: number;
  chromaScale: number;
  lightnessLift: number;
  washScale: number;
  awningChromaScale: number;
  awningLightnessShift: number;
  nightMix: number;
  lightChromaCap: number;
  veilAlpha: number;
  ambientAlpha: number;
  auraAlpha: number;
  lampLightnessShift: number;
}

export const DEFAULT_COLOURWAY_TUNING: ColourwayTuning = {
  hueJitter: 6,
  chromaCap: 0.09,
  chromaScale: 1,
  lightnessLift: 0,
  washScale: 1,
  awningChromaScale: 0.6,
  awningLightnessShift: 0.05,
  nightMix: 0.7,
  lightChromaCap: 0.1,
  veilAlpha: 0.55,
  ambientAlpha: 0.4,
  auraAlpha: 0.14,
  lampLightnessShift: -0.35,
};

interface RoleContext {
  theme: Theme;
  night: boolean;
  wayFor: (group: ColourGroup) => Omit<Colourway, "weight">;
  tuning: ColourwayTuning;
}

// A tinted role's resolver: the colourway row passes the tint — chroma cap,
// alpha, and, for the washes, the pooling echo composited into the one fill —
// and night sinks the result into the paper. Night is handled inside the
// resolver: it is a property of a colour, never a layer drawn over the wall.
const tintResolver =
  (
    t: RoleTint,
    group: ColourGroup,
    strength: (ctx: RoleContext) => { chromaScale: number; lightnessShift: number } = () => ({
      chromaScale: 1,
      lightnessShift: 0,
    }),
  ) =>
  (ctx: RoleContext): ResolvedColor => {
    const { theme, night, wayFor, tuning } = ctx;
    const way = wayFor(group);
    const wear = strength(ctx);
    const l = way.lightness + tuning.lightnessLift + wear.lightnessShift;
    const chroma = Math.min(
      way.chroma * tuning.chromaScale * wear.chromaScale,
      tuning.chromaCap,
    );
    const color = oklchToCss({ l, c: chroma, h: way.hue });
    const alpha = t.alpha * (t.echo ? tuning.washScale : 1);
    let dress: ResolvedColor;
    if (!t.echo) {
      dress = { color, alpha };
    } else {
      // The pooling echo — a second pass, lighter at half strength — composites
      // into the one fill it actually draws as: canvas blending is linear per
      // channel, so the two passes collapse to a compounded alpha and the
      // matching channel blend of echo and base.
      const echo = oklchToCss({
        l: l + ECHO_L,
        c: chroma,
        h: way.hue,
      });
      const echoAlpha = alpha / 2;
      const compounded = 1 - (1 - alpha) * (1 - echoAlpha);
      dress = {
        color: mixCss(echo, color, (alpha * (1 - echoAlpha)) / compounded),
        alpha: compounded,
      };
    }
    return night && t.skipsNightMix !== true
      ? { color: mixCss(dress.color, theme.paper, tuning.nightMix), alpha: dress.alpha }
      : dress;
  };

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

// The furniture grays resolve from the theme pair alone — no colourway roll,
// no per-seed difference: the mix constant is the whole decision, and a
// theme flip re-derives both grays by construction.
const grayResolver = (inkMix: number) =>
  (ctx: RoleContext): ResolvedColor => {
    const { theme } = ctx;
    return { color: mixCss(theme.paper, theme.ink, inkMix), alpha: OCCLUDE };
  };

// One resolver per role, so a new role is one map row: theme-bound roles read
// the theme pair, tinted roles resolve their colourway group through a tint.
// A role missing from the map fails the compile — and a caller casting past
// the type still fails at the resolution site.
const ROLE_RESOLVERS: Record<ColorRole, (ctx: RoleContext) => ResolvedColor> = {
  ink: ({ theme }) => ({ color: theme.ink, alpha: OCCLUDE }),
  glass: ({ theme }) => ({ color: theme.ink, alpha: GLASS_WASH }),
  paper: ({ theme }) => ({ color: theme.paper, alpha: OCCLUDE }),
  mullion: tintResolver(ROLE_TINTS.mullion, "mullion"),
  awning: tintResolver(ROLE_TINTS.awning, "awning"),
  awningThin: tintResolver(ROLE_TINTS.awning, "awning", ({ tuning }) => ({
    chromaScale: tuning.awningChromaScale,
    lightnessShift: tuning.awningLightnessShift,
  })),
  sill: tintResolver(ROLE_TINTS.sill, "sill"),
  box: tintResolver(ROLE_TINTS.box, "box"),
  fabric: tintResolver(ROLE_TINTS.fabric, "cloth"),
  shade: tintResolver(ROLE_TINTS.shade, "cloth"),
  blind: tintResolver(ROLE_TINTS.blind, "cloth"),
  lamp: tintResolver(ROLE_TINTS.lamp, "lamp", ({ tuning }) => ({
    chromaScale: 1,
    lightnessShift: tuning.lampLightnessShift,
  })),
  lampShade: tintResolver(ROLE_TINTS.lampShade, "lamp"),
  light: warmthResolver(() => OCCLUDE),
  ambient: warmthResolver((tuning) => tuning.ambientAlpha),
  aura: warmthResolver((tuning) => tuning.auraAlpha),
  veil: ({ theme, tuning }) => ({ color: theme.paper, alpha: tuning.veilAlpha }),
  furniture: grayResolver(FURNITURE_INK_MIX),
  furnitureDetail: grayResolver(FURNITURE_DETAIL_INK_MIX),
};
// The window's own palette: theme-bound roles resolve from the theme's two
// colours; tinted roles resolve from the colourway. A role with no
// registered resolution throws — drawing code names roles, styling alone
// decides colour, and an unregistered role must crash at the resolution
// site rather than draw in a guessed colour.
const paletteCache = new Map<string, Palette>();
// A pure function of (seed, theme) needs no eviction policy beyond a bound:
// the wall's meta-seed re-roll would otherwise grow the cache unbounded
// across a long session, and dropping a palette only costs a re-derive.
const PALETTE_CACHE_MAX = 512;

export function windowPalette(seed: number, theme: Theme): Palette {
  const key = `${seed}|${theme.ink}|${theme.paper}`;
  let palette = paletteCache.get(key);
  if (!palette) {
    palette = buildPalette(
      theme,
      (group) => rollColourway(seed, group, DEFAULT_COLOURWAY_TUNING.hueJitter),
      DEFAULT_COLOURWAY_TUNING,
    );
    if (paletteCache.size >= PALETTE_CACHE_MAX) paletteCache.clear();
    paletteCache.set(key, palette);
  }
  return palette;
}

// The tuning bench's entry: the same resolution, unmemoized and wearing
// whatever tuning the bench's sliders hold.
export function tunedWindowPalette(
  seed: number,
  theme: Theme,
  tuning: ColourwayTuning,
): Palette {
  return buildPalette(
    theme,
    (group) => rollColourway(seed, group, tuning.hueJitter),
    tuning,
  );
}

function buildPalette(
  theme: Theme,
  wayFor: (group: ColourGroup) => Omit<Colourway, "weight">,
  tuning: ColourwayTuning,
): Palette {
  const ctx: RoleContext = {
    theme,
    night: theme.isNight,
    wayFor,
    tuning,
  };
  // Resolved eagerly, so a role's roll happens even when a bare window never
  // reads it — a silently discarded throw keeps the stream's shape honest.
  const resolved = {} as Record<ColorRole, ResolvedColor>;
  for (const [role, resolve] of Object.entries(ROLE_RESOLVERS)) {
    resolved[role as ColorRole] = resolve(ctx);
  }
  return (role) => {
    const dress = resolved[role];
    if (!dress)
      throw new Error(
        `no registered resolution for colour role: ${String(role)}`,
      );
    return dress;
  };
}
