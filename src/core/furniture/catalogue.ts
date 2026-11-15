// The furniture catalogue: pure data. Decided in the wayfinder ticket
// "Furniture — the room behind the glass"; the numbers are constants of the
// street, weights tuned at build.
//
// Roll order in the furniture stream (append new rolls at the end, never
// between): count, then per piece kind → depth plane → edge side. The lamp
// counts toward the cap but does not roll here — its plan already sat on
// the stream in the light block. Two pieces take distinct planes (one piece
// per plane) and distinct kinds (a room reads plain, not doubled); the
// catalogue is freely editable between versions, a seed's roll sequence a
// pure function of the seed.

export type FurnitureKind =
  | 'coatStand'
  | 'coatRack'
  | 'ladderShelf'
  | 'roomDivider'
  | 'desk';

export const FURNITURE_KINDS: readonly { value: FurnitureKind; weight: number }[] = [
  { value: 'coatStand', weight: 3 },
  { value: 'coatRack', weight: 2 },
  { value: 'ladderShelf', weight: 2 },
  { value: 'roomDivider', weight: 2 },
  { value: 'desk', weight: 3 },
];

// The room owns six depth planes; the lamp always occupies plane 1, the
// furniture pieces take distinct planes from the rest.
export type DepthPlane = 2 | 3 | 4 | 5 | 6;
export const FURNITURE_PLANES: readonly DepthPlane[] = [2, 3, 4, 5, 6];
