// The fixed line weights of the drawing, in unit measure — one catalogue,
// after the draughtsman's nib set 0.3 / 0.2 / 0.15 / 0.1 mm, scaled to the
// codebase's unit measure. Every stroke width comes from here.
export const WEIGHTS = {
  // Heaviest: a mass's own outline against the wall (sill top, awning mount).
  outline: 0.03,
  // Structural lines: frames, pane edges, leading edges.
  major: 0.02,
  // Detail lines: panels, ribs, slats, sides.
  minor: 0.015,
  // Hairlines: masonry joints and the lightest surface work.
  frame: 0.01,
  // The lightest: curtain line work — folds, slats — reading as texture
  // over the cloth, quieter than the frame's own lines.
  texture: 0.008,
} as const;
