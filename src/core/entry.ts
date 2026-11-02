// The per-window entry point: context, pen, palette — that is the whole
// signature. It expands the shell plan from the pen's seed, collects every
// drawer's marks, sorts them by depth, projects, and lets the pen draw.
import type { Pen } from '@/pen/pen';
import type { Palette } from '@/styling/roles';
import { execute } from './scene/execute';
import type { Mark } from './scene/mark';
import { ARCHETYPES, type ShellPlan } from './window-shell/archetypes';
import { drawAwning } from './window-shell/drawAwning';
import { drawCasement } from './window-shell/drawCasement';
import { drawPicture } from './window-shell/drawPicture';
import { drawSash } from './window-shell/drawSash';
import { drawShutters } from './window-shell/drawShutters';
import { drawSill } from './window-shell/drawSill';
import { drawWindowBox } from './window-shell/drawWindowBox';
import { BOX, SHELL_Z, expandShell, line } from './window-shell/shell';
import { CENTRE_EYE, FOCAL, type Eye, type Pt3 } from '@/motion/projection';

// One archetype drawer per frame construction, picked by the plan.
const ARCHETYPE_DRAWERS: Record<keyof typeof ARCHETYPES, (plan: ShellPlan) => Mark[]> = {
  sash: drawSash,
  casement: drawCasement,
  picture: drawPicture,
};

// Four separate strokes running past the sharp corners, like the reference's
// sheet edges — a rectangle that closes exactly reads as drawn by a program.
// The rectangle lies on the wall (point depth 0); `zKey` is the mark's sort
// bucket only — a SHELL_Z value must never reach the points, or the
// projection reads it as true depth.
function rectStrokes(x0: number, y0: number, x1: number, y1: number, trace: string, width: number, zKey: number): Mark[] {
  const runPast = 0.035 * Math.min(x1 - x0, y1 - y0);
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
  const face = plan.faceWidth;
  return [
    ...rectStrokes(-BOX.halfW, -BOX.halfH, BOX.halfW, BOX.halfH, 'frame-outer', t, SHELL_Z.frame),
    ...rectStrokes(
      -BOX.halfW + face,
      -BOX.halfH + face,
      BOX.halfW - face,
      BOX.halfH - face,
      'frame-inner',
      t * 0.85,
      SHELL_Z.frame,
    ),
  ];
}

// Every drawer's marks for one plan, in the shell's append-only draw order —
// the assembly the docs-page catalogue demos reuse to pin variants by hand.
export function windowMarks(plan: ShellPlan): Mark[] {
  return [
    ...frameMarks(plan),
    ...ARCHETYPE_DRAWERS[plan.archetype](plan),
    ...drawSill(plan),
    ...drawAwning(plan),
    ...drawShutters(plan),
    ...drawWindowBox(plan),
  ];
}

// The per-window entry point: context, pen, palette. The shell plan expands
// from the pen's seed — one seed drives both the plan and the tremor, and
// the pen is the fact's one home. Marks are collected, sorted by depth,
// projected, dressed, and handed to the pen. `eye` is the canvas's offset
// from the screen centre (see motion/projection); the default centres it.
export function drawWindow(
  ctx: CanvasRenderingContext2D,
  pen: Pen,
  palette: Palette,
  eye: Eye = CENTRE_EYE,
  focal: number = FOCAL,
): void {
  execute(windowMarks(expandShell(pen.seed)), pen, ctx, palette, eye, focal);
}
