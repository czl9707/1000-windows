// The sill: what the window sits on. Flat is the plain ledge; bracketed runs
// deeper on two corbels; flush is no sill at all — the frame meets the wall.
import type { ShellPlan } from './archetypes';
import type { Mark } from '@/core/scene/mark';
import { WEIGHTS } from '@/styling/weights';
import { BOX, SHELL_Z, line } from './shell';

// Ledge geometry in unit measure: the top edge spreads this far past the box
// sides, the front edge pulls this far in from the top edge, and each kind
// hangs this deep below the box.
const SPREAD = 0.15;
const FRONT_INSET = 0.08;
const DEPTH = { flat: 0.12, bracketed: 0.17 } as const;

// The two dots flanking the ledge, and the corbels under the bracketed kind.
const DOT_OUTSET = 0.05;
const DOT_DROP = 0.08;
const DOT_R = 0.028;
const BRACKET_FOOT = 0.45;
const BRACKET_TOE = 0.52;
const BRACKET_RISE = 0.08;

const TOP_W = WEIGHTS.outline;
const FRONT_W = WEIGHTS.major;
const SIDE_W = WEIGHTS.minor;

export function drawSill(plan: ShellPlan): Mark[] {
  if (plan.sill === 'flush') return [];

  const { halfW } = BOX;
  const y0 = BOX.halfH;
  const z = SHELL_Z.sill;
  const marks: Mark[] = [];
  const front = y0 + DEPTH[plan.sill];
  const topX = halfW + SPREAD;
  const frontX = topX - FRONT_INSET;

  // The ledge's face fills paper first, so the wall texture never shows
  // between its lines.
  marks.push({
    kind: 'fill',
    pts: [
      { x: -topX, y: y0, z: 0 },
      { x: topX, y: y0, z: 0 },
      { x: frontX, y: front, z: 0 },
      { x: -frontX, y: front, z: 0 },
    ],
    role: 'paper',
    z,
  });
  marks.push({ kind: 'stroke', pts: line(-topX, y0, topX, y0), name: 'sill-top', width: TOP_W, role: 'ink', z });
  marks.push({ kind: 'stroke', pts: line(-frontX, front, frontX, front), name: 'sill-front', width: FRONT_W, role: 'ink', z });
  marks.push({ kind: 'stroke', pts: line(-topX, y0, -frontX, front), name: 'sill-left', width: SIDE_W, role: 'ink', z });
  marks.push({ kind: 'stroke', pts: line(topX, y0, frontX, front), name: 'sill-right', width: SIDE_W, role: 'ink', z });
  marks.push({ kind: 'dot', pts: [{ x: -halfW - DOT_OUTSET, y: front + DOT_DROP, z: 0 }], name: 'sill-dot-l', r: DOT_R, role: 'ink', z });
  marks.push({ kind: 'dot', pts: [{ x: halfW + DOT_OUTSET, y: front + DOT_DROP, z: 0 }], name: 'sill-dot-r', r: DOT_R, role: 'ink', z });

  if (plan.sill === 'bracketed') {
    marks.push({ kind: 'stroke', pts: line(-BRACKET_FOOT, front, -BRACKET_TOE, front + BRACKET_RISE), name: 'sill-bracket-l', width: SIDE_W, role: 'ink', z });
    marks.push({ kind: 'stroke', pts: line(BRACKET_FOOT, front, BRACKET_TOE, front + BRACKET_RISE), name: 'sill-bracket-r', width: SIDE_W, role: 'ink', z });
  }
  return marks;
}
