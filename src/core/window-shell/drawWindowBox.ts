// The window box: a planter — or two in a row — hanging under the sill,
// mounted over it — its front face fills opaque and hides the sill lines
// behind it. A few tufts of green over each lip.
import type { ShellPlan } from './archetypes';
import type { Mark } from '@/core/scene/mark';
import { SHELL_Z } from './shell';

// The box overlaps the sill: its top edge sits below the sill's top line and
// over its front face, so the sill reads as disappearing behind the planter.
const TOP_Y = 0.54;
const BOTTOM_Y = 0.8;
const FACE_Z = 0.12;
const HALF_W = 0.5;
// Two in a row: narrower planters side by side, a hand's gap between them.
const PAIR_HALF_W = 0.38;
const PAIR_CX = 0.4;

function boxMarks(cx: number, halfW: number, id: string): Mark[] {
  const z = SHELL_Z.addon;
  const w = 0.026;
  const name = (part: string) => (id ? `box-${id}-${part}` : `box-${part}`);
  const x0 = cx - halfW;
  const x1 = cx + halfW;
  const marks: Mark[] = [
    {
      kind: 'fill',
      pts: [
        { x: x0, y: TOP_Y, z: FACE_Z },
        { x: x1, y: TOP_Y, z: FACE_Z },
        { x: x1, y: BOTTOM_Y, z: FACE_Z },
        { x: x0, y: BOTTOM_Y, z: FACE_Z },
      ],
      role: 'paper',
      z,
    },
    { kind: 'stroke', pts: [{ x: x0, y: TOP_Y, z: FACE_Z }, { x: x1, y: TOP_Y, z: FACE_Z }], name: name('front-top'), width: w, role: 'ink', z },
    { kind: 'stroke', pts: [{ x: x0, y: BOTTOM_Y, z: FACE_Z }, { x: x1, y: BOTTOM_Y, z: FACE_Z }], name: name('front-bottom'), width: w, role: 'ink', z },
    { kind: 'stroke', pts: [{ x: x0, y: TOP_Y, z: FACE_Z }, { x: x0, y: BOTTOM_Y, z: FACE_Z }], name: name('front-l'), width: w, role: 'ink', z },
    { kind: 'stroke', pts: [{ x: x1, y: TOP_Y, z: FACE_Z }, { x: x1, y: BOTTOM_Y, z: FACE_Z }], name: name('front-r'), width: w, role: 'ink', z },
    { kind: 'stroke', pts: [{ x: x0, y: TOP_Y, z: 0 }, { x: x0, y: TOP_Y, z: FACE_Z }], name: name('side-l'), width: w * 0.85, role: 'ink', z },
    { kind: 'stroke', pts: [{ x: x1, y: TOP_Y, z: 0 }, { x: x1, y: TOP_Y, z: FACE_Z }], name: name('side-r'), width: w * 0.85, role: 'ink', z },
  ];
  for (let i = 0; i < 3; i++) {
    marks.push({
      kind: 'dot',
      pts: [{ x: cx - 0.28 + i * 0.28, y: TOP_Y - 0.03, z: FACE_Z }],
      name: name(`tuft-${i}`),
      r: 0.032,
      role: 'ink',
      z,
    });
  }
  return marks;
}

export function drawWindowBox(plan: ShellPlan): Mark[] {
  if (plan.box === 'none') return [];
  if (plan.box === 'pair') {
    return [...boxMarks(-PAIR_CX, PAIR_HALF_W, 'l'), ...boxMarks(PAIR_CX, PAIR_HALF_W, 'r')];
  }
  return boxMarks(0, HALF_W, '');
}
