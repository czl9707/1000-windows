// No drawing code names a colour value or a wash strength.

// 'ink' draws solid — the lines and dots; 'glass' is the pane wash;
// 'paper' occludes in the ground colour. The painted surfaces occlude in
// their own paint: the frame face ('mullion'), the awning canvas at its two
// wears ('awning' full, 'awningThin' laid thin), the sill ledge, the
// window-box wood. The curtain cloth resolves by
// construction: 'fabric' is hanging cloth (panels, drapes), 'shade' the
// roman's flat cloth, and 'blind' the venetian's slat rows — every curtain
// fill caps its wash, so the room reads through the cloth.
// The interior roles carry the light layer: 'lamp' is the lamp structure's
// own furniture paint, 'lampShade' the emitting part's colour whenever the
// lamp is off — the same colourway as the body, without the dark sink —
// 'light' the emitter's warmth, 'ambient' the room's
// low wash of it, 'aura' the lamp's local glow — all three warmth roles
// resolve from one roll, so a room wears a single light colour — and
// 'veil' is the darkening wash an unlit room draws over its interior.
export type ColorRole =
  | "ink"
  | "glass"
  | "paper"
  | "mullion"
  | "awning"
  | "awningThin"
  | "sill"
  | "box"
  | "fabric"
  | "shade"
  | "blind"
  | "lamp"
  | "lampShade"
  | "light"
  | "ambient"
  | "aura"
  | "veil"
  // The furniture roles carry no colourway: the room's pieces as gray
  // silhouettes mixed from the theme pair, one shade per depth plane — the
  // deeper the plane, the lighter the gray — so a theme flip re-resolves
  // them. The digit is the room's depth plane (2 nearest, 6 deepest).
  | `furniture${2 | 3 | 4 | 5 | 6}`;

// The theme's colours and its night flag, read off the page (demoLoop reads
// the CSS tokens and the theme attribute, and hands them down with every
// frame; the painter builds the palette). Night is declared by the page's
// own theme switch, never guessed from the colours.
export interface Theme {
  ink: string;
  paper: string;
  isNight: boolean;
}

// One resolved fill: the finish styling decided, ready to draw in one pass.
export interface ResolvedColor {
  color: string;
  alpha: number;
}

// Verdict from the page: 0.5 was for eyeballing, the wash
// settles at 0.05 — visible, never louder than the lines.
export const GLASS_WASH = 0.05;

// Occluding fills go down opaque: they exist to hide the wall and the layers
// behind an add-on, so anything less lets lines ghost through.
export const OCCLUDE = 1;

// The furniture gray, as the share of ink mixed into the theme paper, one
// per depth plane: every shade sits well below the paper's lightness, and
// the mix thins with depth — the deeper a piece stands in the room, the
// lighter its gray, the way air washes a distant body toward the ground.
// Night swaps which of paper and ink is light, so the grays follow the
// theme the way the ink lines do.
export const FURNITURE_INK_MIX: Record<2 | 3 | 4 | 5 | 6, number> = {
  2: 0.2,
  3: 0.17,
  4: 0.145,
  5: 0.12,
  6: 0.1,
};

// Rebuilt each frame from the theme's colours and the window's colourway, so
// a theme switch re-renders the same scene in the new colours.
export type Palette = (role: ColorRole) => ResolvedColor;
