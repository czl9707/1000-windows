// The light catalogue: pure data. Everything here is decided in the wayfinder
// tickets "Light" (017) and "Lamp constructions — ten home lamps" (025); the
// numbers are constants of the drawing, the weights of the street.
//
// Roll order in the light block (append new rolls at the end, never between):
// on → kind → seat → facing. The block never ends early — an off window
// still rolls every field and reads none of them, so a layer appended after
// this one keeps its draw order.
//
// The light block appends to the DNA stream after the sill's, and the warmth
// row never touches this stream: colour rolls on its own fork in styling.

// The street reads lit at roughly a third of the windows, at any hour — the
// lit pane is the event.
export const LIGHTS: readonly { value: 'off' | 'on'; weight: number }[] = [
  { value: 'off', weight: 2 },
  { value: 'on', weight: 1 },
];

export type LampKind =
  | 'floor'
  | 'arc'
  | 'table'
  | 'bedside'
  | 'pendant'
  | 'bare';

// The six picked constructions, uniform: the street shows no favourite.
export const KINDS: readonly { value: LampKind; weight: number }[] = [
  { value: 'floor', weight: 1 },
  { value: 'arc', weight: 1 },
  { value: 'table', weight: 1 },
  { value: 'bedside', weight: 1 },
  { value: 'pendant', weight: 1 },
  { value: 'bare', weight: 1 },
];

// Where a kind stands: the two hangers drop from the ceiling line, the rest
// stand on the floor line.
export const SEATS: Record<LampKind, 'floor' | 'ceiling'> = {
  floor: 'floor',
  arc: 'floor',
  table: 'floor',
  bedside: 'floor',
  pendant: 'ceiling',
  bare: 'ceiling',
};

// The seat slot: a fraction across the opening, held off the jambs wide
// enough that no construction reads as stuck to the frame.
export const SEAT_RANGE = { min: 0.18, max: 0.82 } as const;

// Which way a lamp faces — rolled for every kind, read only by the ones
// that lean (the arc's head); the upright kinds leave it rolled but unread.
export type Facing = 'left' | 'right';

export const FACING_SIDES: readonly { value: Facing; weight: number }[] = [
  { value: 'left', weight: 1 },
  { value: 'right', weight: 1 },
];

// The layer stands in the room behind the curtain cloth — deeper than the
// cloth's depth, so the projection sits it behind, and its sort bucket
// slides between the shell's backing and the curtain's. A bucket value must
// never reach the points, and the depth must never reach a sort key.
export const LIGHT_DEPTH = -0.12;
export const LIGHT_Z = -7;
