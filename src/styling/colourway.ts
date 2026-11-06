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
import { cssToOklch, mixCss, oklchToCss } from "./oklch";
import {
  type ColorRole,
  type Palette,
  type ResolvedColor,
  type ThemeColors,
} from "./roles";

// Verdict from the page: 0.5 was for eyeballing, the wash
// settles at 0.05 — visible, never louder than the lines.
const GLASS_WASH = 0.05;

// Occluding fills go down opaque: they exist to hide the wall and the layers
// behind an add-on, so anything less lets lines ghost through.
const OCCLUDE = 1;

export interface Colourway {
  name: string;
  hue: number;
  chroma: number;
  lightness: number;
  weight: number;
}

type ColourGroup = "mullion" | "awning" | "sill" | "box" | "cloth";

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

const ECHO_L = 0.05;

// Each coloured surface rolls its own family off the window seed, on a fork
// per group, so a tenant's frame, awning, sill, box, and cloth mostly
// differ and share a family only by chance. The three cloth roles are one
// construction per window, so they roll together as one group.
function rollColourway(
  seed: number,
  group: string,
  hueJitter: number,
): Omit<Colourway, "weight"> {
  const rng = fork(seed, `colourway:${group}`);
  const row = rng.weighted(
    COLOURWAYS.map((way) => ({ value: way, weight: way.weight })),
  );
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
}

const ROLE_TINTS: Record<
  "mullion" | "awning" | "sill" | "box" | "fabric" | "shade" | "blind",
  RoleTint
> = {
  mullion: { alpha: 1, echo: false },
  awning: { alpha: 1, echo: false },
  sill: { alpha: 1, echo: false },
  box: { alpha: 1, echo: false },
  fabric: { alpha: 0.14, echo: true },
  shade: { alpha: 0.14, echo: true },
  blind: { alpha: 0.16, echo: true },
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
};

const NIGHT_PAPER_L = 0.5;
// The flip reads the ground itself, so the theme tokens carry a second
// constraint beside their contrast with the ink: a paper moved across this
// lightness silently flips night for the whole wall.

interface RoleContext {
  colors: ThemeColors;
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
    const { colors, night, wayFor, tuning } = ctx;
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
    return night
      ? { color: mixCss(dress.color, colors.paper, tuning.nightMix), alpha: dress.alpha }
      : dress;
  };

// One resolver per role, so a new role is one map row: theme-bound roles read
// the theme pair, tinted roles resolve their colourway group through a tint.
// A role missing from the map fails the compile — and a caller casting past
// the type still fails at the resolution site.
const ROLE_RESOLVERS: Record<ColorRole, (ctx: RoleContext) => ResolvedColor> = {
  ink: ({ colors }) => ({ color: colors.ink, alpha: OCCLUDE }),
  glass: ({ colors }) => ({ color: colors.ink, alpha: GLASS_WASH }),
  paper: ({ colors }) => ({ color: colors.paper, alpha: OCCLUDE }),
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

export function windowPalette(seed: number, colors: ThemeColors): Palette {
  const key = `${seed}|${colors.ink}|${colors.paper}`;
  let palette = paletteCache.get(key);
  if (!palette) {
    palette = buildPalette(
      colors,
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
  colors: ThemeColors,
  tuning: ColourwayTuning,
): Palette {
  return buildPalette(
    colors,
    (group) => rollColourway(seed, group, tuning.hueJitter),
    tuning,
  );
}

function buildPalette(
  colors: ThemeColors,
  wayFor: (group: ColourGroup) => Omit<Colourway, "weight">,
  tuning: ColourwayTuning,
): Palette {
  const ctx: RoleContext = {
    colors,
    night: cssToOklch(colors.paper).l < NIGHT_PAPER_L,
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
