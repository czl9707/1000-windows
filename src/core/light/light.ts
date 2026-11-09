// The tenant's last layer for now: the apartment's lamp. Every room owns
// one — the on gene decides whether it lights at night, never whether it
// exists — standing on the floor line or hanging from the ceiling line,
// rolled off the walk's DNA stream after the sill block.
import type { Rng } from '@/core/randomness/rng';
import { ANCHORS, FACINGS, LAMP_KINDS, type Anchor, type Facing, type LampKind } from './catalogue';

export interface LampPlan {
  on: boolean;
  kind: LampKind;
  location: Anchor;
  facing: Facing;
}

// The light rolls on the caller's DNA stream: the tenant walk hands the live
// generator, so the layers appended after this one keep their draw order.
export function expandLight(rng: Rng): LampPlan {
  const on = rng.weighted([
    { value: false, weight: 2 },
    { value: true, weight: 1 },
  ]);
  const kind = rng.weighted(LAMP_KINDS);
  const location = rng.weighted(ANCHORS);
  const facing = rng.weighted(FACINGS);
  return { on, kind, location, facing };
}
