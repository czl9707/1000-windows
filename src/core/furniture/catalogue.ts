// The furniture catalogue: pure data. Decided in the wayfinder ticket
// "Furniture — the room behind the glass"; the numbers are constants of the
// street, weights tuned at build.
//
// Roll order in the furniture stream (append new rolls at the end, never
// between): count, then per piece kind → depth plane → edge side, and for a
// desk piece its screen. The lamp counts toward the cap but does not roll
// here — its plan already sat on the stream in the light block. Two pieces
// take distinct planes (one piece per plane) and distinct kinds (a room
// reads plain, not doubled); the catalogue is freely editable between
// versions, a seed's roll sequence a pure function of the seed.

export type FurnitureKind =
  | 'coatStand'
  | 'coatRack'
  | 'ladderShelf'
  | 'roomDivider'
  | 'desk'
  | 'bookcase'
  | 'wardrobe'
  | 'dresser'
  | 'armchair'
  | 'sofa'
  | 'chinaCabinet'
  | 'hallBench'
  | 'rockingChair'
  | 'piano'
  | 'easel';

export const FURNITURE_KINDS: readonly { value: FurnitureKind; weight: number }[] = [
  { value: 'coatStand', weight: 3 },
  { value: 'coatRack', weight: 2 },
  { value: 'ladderShelf', weight: 2 },
  { value: 'roomDivider', weight: 2 },
  { value: 'desk', weight: 3 },
  { value: 'bookcase', weight: 3 },
  { value: 'wardrobe', weight: 2 },
  { value: 'dresser', weight: 3 },
  { value: 'armchair', weight: 3 },
  { value: 'sofa', weight: 2 },
  { value: 'chinaCabinet', weight: 2 },
  { value: 'hallBench', weight: 2 },
  { value: 'rockingChair', weight: 2 },
  { value: 'piano', weight: 2 },
  { value: 'easel', weight: 3 },
];

// The room owns six depth planes; the lamp always occupies plane 1, the
// furniture pieces take distinct planes from the rest.
export type DepthPlane = 2 | 3 | 4 | 5 | 6;
export const FURNITURE_PLANES: readonly DepthPlane[] = [2, 3, 4, 5, 6];

// The desk's screen is part of the desk construction, never a light source —
// the light layer owns all light — and wears the same silhouette gray as
// its desk.
export type Screen = 'laptop' | 'monitor';
export const SCREENS: readonly { value: Screen; weight: number }[] = [
  { value: 'laptop', weight: 2 },
  { value: 'monitor', weight: 1 },
];

// Where each plane sits, in unit measure: plane 2 just behind the lamp's
// depth (the light layer's LIGHT_DEPTH), plane 6 deepest in the room.
export const PLANE_DEPTH: Record<DepthPlane, number> = {
  2: -0.13,
  3: -0.14,
  4: -0.15,
  5: -0.16,
  6: -0.17,
};

// The planes' sort buckets, between the shell backing (-10) and the light
// block (-7): deeper planes sort first, so the room draws back to front and
// the light lays over every piece.
export const PLANE_Z: Record<DepthPlane, number> = {
  2: -8,
  3: -8.4,
  4: -8.8,
  5: -9.2,
  6: -9.6,
};
