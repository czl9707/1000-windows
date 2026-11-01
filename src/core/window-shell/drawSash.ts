// The sash: a horizontal meeting rail splits the glass into an upper and a
// lower sash. The lower sash slides — open and half-open lift it, leaving the
// opening below its bottom rail as bare paper, while its panes ride up over
// the upper sash's glass (the washes stack where they overlap).
import { ARCHETYPES, type ShellPlan } from './archetypes';
import type { Mark } from '../scene/mark';
import { SHELL_Z, gridRects, innerRect, line } from './shell';

// How far the lower sash lifts, as a fraction of the sash height, per open state.
const RAISE = { open: 0.55, 'half-open': 0.25, closed: 0 } as const;

export function drawSash(plan: ShellPlan): Mark[] {
  const { layout, open } = plan;
  const { top, bottom, left, right } = innerRect(plan.faceWidth);
  const t = ARCHETYPES.sash.frameThickness * plan.thicknessJitter;
  const barW = t * 0.7;
  const w = right - left;

  const sashHeight = (bottom - top) / 2;
  const raise = RAISE[open] * sashHeight;
  const railY = -raise;
  const sashBottom = bottom - raise;

  // Pane grid per sash: columns per layout, a second row only on 6-over-6.
  const cols = layout === '1-over-1' ? 1 : layout === '2-over-2' ? 2 : 3;
  const rows = layout === '6-over-6' ? 2 : 1;

  const marks: Mark[] = [];
  // The upper sash is fixed: its glass runs from the head down to the closed
  // rail position. The lower sash's panes ride up with it.
  for (const pts of gridRects(top, 0, left, right, cols, rows)) {
    marks.push({ kind: 'fill', pts, role: 'glass', z: SHELL_Z.glass });
  }
  for (const pts of gridRects(railY, sashBottom, left, right, cols, rows)) {
    marks.push({ kind: 'fill', pts, role: 'glass', z: SHELL_Z.glass });
  }

  marks.push({ kind: 'stroke', pts: line(left, railY, right, railY), name: 'rail', width: t * 0.85, role: 'ink', z: SHELL_Z.frame });
  // The upper sash's own bottom edge, revealed behind the lifted glass —
  // closed, both rails coincide and one line says it.
  if (raise > 0) {
    marks.push({ kind: 'stroke', pts: line(left, 0, right, 0), name: 'rail-top', width: t * 0.85, role: 'ink', z: SHELL_Z.frame });
  }
  marks.push({ kind: 'dot', pts: [{ x: right - 0.25, y: railY, z: 0 }], name: 'sash-handle', r: 0.02, role: 'ink', z: SHELL_Z.frame });
  if (raise > 0) {
    marks.push({
      kind: 'stroke',
      pts: line(left, sashBottom, right, sashBottom),
      name: 'sash-bottom',
      width: barW,
      role: 'ink',
      z: SHELL_Z.frame,
    });
  }

  if (layout === '2-over-2' || layout === '6-over-6') {
    const mullions = layout === '2-over-2' ? [0] : [left + w / 3, left + (2 * w) / 3];
    mullions.forEach((x, i) => {
      marks.push({ kind: 'stroke', pts: line(x, top, x, railY - barW / 2), name: `mullion-top-${i}`, width: barW, role: 'ink', z: SHELL_Z.frame });
      marks.push({ kind: 'stroke', pts: line(x, railY + barW / 2, x, sashBottom), name: `mullion-bottom-${i}`, width: barW, role: 'ink', z: SHELL_Z.frame });
    });
  }
  if (layout === '6-over-6') {
    marks.push({ kind: 'stroke', pts: line(left, (top + railY) / 2, right, (top + railY) / 2), name: 'bar-top-h', width: barW, role: 'ink', z: SHELL_Z.frame });
    marks.push({ kind: 'stroke', pts: line(left, (railY + sashBottom) / 2, right, (railY + sashBottom) / 2), name: 'bar-bottom-h', width: barW, role: 'ink', z: SHELL_Z.frame });
  }
  return marks;
}
