// The dressing table: colour roles, their strengths, and the palette. One
// home — a mark names its dress as a role, and everything a role means
// (which palette channel, how strongly) resolves here. No drawing code
// names a colour value or a wash strength.

// 'ink' draws solid — the lines and dots; 'glass' is the pane wash;
// 'paper' occludes in the ground colour.
export type ColorRole = 'ink' | 'glass' | 'paper';

// The theme's two colours, read off the page (demoLoop reads the CSS tokens
// and hands a palette down with every frame).
export interface Palette {
  ink: string;
  paper: string;
}

interface RoleDef {
  channel: keyof Palette;
  alpha: number;
}

// The glass wash. Verdict from the page: 0.5 was for eyeballing, the wash
// settles at 0.05 — visible, never louder than the lines.
const GLASS_WASH = 0.05;

// Occluding fills go down opaque: they exist to hide the wall and the layers
// behind an add-on, so anything less lets lines ghost through.
const OCCLUDE = 1;

const ROLES: Record<ColorRole, RoleDef> = {
  ink: { channel: 'ink', alpha: 1 },
  glass: { channel: 'ink', alpha: GLASS_WASH },
  paper: { channel: 'paper', alpha: OCCLUDE },
};

// A resolved dress: the colour to paint with and how strongly.
export interface Dress {
  color: string;
  alpha: number;
}

export function dress(role: ColorRole, palette: Palette): Dress {
  const def = ROLES[role];
  return { color: palette[def.channel], alpha: def.alpha };
}
