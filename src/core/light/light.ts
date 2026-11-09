// The room's light: the last tenant layer for now, after the sill block on
// the walk's DNA stream. The lamp is the one source — furniture drawn in
// both themes, lit only at night. The stream never ends early: an off
// window still rolls every field and reads none of them.
import type { Rng } from '@/core/randomness/rng';
import { FACING_SIDES, KINDS, LIGHTS, SEAT_RANGE, type Facing, type LampKind } from './catalogue';

export interface LightPlan {
  on: boolean;
  kind: LampKind;
  // The seat slot: a fraction across the opening; the drawer hangs or
  // stands the lamp by the kind's seat, never by this roll.
  seatX: number;
  facing: Facing;
}

export function expandLight(rng: Rng): LightPlan {
  const on = rng.weighted(LIGHTS) === 'on';
  const kind = rng.weighted(KINDS);
  const seatX = rng.float(SEAT_RANGE.min, SEAT_RANGE.max);
  const facing = rng.weighted(FACING_SIDES);
  return { on, kind, seatX, facing };
}
