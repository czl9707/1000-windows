// No drawing code names a colour value or a wash strength.

// 'ink' draws solid — the lines and dots; 'glass' is the pane wash;
// 'paper' occludes in the ground colour. The painted surfaces occlude in
// their own paint: the frame face ('mullion'), the awning canvas at its two
// wears ('awning' full, 'awningThin' laid thin), the sill ledge, the
// window-box wood. The curtain cloth resolves by
// construction: 'fabric' is hanging cloth (panels, drapes), 'shade' the
// roman's flat cloth, and 'blind' the venetian's opaque slat rows.
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
  | "blind";

// The theme's two colours, read off the page (demoLoop reads the CSS tokens
// and hands them down with every frame; the painter builds the palette).
export interface ThemeColors {
  ink: string;
  paper: string;
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

// Rebuilt each frame from the theme's colours and the window's colourway, so
// a theme switch re-renders the same scene in the new colours.
export type Palette = (role: ColorRole) => ResolvedColor;
