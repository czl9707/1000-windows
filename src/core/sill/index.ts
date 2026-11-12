// The sill's entry — one base shape per layer module: expandSill rolls the
// layer's plan, sillMarks draws it off the live DNA stream, SillPlan is the
// plan the roll returns. Anything else (catalogue constants, the item
// drawer) lives on the child modules; import it there directly.
import type { Mark } from '@/core/scene';
import type { Rng } from '@/core/randomness/rng';
import type { PaneRect } from '@/core/window-shell/shell';
import { expandSill } from './sill';
import { itemMarks } from './drawSillItems';
import type { SillPlan } from './sill';

export { expandSill } from './sill';
export type { SillPlan } from './sill';

export function sillMarks(rng: Rng, opening: PaneRect): Mark[] {
  return itemMarks(expandSill(rng), opening);
}
