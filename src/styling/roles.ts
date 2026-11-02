// The dressing table: colour roles, and the one function that resolves them.
// A mark names its dress as a role; the palette is that resolution — a
// function from role to colour and strength, built from the theme's two
// colours and rebuilt every frame. No drawing code names a colour value or
// a wash strength.

// 'ink' draws solid — the lines and dots; 'glass' is the pane wash;
// 'paper' occludes in the ground colour.
export type ColorRole = 'ink' | 'glass' | 'paper';

// The theme's two colours, read off the page (demoLoop reads the CSS tokens
// and hands them down with every frame; the painter builds the palette).
export interface ThemeColors {
  ink: string;
  paper: string;
}

// A resolved dress: the colour to paint with and how strongly.
export interface Dress {
  color: string;
  alpha: number;
}

// The palette: role in, dress out. A theme switch re-renders the same scene
// in the new colours because the palette is rebuilt each frame from them.
export type Palette = (role: ColorRole) => Dress;

// The glass wash. Verdict from the page: 0.5 was for eyeballing, the wash
// settles at 0.05 — visible, never louder than the lines.
const GLASS_WASH = 0.05;

// Occluding fills go down opaque: they exist to hide the wall and the layers
// behind an add-on, so anything less lets lines ghost through.
const OCCLUDE = 1;

export function makePalette(colors: ThemeColors): Palette {
  const dresses: Record<ColorRole, Dress> = {
    ink: { color: colors.ink, alpha: 1 },
    glass: { color: colors.ink, alpha: GLASS_WASH },
    paper: { color: colors.paper, alpha: OCCLUDE },
  };
  return (role) => dresses[role];
}
