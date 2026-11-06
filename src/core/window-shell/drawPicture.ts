// The picture window: fixed glass, no lattice, never open. The wash says
// glass; the absence of divisions says picture.
import { ARCHETYPES, type PicturePlan } from './archetypes';
import type { Mark } from '@/core/scene';
import { innerRect, paneMarks } from './shell';

export function drawPicture(plan: PicturePlan): Mark[] {
  const rect = innerRect(plan.faceWidth);
  const t = ARCHETYPES.picture.frameThicknessUnits * plan.thicknessJitter;
  return paneMarks(rect, 'picture', t);
}
