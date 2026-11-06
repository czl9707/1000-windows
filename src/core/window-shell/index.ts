// The window shell's entry: a ShellPlan becomes the marks of one bare
// window — backing, frame, the archetype's sashes, sill, add-ons. The
// module's public surface rides here; consumers reach the shell only
// through this file.
import type { Mark } from '@/core/scene';
import type { Pt3 } from '@/motion/projection';
import { ARCHETYPES, type ShellPlan } from './archetypes';
import { BOX, SHELL_Z, innerRect, line, rectPts } from './shell';
import { drawSliding } from './drawSliding';
import { drawCasement } from './drawCasement';
import { drawPicture } from './drawPicture';
import { drawSill } from './drawSill';
import { drawAwning } from './drawAwning';
import { drawShutters } from './drawShutters';
import { drawWindowBox } from './drawWindowBox';

export { expandShell, innerRect, line, rectPts, BOX, SHELL_Z, type PaneRect } from './shell';
export type { ShellPlan, SlidingPlan, CasementPlan, PicturePlan } from './archetypes';

// Four separate strokes running past the sharp corners, like the reference's
// sheet edges — a rectangle that closes exactly reads as drawn by a program.
// The rectangle lies on the wall (point depth 0); `zKey` is the mark's sort
// bucket only — a SHELL_Z value must never reach the points, or the
// projection reads it as true depth.
const RUN_PAST = 0.035;

function rectStrokes(x0: number, y0: number, x1: number, y1: number, trace: string, width: number, zKey: number): Mark[] {
  const runPast = RUN_PAST * Math.min(x1 - x0, y1 - y0);
  const edges: [Pt3[], string][] = [
    [line(x0 - runPast, y0, x1 + runPast, y0), `${trace}-top`],
    [line(x1, y0 - runPast, x1, y1 + runPast), `${trace}-right`],
    [line(x1 + runPast, y1, x0 - runPast, y1), `${trace}-bottom`],
    [line(x0, y1 + runPast, x0, y0 - runPast), `${trace}-left`],
  ];
  return edges.map(([pts, name]) => ({ kind: 'stroke', pts, name, widthUnits: width, role: 'ink', z: zKey }));
}

function frameMarks(plan: ShellPlan): Mark[] {
  const t = ARCHETYPES[plan.archetype].frameThicknessUnits * plan.thicknessJitter;
  const r = innerRect(plan.faceWidth);
  // The frame's face in four flat strips: head and sill run the box's full
  // width, the jambs fill between them — no fill-rule subtlety, the opening
  // stays a hole for the glass and its washes.
  const strip = (x0: number, y0: number, x1: number, y1: number): Mark => ({
    kind: 'fill',
    pts: rectPts(x0, y0, x1, y1),
    role: 'mullion',
    z: SHELL_Z.frame,
  });
  return [
    strip(-BOX.halfW, -BOX.halfH, BOX.halfW, r.top),
    strip(-BOX.halfW, r.bottom, BOX.halfW, BOX.halfH),
    strip(-BOX.halfW, r.top, r.left, r.bottom),
    strip(r.right, r.top, BOX.halfW, r.bottom),
    ...rectStrokes(-BOX.halfW, -BOX.halfH, BOX.halfW, BOX.halfH, 'frame-outer', t, SHELL_Z.frame),
    ...rectStrokes(r.left, r.top, r.right, r.bottom, 'frame-inner', t, SHELL_Z.frame),
  ];
}

// The paper backing: the whole box fills in the paper colour beneath its
// lines, so the window reads as a texture-free plane against the textured
// wall — the glass wash, the frame, and every opening sit on it.
function backingMarks(): Mark[] {
  return [{ kind: 'fill', pts: rectPts(-BOX.halfW, -BOX.halfH, BOX.halfW, BOX.halfH), role: 'paper', z: SHELL_Z.backing }];
}

// The shell-only assembly the docs-page catalogue demos reuse to pin
// variants by hand: frame, panes, sill, add-ons — no tenant.
export function windowMarks(plan: ShellPlan): Mark[] {
  // The switch narrows the plan to its union member, so each drawer sees only
  // the fields its archetype carries.
  const archetypeMarks = (() => {
    switch (plan.archetype) {
      case 'sliding':
        return drawSliding(plan);
      case 'casement':
        return drawCasement(plan);
      case 'picture':
        return drawPicture(plan);
    }
  })();
  return [
    ...backingMarks(),
    ...frameMarks(plan),
    ...archetypeMarks,
    ...drawSill(plan),
    ...drawAwning(plan),
    ...drawShutters(plan),
    ...drawWindowBox(plan),
  ];
}
