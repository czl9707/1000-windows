// The light's entry — one base shape per layer module: expandLight rolls the
// layer's plan, lightMarks draws it off the live DNA stream, LightPlan is
// the plan the roll returns. Anything else (catalogue constants, the lamp
// drawer) lives on the child modules; import it there directly.
import type { Mark } from '@/core/scene';
import type { Rng } from '@/core/randomness/rng';
import type { PaneRect } from '@/core/window-shell/shell';
import { expandLight } from './light';
import { lightMarks as drawLight } from './drawLight';
import type { LightPlan } from './light';

export { expandLight } from './light';
export type { LightPlan } from './light';

export function lightMarks(rng: Rng, opening: PaneRect, night: boolean): Mark[] {
  return drawLight(expandLight(rng), opening, night);
}
