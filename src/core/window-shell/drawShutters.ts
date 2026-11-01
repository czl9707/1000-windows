// The shutters: two panels hung at the opening's outer edges, swung half
// open toward the viewer — out from the wall, covering no part of the glass.
// Each panel is half the opening's width for real (shut, the pair would meet
// over the glass); drawn flat on the wall it narrows by the swing's cosine,
// the same verdict as the open casement leaf. The panel fills opaque: swung
// out, it hides the wall behind it.
import type { ShellPlan } from './archetypes';
import type { Mark } from '../scene/mark';
import { SHELL_Z, innerRect } from './shell';

// Half-open, as the panel's angle off the wall plane. Fixed, never rolled:
// the angle is what the drawing says, not a fact about the window.
const SWING = 1.05;
const SLATS = 6;
const INSET = 0.045;

function panelMarks(
  side: 'l' | 'r',
  hingeX: number,
  outerX: number,
  top: number,
  bottom: number,
): Mark[] {
  const z = SHELL_Z.addon;
  const w = 0.026;
  const x0 = Math.min(hingeX, outerX);
  const x1 = Math.max(hingeX, outerX);
  return [
    {
      kind: 'fill',
      pts: [
        { x: x0, y: top, z: 0 },
        { x: x1, y: top, z: 0 },
        { x: x1, y: bottom, z: 0 },
        { x: x0, y: bottom, z: 0 },
      ],
      role: 'paper',
      z,
    },
    { kind: 'stroke', pts: [{ x: x0, y: top, z: 0 }, { x: x1, y: top, z: 0 }], name: `shutter-${side}-top`, width: w, role: 'ink', z },
    { kind: 'stroke', pts: [{ x: x0, y: bottom, z: 0 }, { x: x1, y: bottom, z: 0 }], name: `shutter-${side}-bottom`, width: w, role: 'ink', z },
    { kind: 'stroke', pts: [{ x: outerX, y: top, z: 0 }, { x: outerX, y: bottom, z: 0 }], name: `shutter-${side}-outer`, width: w, role: 'ink', z },
    { kind: 'stroke', pts: [{ x: hingeX, y: top, z: 0 }, { x: hingeX, y: bottom, z: 0 }], name: `shutter-${side}-hinge`, width: w, role: 'ink', z },
  ];
}

// Both shutters as (side, hinge-x, outer-x) spans beside the opening.
function shutterSides(face: number): { side: 'l' | 'r'; hingeX: number; outerX: number }[] {
  const { left, right } = innerRect(face);
  // True panel width: half the opening, so shut panels would meet over the
  // glass. Swung, the wall span foreshortens by the cosine.
  const trueWidth = (right - left) / 2;
  const drawn = trueWidth * Math.cos(SWING);
  return [
    { side: 'l', hingeX: left, outerX: left - drawn },
    { side: 'r', hingeX: right, outerX: right + drawn },
  ];
}

function louvered(face: number): Mark[] {
  const { top, bottom } = innerRect(face);
  const marks: Mark[] = [];
  for (const { side, hingeX, outerX } of shutterSides(face)) {
    marks.push(...panelMarks(side, hingeX, outerX, top, bottom));
    const x0 = Math.min(hingeX, outerX);
    const x1 = Math.max(hingeX, outerX);
    for (let i = 1; i <= SLATS; i++) {
      const y = top + ((bottom - top) * i) / (SLATS + 1);
      marks.push({
        kind: 'stroke',
        pts: [{ x: x0 + 0.02, y, z: 0 }, { x: x1 - 0.02, y, z: 0 }],
        name: `shutter-${side}-slat-${i}`,
        width: 0.02,
        role: 'ink',
        z: SHELL_Z.addon,
      });
    }
  }
  return marks;
}

function paneled(face: number): Mark[] {
  const { top, bottom } = innerRect(face);
  const marks: Mark[] = [];
  for (const { side, hingeX, outerX } of shutterSides(face)) {
    marks.push(...panelMarks(side, hingeX, outerX, top, bottom));
    const x0 = Math.min(hingeX, outerX) + INSET;
    const x1 = Math.max(hingeX, outerX) - INSET;
    const py0 = top + INSET;
    const py1 = bottom - INSET;
    marks.push(
      { kind: 'stroke', pts: [{ x: x0, y: py0, z: 0 }, { x: x1, y: py0, z: 0 }], name: `shutter-${side}-panel-top`, width: 0.022, role: 'ink', z: SHELL_Z.addon },
      { kind: 'stroke', pts: [{ x: x0, y: py1, z: 0 }, { x: x1, y: py1, z: 0 }], name: `shutter-${side}-panel-bottom`, width: 0.022, role: 'ink', z: SHELL_Z.addon },
      { kind: 'stroke', pts: [{ x: x0, y: py0, z: 0 }, { x: x0, y: py1, z: 0 }], name: `shutter-${side}-panel-l`, width: 0.022, role: 'ink', z: SHELL_Z.addon },
      { kind: 'stroke', pts: [{ x: x1, y: py0, z: 0 }, { x: x1, y: py1, z: 0 }], name: `shutter-${side}-panel-r`, width: 0.022, role: 'ink', z: SHELL_Z.addon },
    );
  }
  return marks;
}

export function drawShutters(plan: ShellPlan): Mark[] {
  if (plan.shutters === 'none') return [];
  return plan.shutters === 'louvered' ? louvered(plan.faceWidth) : paneled(plan.faceWidth);
}
