// The furniture catalogue: pure data. Decided in the wayfinder ticket
// "Furniture — the room behind the glass"; the numbers are constants of the
// drawing, the weights of the street.
//
// Roll order in the furniture block (append new rolls at the end, never
// between): plane 2 → plane 6, and within a plane occupied → kind → anchor
// share → width jitter → variant. The `empty` plane rolls nothing further.
// The block appends to the DNA stream after the light block's — plane 1
// stays the lamp's, so this block never reads the light's plan. New kinds
// append to KINDS; the catalogue is freely editable between versions, a
// seed's roll sequence stays a pure function of the seed.
//
// The variant roll is the block's spare: rolled for every kind, read only by
// the kinds that carry a count or a lean — the curtain's slatShare pattern.
// crates: the stacked count. dryingRack, coatRack: which side the frame
// leans. easel: the canvas tilt. Every other kind leaves it unread.
//
// Identity strokes draw at the styling WEIGHTS.detail rung — one step
// heavier than the sill items' texture; the weights' own catalogue stays the
// single authority for line widths.

export type FurnitureKind =
  | 'bookshelf'
  | 'wardrobe'
  | 'dresser'
  | 'tvStand'
  | 'coatStand'
  | 'coatRack'
  | 'ladderShelf'
  | 'dryingRack'
  | 'easel'
  | 'mirror'
  | 'roomDivider'
  | 'crates';

// Only pieces tall enough to break the sill line: the room's floor sits
// below the opening, so a low piece never shows. The common shapes common,
// the room divider and the crates rare.
export const KINDS: readonly { value: FurnitureKind; weight: number }[] = [
  { value: 'bookshelf', weight: 3 },
  { value: 'wardrobe', weight: 2 },
  { value: 'dresser', weight: 3 },
  { value: 'tvStand', weight: 2 },
  { value: 'coatStand', weight: 1 },
  { value: 'coatRack', weight: 2 },
  { value: 'ladderShelf', weight: 2 },
  { value: 'dryingRack', weight: 1 },
  { value: 'easel', weight: 1 },
  { value: 'mirror', weight: 2 },
  { value: 'roomDivider', weight: 1 },
  { value: 'crates', weight: 1 },
];

// Occupancy per plane, planes 2–6 nearest first: the room thins as it
// recedes, deeper planes standing more often empty.
export const PLANE_OCCUPANCY: readonly number[] = [0.45, 0.38, 0.3, 0.24, 0.18];

// The TV prefers near planes — its weight multiplies there, the reference's
// soft `lieber` bias, so its silhouette stays readable; every other kind
// sits where it lands.
export const NEAR_PLANE_COUNT = 2;
export const TV_NEAR_PLANE_BIAS = 3;

// The silhouette's width jitters around its kind constant, so two windows
// of the same kind never match piece for piece.
export const WIDTH_JITTER = { min: 0.9, max: 1.1 } as const;

// The anchor across the opening's width, as a share of it — never the very
// edge, so a piece never reads as glued to the jamb.
export const ANCHOR_RANGE = { min: 0.05, max: 0.95 } as const;

// The six planes' standing depths in unit measure, planes 2–6 nearest first:
// negative z stands behind the wall plane, deeper planes further back, past
// the light block's LIGHT_DEPTH so the veil and the aura lay over every
// piece. Sort keys only — these values reach the points (the projection
// scales them); the buckets below never do.
export const PLANE_DEPTH: readonly number[] = [-0.15, -0.19, -0.23, -0.27, -0.31];

// The sort buckets, spaced so the draw stage lands the planes back to front
// under the light block's LIGHT_Z (-7), the curtain's CURTAIN_Z (-5), and
// the sill's SILL_ITEM_Z (-2). Plane 2 draws last of the six.
export const PLANE_Z: readonly number[] = [-8, -9, -10, -11, -12];

// Each plane's piece scale in world measure: a deeper piece is a smaller
// piece, the room's perspective stated in the geometry itself (the
// projection adds only the eye's parallax on top).
export const PLANE_SCALE: readonly number[] = [1, 0.92, 0.84, 0.76, 0.68];
