// The insider layer's room: 0–5 tall pieces standing on depth planes behind
// the glass, one piece per plane. The block rolls on the walk's DNA stream
// after the light block — appending here never re-randomizes an earlier
// layer, and plane 1 stays the lamp's.
import type { Rng } from '@/core/randomness/rng';
import {
  ANCHOR_RANGE,
  KINDS,
  NEAR_PLANE_COUNT,
  PLANE_OCCUPANCY,
  TV_NEAR_PLANE_BIAS,
  WIDTH_JITTER,
  type FurnitureKind,
} from './catalogue';

export interface BarePlane {
  present: false;
}

export interface FurnishedPlane {
  present: true;
  kind: FurnitureKind;
  // The anchor across the opening's width, a share in (0, 1).
  anchorX: number;
  widthJitter: number;
  // One spare roll every kind carries, read only by the kinds that need it —
  // the curtain's slatShare pattern (crate count, rack lean, …).
  variant: number;
}

export type FurnitureSlot = BarePlane | FurnishedPlane;

export interface FurniturePlan {
  // Planes 2–6, nearest first: index 0 is plane 2.
  planes: FurnitureSlot[];
}

// The kind table re-weighted for a plane: the TV's weight triples on the
// near planes. Hoisted per plane like the shell's archetype roll table —
// Object.map order is stable, so the roll sequence never shifts and the
// tables build once.
export const PLANE_KIND_ROLLS: readonly { value: FurnitureKind; weight: number }[][] =
  PLANE_OCCUPANCY.map((_, planeIndex) =>
    KINDS.map((kind) => ({
      value: kind.value,
      weight:
        kind.value === 'tvStand' && planeIndex < NEAR_PLANE_COUNT
          ? kind.weight * TV_NEAR_PLANE_BIAS
          : kind.weight,
    })),
  );

export function expandFurniture(rng: Rng): FurniturePlan {
  const planes: FurnitureSlot[] = [];
  for (let planeIndex = 0; planeIndex < PLANE_OCCUPANCY.length; planeIndex++) {
    const occupied = rng.weighted([
      { value: true, weight: PLANE_OCCUPANCY[planeIndex] },
      { value: false, weight: 1 - PLANE_OCCUPANCY[planeIndex] },
    ]);
    if (!occupied) {
      planes.push({ present: false });
      continue;
    }
    const kind = rng.weighted(PLANE_KIND_ROLLS[planeIndex]);
    const anchorX = rng.float(ANCHOR_RANGE.min, ANCHOR_RANGE.max);
    const widthJitter = rng.float(WIDTH_JITTER.min, WIDTH_JITTER.max);
    const variant = rng.float(0, 1);
    planes.push({ present: true, kind, anchorX, widthJitter, variant });
  }
  return { planes };
}
