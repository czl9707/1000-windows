// The awning: a roof over the head, mounted on the wall and reaching out.
// The slope is a rigid plane — wall edge at the wall, front edge lower and at
// depth; the canopy is fabric, a shallow arc with a scalloped valance hanging
// from its front edge. Either kind fills opaque: the fabric hides the wall,
// the frame top, and every layer behind it.
import type { ShellPlan } from './archetypes';
import type { Mark } from '../scene/mark';
import type { Pt3 } from '../../motion/projection';
import { SHELL_Z } from './shell';

// Mount height (above the box top) and reach, in unit measure. The fabric
// runs wider than the window box so it reads as a roof, not a trim.
const ATTACH_Y = -0.62;
const HALF_W = 1.0;
const DROP = 0.17;
const SLOPE_REACH = 0.35;
const CANOPY_REACH = 0.25;

function drawSlope(): Mark[] {
  const marks: Mark[] = [
    {
      kind: 'fill',
      pts: [
        { x: -HALF_W, y: ATTACH_Y, z: 0 },
        { x: HALF_W, y: ATTACH_Y, z: 0 },
        { x: HALF_W, y: ATTACH_Y + DROP, z: SLOPE_REACH },
        { x: -HALF_W, y: ATTACH_Y + DROP, z: SLOPE_REACH },
      ],
      role: 'paper',
      z: SHELL_Z.addon,
    },
    {
      kind: 'stroke',
      pts: [{ x: -HALF_W, y: ATTACH_Y, z: 0 }, { x: HALF_W, y: ATTACH_Y, z: 0 }],
      name: 'awning-attach',
      width: 0.032,
      role: 'ink',
      z: SHELL_Z.addon,
    },
    {
      kind: 'stroke',
      pts: [
        { x: -HALF_W, y: ATTACH_Y + DROP, z: SLOPE_REACH },
        { x: HALF_W, y: ATTACH_Y + DROP, z: SLOPE_REACH },
      ],
      name: 'awning-front',
      width: 0.03,
      role: 'ink',
      z: SHELL_Z.addon,
    },
  ];
  for (let i = 0; i <= 4; i++) {
    const x = -HALF_W + (i * 2 * HALF_W) / 4;
    marks.push({
      kind: 'stroke',
      pts: [
        { x, y: ATTACH_Y, z: 0 },
        { x, y: ATTACH_Y + DROP, z: SLOPE_REACH },
      ],
      name: `awning-rib-${i}`,
      width: 0.026,
      role: 'ink',
      z: SHELL_Z.addon,
    });
  }
  return marks;
}

function drawCanopy(): Mark[] {
  const halfW = HALF_W - 0.05;
  const marks: Mark[] = [
    {
      // The fabric fills from the attach line down to the valance height;
      // the hem's lobes ride on top of the fill.
      kind: 'fill',
      pts: [
        { x: -halfW, y: ATTACH_Y, z: 0 },
        { x: halfW, y: ATTACH_Y, z: 0 },
        { x: halfW, y: ATTACH_Y + DROP + 0.02, z: CANOPY_REACH },
        { x: -halfW, y: ATTACH_Y + DROP + 0.02, z: CANOPY_REACH },
      ],
      role: 'paper',
      z: SHELL_Z.addon,
    },
    {
      kind: 'stroke',
      pts: [{ x: -halfW, y: ATTACH_Y, z: 0 }, { x: halfW, y: ATTACH_Y, z: 0 }],
      name: 'canopy-attach',
      width: 0.03,
      role: 'ink',
      z: SHELL_Z.addon,
    },
  ];
  // Side arcs: quarter curves from the wall attach down to the valance ends.
  const arc = (x: number): Pt3[] =>
    Array.from({ length: 7 }, (_, i) => {
      const t = i / 6;
      return { x, y: ATTACH_Y + DROP * t, z: CANOPY_REACH * Math.sin((t * Math.PI) / 2) };
    });
  marks.push({ kind: 'stroke', pts: arc(-halfW), name: 'canopy-side-l', width: 0.026, role: 'ink', z: SHELL_Z.addon });
  marks.push({ kind: 'stroke', pts: arc(halfW), name: 'canopy-side-r', width: 0.026, role: 'ink', z: SHELL_Z.addon });
  // The valance: a scalloped hem hanging from the front edge.
  const valance: Pt3[] = [];
  const lobes = 5;
  for (let i = 0; i <= lobes * 4; i++) {
    const t = i / (lobes * 4);
    valance.push({
      x: -halfW + t * 2 * halfW,
      y: ATTACH_Y + DROP + 0.02 + Math.sin(((i % 4) / 4) * Math.PI) * 0.03,
      z: CANOPY_REACH,
    });
  }
  marks.push({ kind: 'stroke', pts: valance, name: 'canopy-valance', width: 0.026, role: 'ink', z: SHELL_Z.addon });
  return marks;
}

export function drawAwning(plan: ShellPlan): Mark[] {
  if (plan.awning === 'none') return [];
  return plan.awning === 'slope' ? drawSlope() : drawCanopy();
}
