// The window box: a planter — or two in a row — hanging under the sill,
// mounted over it — its front face fills opaque and hides the sill lines
// behind it. A few tufts of green over each lip.
import type { ShellPlan } from './archetypes';
import type { Mark } from '@/core/scene';
import { WEIGHTS } from '@/styling/weights';
import { SHELL_Z, paneEdges, rectPts } from './shell';

// The box overlaps the sill: its top edge sits below the sill's top line and
// over its front face, so the sill reads as disappearing behind the planter.
const TOP_Y = 0.54;
const BOTTOM_Y = 0.8;
const FACE_Z = 0.12;
const HALF_W = 0.5;
const PAIR_HALF_W = 0.38;
const PAIR_CX = 0.4;

const TUFTS = 3;
const TUFT_STEP = 0.28;
const TUFT_LIFT = 0.03;
const TUFT_R = 0.032;

function boxMarks(cx: number, halfW: number, id: string): Mark[] {
  const z = SHELL_Z.box;
  const name = (part: string) => (id ? `box-${id}-${part}` : `box-${part}`);
  const x0 = cx - halfW;
  const x1 = cx + halfW;
  return [
    {
      kind: 'fill',
      pts: rectPts(x0, TOP_Y, x1, BOTTOM_Y, () => FACE_Z),
      role: 'box',
      z,
    },
    ...paneEdges({ top: TOP_Y, bottom: BOTTOM_Y, left: x0, right: x1 }, name('front'), z, WEIGHTS.structural, {
      depthAt: () => FACE_Z,
    }),
    { kind: 'stroke', pts: [{ x: x0, y: TOP_Y, z: 0 }, { x: x0, y: TOP_Y, z: FACE_Z }], name: name('side-l'), widthUnits: WEIGHTS.detail, role: 'ink', z },
    { kind: 'stroke', pts: [{ x: x1, y: TOP_Y, z: 0 }, { x: x1, y: TOP_Y, z: FACE_Z }], name: name('side-r'), widthUnits: WEIGHTS.detail, role: 'ink', z },
    ...tufts(cx, z, name),
  ];
}

function tufts(cx: number, z: number, name: (part: string) => string): Mark[] {
  const marks: Mark[] = [];
  for (let i = 0; i < TUFTS; i++) {
    marks.push({
      kind: 'dot',
      pts: [{ x: cx - TUFT_STEP + i * TUFT_STEP, y: TOP_Y - TUFT_LIFT, z: FACE_Z }],
      name: name(`tuft-${i}`),
      r: TUFT_R,
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
