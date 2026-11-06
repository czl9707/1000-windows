// The per-window entry: seed → marks → pen. The shell rolls from the seed's
// own stream, the tenant hangs behind the glass on the DNA stream, and the
// assembled scene draws through the scene's execute. Consumers reach the
// shell, the curtain, and the scene only through their module entries.
import type { Pen } from '@/pen/pen';
import type { Palette } from '@/styling/roles';
import { execute, type Mark } from './scene';
import { expandCurtain, curtainMarks } from './curtain';
import { windowMarks, expandShell, innerRect, type ShellPlan } from './window-shell';
import { makeProjection, type Eye } from '@/motion/projection';

// One seed drives both the shell plan and the tremor — the pen is its only
// home. The tenant hangs behind the glass: the curtain rolls on the DNA
// stream, its marks sorting under the pane wash, and a bare tenant adds
// nothing. The seed and the plan are one window's — the plan must come from
// expandShell(seed) (or a pinned variant of the same window), never another
// window's shell.
export function windowSceneMarks(seed: number, plan: ShellPlan): Mark[] {
  return [...windowMarks(plan), ...curtainMarks(expandCurtain(seed), innerRect(plan.faceWidth))];
}

export function drawWindow(
  ctx: CanvasRenderingContext2D,
  pen: Pen,
  palette: Palette,
  eye: Eye,
): void {
  execute(windowSceneMarks(pen.seed, expandShell(pen.seed)), pen, ctx, palette, makeProjection(eye));
}
