// No drawing code names a colour value or a wash strength.

// 'ink' draws solid — the lines and dots; 'glass' is the pane wash;
// 'paper' occludes in the ground colour. The painted surfaces occlude in
// their own paint: the frame face ('mullion'), the awning canvas, the
// shutter slats, the window-box wood. The curtain cloth resolves by
// construction: 'fabric' is hanging cloth (panels, drapes), 'shade' the
// roman's flat cloth, and 'blind' the venetian's opaque slat rows.
export type ColorRole =
  | "ink"
  | "glass"
  | "paper"
  | "mullion"
  | "awning"
  | "shutter"
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

// Rebuilt each frame from the theme's colours and the window's colourway, so
// a theme switch re-renders the same scene in the new colours.
export type Palette = (role: ColorRole) => ResolvedColor;
