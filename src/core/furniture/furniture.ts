// The insider layer's standing pieces: what the room behind the glass holds
// besides its lamp. A room owns zero to two pieces, plain pieces with no
// dominant one among them — the lamp counts toward that cap whenever the
// room owns one, even in daylight where it draws nothing, so a theme flip
// never re-randomizes the roll.
import type { Rng } from '@/core/randomness/rng';
import {
  FURNITURE_KINDS,
  FURNITURE_PLANES,
  type DepthPlane,
  type FurnitureKind,
} from './catalogue';

export interface FurniturePiece {
  kind: FurnitureKind;
  plane: DepthPlane;
  side: 'left' | 'right';
}

export interface FurniturePlan {
  pieces: FurniturePiece[];
}

// The cap's two sides: a lamp room rolls zero or one piece, a lampless room
// zero, one, or two. Weights are street constants, tuned at build.
const COUNT_WITH_LAMP = [
  { value: 0, weight: 3 },
  { value: 1, weight: 2 },
];
const COUNT_WITHOUT_LAMP = [
  { value: 0, weight: 5 },
  { value: 1, weight: 4 },
  { value: 2, weight: 2 },
];

// The second piece hugs the opposite edge most of the time — a soft bias,
// same-edge rooms stay possible.
const OPPOSITE_BIAS = 2;

// The furniture rolls on the caller's DNA stream, appended after the light
// block: the tenant walk hands the live generator, so layers appended after
// this one keep their draw order.
export function expandFurniture(rng: Rng, lampOwned: boolean): FurniturePlan {
  const count = rng.weighted(lampOwned ? COUNT_WITH_LAMP : COUNT_WITHOUT_LAMP);
  const kinds = FURNITURE_KINDS.map((k) => ({ ...k }));
  const planes = FURNITURE_PLANES.map((p) => ({ value: p, weight: 1 }));
  const pieces: FurniturePiece[] = [];
  for (let n = 0; n < count; n++) {
    const kind: FurnitureKind = rng.weighted(kinds);
    kinds.splice(kinds.findIndex((k) => k.value === kind), 1);
    const plane: DepthPlane = rng.weighted(planes);
    planes.splice(planes.findIndex((p) => p.value === plane), 1);
    const sides: { value: 'left' | 'right'; weight: number }[] =
      n === 0
        ? [
            { value: 'left', weight: 1 },
            { value: 'right', weight: 1 },
          ]
        : [
            { value: pieces[0]!.side === 'left' ? 'right' : 'left', weight: OPPOSITE_BIAS },
            { value: pieces[0]!.side, weight: 1 },
          ];
    pieces.push({ kind, plane, side: rng.weighted(sides) });
  }
  return { pieces };
}
