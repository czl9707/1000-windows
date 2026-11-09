import {
  GLASS_WASH,
  OCCLUDE,
  type ColorRole,
  type Palette,
  type ResolvedColor,
  type ThemeColors,
} from '@/styling/roles';

// The resolution chapters 03-07 draw in: the pre-colourway palette, the one
// makePalette held before chapter 08 split the roles per surface group. The
// demos before that chapter must not grow a seed or a colourway, so they
// share this stand-in instead of the real windowPalette.

// The curtain cloth: the ink colour at a whisper — a wash a shade darker
// than the paper it covers. 0.08 for the hanging cloth and the shade alike,
// 0.12 for the venetian's slat rows.
const FABRIC_CLOTH = 0.08;
const SHADE_CLOTH = 0.08;
const BLIND_CLOTH = 0.12;

export function mockPalette(colors: ThemeColors): Palette {
  const dresses: Record<ColorRole, ResolvedColor> = {
    ink: { color: colors.ink, alpha: 1 },
    glass: { color: colors.ink, alpha: GLASS_WASH },
    paper: { color: colors.paper, alpha: OCCLUDE },
    // The painted faces did not paint yet: the frame face occluded in the
    // ground colour, and the awning, the sill ledge, and the box wood are
    // the colour era's names for surfaces that occluded the same way.
    mullion: { color: colors.paper, alpha: OCCLUDE },
    awning: { color: colors.paper, alpha: OCCLUDE },
    awningThin: { color: colors.paper, alpha: OCCLUDE },
    sill: { color: colors.paper, alpha: OCCLUDE },
    box: { color: colors.paper, alpha: OCCLUDE },
    fabric: { color: colors.ink, alpha: FABRIC_CLOTH },
    shade: { color: colors.ink, alpha: SHADE_CLOTH },
    blind: { color: colors.ink, alpha: BLIND_CLOTH },
    // The light layer postdates these chapters: its roles occlude in the
    // ground colour here, the way the painted faces do.
    lamp: { color: colors.paper, alpha: OCCLUDE },
    emitter: { color: colors.paper, alpha: OCCLUDE },
    ambient: { color: colors.ink, alpha: 0 },
    aura: { color: colors.ink, alpha: 0 },
  };
  return (role) => dresses[role];
}
