// No drawing code names a colour value or a wash strength.

// 'ink' draws solid — the lines and dots; 'glass' is the pane wash;
// 'paper' occludes in the ground colour. The painted surfaces occlude in
// their own paint: the frame face ('mullion'), the awning canvas at its two
// wears ('awning' full, 'awningThin' laid thin), the sill ledge, the
// window-box wood. The curtain cloth resolves by
// construction: 'fabric' is hanging cloth (panels, drapes), 'shade' the
// roman's flat cloth, and 'blind' the venetian's opaque slat rows.
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
  // The furniture roles carry no colourway: 'furniture' is the room's pieces
  // as one uniform gray silhouette, 'furnitureDetail' the interior detail
  // strokes in a lighter gray — both mixed from the theme pair, so a theme
  // flip re-resolves them.
  | "furniture"
  | "furnitureDetail";

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

// The furniture grays, as the share of ink mixed into the theme paper: the
// silhouette sits well below the paper's lightness, the detail strokes well
// above the silhouette — two distinct grays, no colourway roll.
export const FURNITURE_INK_MIX = 0.35;
export const FURNITURE_DETAIL_INK_MIX = 0.14;

// Rebuilt each frame from the theme's colours and the window's colourway, so
// a theme switch re-renders the same scene in the new colours.
export type Palette = (role: ColorRole) => ResolvedColor;
