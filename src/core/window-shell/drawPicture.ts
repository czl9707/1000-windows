// The picture window: fixed glass, no lattice. The wash says glass; the
// absence of divisions says picture.
import type { ShellPlan } from './archetypes';
import type { Mark } from '../scene/mark';
import { SHELL_Z, innerRect, rectPts } from './shell';

export function drawPicture(plan: ShellPlan): Mark[] {
  const { top, bottom, left, right } = innerRect(plan.faceWidth);
  return [
    {
      kind: 'fill',
      pts: rectPts(left, top, right, bottom),
      role: 'glass',
      z: SHELL_Z.glass,
    },
  ];
}
