// The light catalogue: pure data. Decided in the wayfinder tickets "Light —
// lit panes, warmth genes, the lamp, and the aura" and "Lamp constructions —
// ten home lamps"; the numbers are constants of the drawing, the weights of
// the street.
//
// Roll order in the light stream (append new rolls at the end, never
// between): on → kind → location → facing. Every room owns one lamp — the
// on gene decides whether it lights at night, never whether it exists — so
// all four rolls always read. The catalogue is freely editable between
// versions; a seed's roll sequence stays a pure function of the seed.

export type LampKind =
  | 'floorLamp'
  | 'arcLamp'
  | 'tableLamp'
  | 'bedsideLamp'
  | 'pendant'
  | 'bulbPendant';

// Six home constructions from the prototype sheet's picked ten: two stand
// on the floor line, two on desks, two hang from the ceiling line.
export const LAMP_KINDS: readonly { value: LampKind; weight: number }[] = [
  { value: 'floorLamp', weight: 3 },
  { value: 'arcLamp', weight: 2 },
  { value: 'tableLamp', weight: 3 },
  { value: 'bedsideLamp', weight: 2 },
  { value: 'pendant', weight: 2 },
  { value: 'bulbPendant', weight: 2 },
];

export type Anchor = 'left' | 'centre' | 'right';
export type Facing = 'left' | 'right';

export const ANCHORS: readonly { value: Anchor; weight: number }[] = [
  { value: 'left', weight: 1 },
  { value: 'centre', weight: 1 },
  { value: 'right', weight: 1 },
];

export const FACINGS: readonly { value: Facing; weight: number }[] = [
  { value: 'left', weight: 1 },
  { value: 'right', weight: 1 },
];

// Where in the opening the lamp stands, as a share of the opening's width —
// kept off the frame's edges.
export const ANCHOR_X: Record<Anchor, number> = { left: 0.28, centre: 0.5, right: 0.72 };

// The desked lamps stand on furniture drawn under them: the desk top's
// height above the floor line, as a share of the opening's height. The
// table lamp is the bigger lamp on a lower desk; the bedside lamp the
// smaller one on a taller nightstand.
export const DESK_TOP: Record<'tableLamp' | 'bedsideLamp', number> = {
  tableLamp: 0.3,
  bedsideLamp: 0.4,
};

// The interior sits deeper than the curtain (the room behind the cloth) and
// sorts under it, so the veil and the aura lay over the interior and the
// cloth reads them through its own wash.
export const LIGHT_DEPTH = -0.12;
export const LIGHT_Z = -7;
