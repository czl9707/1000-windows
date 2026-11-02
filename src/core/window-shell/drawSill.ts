// The sill: what the window sits on. Flat is the plain ledge; bracketed runs
// deeper on two corbels; flush is no sill at all — the frame meets the wall.
import type { ShellPlan } from './archetypes';
import type { Mark } from '@/core/scene/mark';
import { BOX, SHELL_Z, line } from './shell';

export function drawSill(plan: ShellPlan): Mark[] {
  if (plan.sill === 'flush') return [];

  const { halfW } = BOX;
  const y0 = BOX.halfH;
  const z = SHELL_Z.sill;
  const marks: Mark[] = [];
  const front = plan.sill === 'bracketed' ? y0 + 0.17 : y0 + 0.12;

  marks.push({ kind: 'stroke', pts: line(-halfW - 0.15, y0, halfW + 0.15, y0), name: 'sill-top', width: 0.036, role: 'ink', z });
  marks.push({ kind: 'stroke', pts: line(-halfW - 0.07, front, halfW + 0.07, front), name: 'sill-front', width: 0.03, role: 'ink', z });
  marks.push({ kind: 'stroke', pts: line(-halfW - 0.15, y0, -halfW - 0.07, front), name: 'sill-left', width: 0.026, role: 'ink', z });
  marks.push({ kind: 'stroke', pts: line(halfW + 0.15, y0, halfW + 0.07, front), name: 'sill-right', width: 0.026, role: 'ink', z });
  marks.push({ kind: 'dot', pts: [{ x: -halfW - 0.05, y: front + 0.08, z: 0 }], name: 'sill-dot-l', r: 0.028, role: 'ink', z });
  marks.push({ kind: 'dot', pts: [{ x: halfW + 0.05, y: front + 0.08, z: 0 }], name: 'sill-dot-r', r: 0.028, role: 'ink', z });

  if (plan.sill === 'bracketed') {
    marks.push({ kind: 'stroke', pts: line(-0.45, front, -0.52, front + 0.08), name: 'sill-bracket-l', width: 0.026, role: 'ink', z });
    marks.push({ kind: 'stroke', pts: line(0.45, front, 0.52, front + 0.08), name: 'sill-bracket-r', width: 0.026, role: 'ink', z });
  }
  return marks;
}
