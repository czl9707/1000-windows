// The curtain's entry — one base shape per layer module: expandCurtain
// rolls the layer's plan, curtainMarks draws it off the live DNA stream,
// CurtainPlan is the plan the roll returns. Anything else (pinned plates,
// catalogue constants, the cloth drawer) lives on the child modules;
// import it there directly.
import type { Mark } from '@/core/scene';
import type { Rng } from '@/core/randomness/rng';
import type { PaneRect } from '@/core/window-shell/shell';
import { expandCurtain } from './curtain';
import { clothMarks } from './drawCurtain';
import type { CurtainPlan } from './curtain';

export { expandCurtain } from './curtain';
export type { CurtainPlan } from './curtain';

export function curtainMarks(rng: Rng, opening: PaneRect): Mark[] {
  return clothMarks(expandCurtain(rng), opening);
}
