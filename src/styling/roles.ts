// No drawing code names a colour value or a wash strength.

// 'ink' draws solid — the lines and dots; 'glass' is the pane wash;
// 'paper' occludes in the ground colour; 'mullion' fills the frame's face
// between its outer and inner lines, in the same ground colour for now.
// The curtain cloth resolves by construction: 'fabric' is hanging cloth
// (panels, drapes), 'shade' the roman's flat cloth, and 'blind' the
// venetian's opaque slat rows.
export type ColorRole =
  "ink" | "glass" | "paper" | "mullion" | "fabric" | "shade" | "blind";

// The theme's two colours, read off the page (demoLoop reads the CSS tokens
// and hands them down with every frame; the painter builds the palette).
export interface ThemeColors {
  ink: string;
  paper: string;
}

export interface Dress {
  color: string;
  alpha: number;
}

// Rebuilt each frame from the theme's colours, so a theme switch re-renders
// the same scene in the new colours.
export type Palette = (role: ColorRole) => Dress;

// Verdict from the page: 0.5 was for eyeballing, the wash
// settles at 0.05 — visible, never louder than the lines.
const GLASS_WASH = 0.05;

// The curtain cloth: the ink colour at a whisper — a wash a shade darker
// than the paper it covers, so the cloth reads at wall distance yet stays
// quieter than the lines. 0.08 for the hanging cloth and the shade alike,
// 0.12 for the venetian's slat rows. A band drawn twice over the cloth
// stacks — the darker band is the fold's shade.
const FABRIC_CLOTH = 0.08;
const SHADE_CLOTH = 0.08;
const BLIND_CLOTH = 0.12;

// Occluding fills go down opaque: they exist to hide the wall and the layers
// behind an add-on, so anything less lets lines ghost through.
const OCCLUDE = 1;

// The wall texture's washes: the stipple grain, and the brick-patch islands
// sitting over it — quieter than the patches stood alone.
export const WALL_TEXTURE_WASH = { stipple: 0.4, patch: 0.24 } as const;

export function makePalette(colors: ThemeColors): Palette {
  const dresses: Record<ColorRole, Dress> = {
    ink: { color: colors.ink, alpha: 1 },
    glass: { color: colors.ink, alpha: GLASS_WASH },
    paper: { color: colors.paper, alpha: OCCLUDE },
    mullion: { color: colors.paper, alpha: OCCLUDE },
    fabric: { color: colors.ink, alpha: FABRIC_CLOTH },
    shade: { color: colors.ink, alpha: SHADE_CLOTH },
    blind: { color: colors.ink, alpha: BLIND_CLOTH },
  };
  return (role) => dresses[role];
}
