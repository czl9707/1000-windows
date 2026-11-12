// The tenant's last layer for now: the apartment's lamp. Two rooms in three
// own one; a lamp room lights on even odds — the street mixes lampless
// rooms, dark ones, and lit ones. The lamp rolls off the walk's DNA stream
// after the sill block, standing on its furniture's own line or hanging
// from the ceiling line.
import type { Rng } from '@/core/randomness/rng';
import { ANCHORS, FACINGS, LAMP_KINDS, type Anchor, type Facing, type LampKind } from './catalogue';

export interface BareLamp {
  present: false;
}

export interface OwnedLamp {
  present: true;
  on: boolean;
  kind: LampKind;
  location: Anchor;
  facing: Facing;
}

export type LampPlan = BareLamp | OwnedLamp;

// The light rolls on the caller's DNA stream: the tenant walk hands the live
// generator, so the layers appended after this one keep their draw order.
// A lampless room ends the block, the way a bare window ends the curtain's.
export function expandLight(rng: Rng): LampPlan {
  const present = rng.weighted([
    { value: true, weight: 2 },
    { value: false, weight: 1 },
  ]);
  if (!present) return { present: false };
  const on = rng.weighted([
    { value: false, weight: 1 },
    { value: true, weight: 1 },
  ]);
  const kind = rng.weighted(LAMP_KINDS);
  const location = rng.weighted(ANCHORS);
  const facing = rng.weighted(FACINGS);
  return { present: true, on, kind, location, facing };
}

// A hand-pinned plan for the demo plates: the drawers are pure, so a plate
// hands its plan directly.
export function pinnedLamp(overrides: Partial<OwnedLamp> = {}): LampPlan {
  return {
    present: true,
    on: true,
    kind: 'floorLamp',
    location: 'innerLeft',
    facing: 'right',
    ...overrides,
  };
}
