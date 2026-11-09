// The per-window entry: seed → marks → pen. The shell draws from its own
// stream; the tenant layers read one live DNA stream in append order —
// appending a layer never shifts an earlier layer's rolls. The assembled
// scene draws through the scene's execute.
import type { Pen } from '@/pen/pen';
import { nightOf } from '@/styling/colourway';
import type { Palette } from '@/styling/roles';
import { execute, type Mark } from './scene';
import { fork } from './randomness/rng';
import { curtainMarks } from './curtain';
import { lightMarks } from './light';
import { sillMarks } from './sill';
import { shellMarks, expandShell, type ShellPlan } from './window-shell';
import { innerRect } from './window-shell/shell';
import { makeProjection, type Eye } from '@/motion/projection';

// One seed drives both the shell plan and the tremor — the pen is its only
// home. The tenant hangs behind the glass: the curtain rolls on the DNA
// stream, its marks sorting under the pane wash, and a bare tenant adds
// nothing. The seed and the plan are one window's — the plan must come from
// expandShell(seed) (or a pinned variant of the same window), never another
// window's shell. The night flag is the light block's one authority: it
// flips the lamp's state, never the tenant's rolls.
export function windowSceneMarks(seed: number, plan: ShellPlan, night: boolean): Mark[] {
  const rng = fork(seed, 'dna');
  const opening = innerRect(plan.faceWidth);
  return [
    ...shellMarks(plan),
    ...curtainMarks(rng, opening),
    ...sillMarks(rng, opening),
    ...lightMarks(rng, opening, night),
  ];
}

export function drawWindow(
  ctx: CanvasRenderingContext2D,
  pen: Pen,
  palette: Palette,
  eye: Eye,
): void {
  const night = nightOf(palette('paper').color);
  execute(windowSceneMarks(pen.seed, expandShell(pen.seed), night), pen, ctx, palette, makeProjection(eye));
}
