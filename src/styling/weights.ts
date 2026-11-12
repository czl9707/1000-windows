// The fixed line weights of the drawing, in unit measure — one catalogue,
// after the draughtsman's nib set 0.3 / 0.2 / 0.15 / 0.1 mm, scaled to the
// codebase's unit measure. Every stroke width comes from here.
export const WEIGHTS = {
  outline: 0.022,
  structural: 0.018,
  detail: 0.012,
  hairline: 0.007,
  texture: 0.004,
} as const;
