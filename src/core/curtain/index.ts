// The curtain's entry: a CurtainPlan becomes the marks of the cloth hung
// behind the glass. The module's public surface rides here; consumers reach
// the curtain only through this file.
import type { Mark } from '@/core/scene';
import type { PaneRect } from '@/core/window-shell';
import { DRAWERS } from './drawCurtain';
import type { CurtainPlan } from './curtain';

export { expandCurtain, pinnedCurtain } from './curtain';
export type { CurtainPlan, CoveredCurtain, BareCurtain } from './curtain';

export function curtainMarks(plan: CurtainPlan, opening: PaneRect): Mark[] {
  if (!plan.present) return [];
  return DRAWERS[plan.kind](plan, opening);
}
