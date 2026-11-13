import {
  GLASS_WASH,
  OCCLUDE,
  type ColorRole,
  type Palette,
  type ResolvedColor,
  type Theme,
} from '@/styling/roles';
import { TV_SCREEN } from '@/styling/colourway';

// The resolution chapters 03-07 draw in: the pre-colourway palette, the one
// makePalette held before chapter 08 split the roles per surface group. The
// demos before that chapter must not grow a seed or a colourway, so they
// share this stand-in instead of the real windowPalette.

// The curtain cloth: the ink colour at a whisper — a wash a shade darker
// than the paper it covers, the same for the hanging cloth and the shade.
// The venetian's slat rows occlude, like the painted faces.
const FABRIC_CLOTH = 0.08;
const SHADE_CLOTH = 0.08;

export function mockPalette(theme: Theme): Palette {
  const dresses: Record<ColorRole, ResolvedColor> = {
    ink: { color: theme.ink, alpha: 1 },
    glass: { color: theme.ink, alpha: GLASS_WASH },
    paper: { color: theme.paper, alpha: OCCLUDE },
    // The painted faces did not paint yet: the frame face occluded in the
    // ground colour, and the awning, the sill ledge, and the box wood are
    // the colour era's names for surfaces that occluded the same way.
    mullion: { color: theme.paper, alpha: OCCLUDE },
    awning: { color: theme.paper, alpha: OCCLUDE },
    awningThin: { color: theme.paper, alpha: OCCLUDE },
    sill: { color: theme.paper, alpha: OCCLUDE },
    box: { color: theme.paper, alpha: OCCLUDE },
    fabric: { color: theme.ink, alpha: FABRIC_CLOTH },
    shade: { color: theme.ink, alpha: SHADE_CLOTH },
    blind: { color: theme.ink, alpha: OCCLUDE },
    // The light layer postdates these chapters: its roles occlude in the
    // ground colour here, the way the painted faces do.
    lamp: { color: theme.paper, alpha: OCCLUDE },
    lampShade: { color: theme.paper, alpha: OCCLUDE },
    light: { color: theme.paper, alpha: OCCLUDE },
    ambient: { color: theme.ink, alpha: 0 },
    aura: { color: theme.ink, alpha: 0 },
    veil: { color: theme.paper, alpha: 0 },
    // The furniture layer postdates them too: its roles draw nothing here,
    // though the screen keeps its fixed dark — the one fact the mock carries
    // rather than contradict.
    furniture: { color: theme.paper, alpha: OCCLUDE },
    tvScreen: { color: TV_SCREEN, alpha: OCCLUDE },
  };
  return (role) => dresses[role];
}
