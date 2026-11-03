import type { Pen } from '@/pen/pen';
import type { Palette } from '@/styling/roles';
import { execute } from './scene/execute';
import type { Mark } from './scene/mark';
import { ARCHETYPES, type ShellPlan } from './window-shell/archetypes';
import { drawAwning } from './window-shell/drawAwning';
import { drawCasement } from './window-shell/drawCasement';
import { drawPicture } from './window-shell/drawPicture';
import { drawSliding } from './window-shell/drawSliding';
import { drawShutters } from './window-shell/drawShutters';
import { drawSill } from './window-shell/drawSill';
import { drawWindowBox } from './window-shell/drawWindowBox';
import { BOX, SHELL_Z, expandShell, innerRect, line, rectPts } from './window-shell/shell';
import { makeProjection, type Eye, type Pt3 } from '@/motion/projection';

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
  return edges.map(([pts, name]) => ({ kind: 'stroke', pts, name, width, role: 'ink', z: zKey }));
}

function frameMarks(plan: ShellPlan): Mark[] {
  const t = ARCHETYPES[plan.archetype].frameThickness * plan.thicknessJitter;
  const r = innerRect(plan.faceWidth);
  return [
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

// The assembly the docs-page catalogue demos reuse to pin variants by hand.
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

// One seed drives both the shell plan and the tremor — the pen is its only home.
export function drawWindow(
  ctx: CanvasRenderingContext2D,
  pen: Pen,
  palette: Palette,
  eye: Eye,
): void {
  execute(windowMarks(expandShell(pen.seed)), pen, ctx, palette, makeProjection(eye));
}
