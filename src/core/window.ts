// The per-window entry: seed → marks → pen. The shell draws from its own
// stream; the tenant layers read one live DNA stream in append order —
// appending a layer never shifts an earlier layer's rolls. The assembled
// scene draws through the scene's execute.
import type { Pen } from '@/pen/pen';
import type { Palette } from '@/styling/roles';
import { execute, type Mark } from './scene';
import { fork } from './randomness/rng';
import { curtainMarks } from './curtain';
import { sillMarks } from './sill';
import { lightMarks } from './light';
import { shellMarks, expandShell, type ShellPlan } from './window-shell';
import { innerRect } from './window-shell/shell';
import { makeProjection, type Eye } from '@/motion/projection';

// One seed drives both the shell plan and the tremor — the pen is its only
// home. The tenant hangs behind the glass: the curtain rolls on the DNA
// stream, its marks sorting under the pane wash, and a bare tenant adds
// nothing. The light block rolls last — appending after the sill never
// re-randomizes an earlier layer — and draws deepest, so the veil and the
// aura lay over the interior while the cloth reads them through its own
// wash. The seed and the plan are one window's — the plan must come from
// expandShell(seed) (or a pinned variant of the same window), never another
// window's shell. `night` is the theme flip, read through nightOf.
export function windowSceneMarks(seed: number, plan: ShellPlan, night: boolean): Mark[] {
  const rng = fork(seed, 'dna');
  const opening = innerRect(plan.faceWidth);
  // The rolls consume the stream in append order; the draw order lays the
  // light block deepest of the three.
  const curtain = curtainMarks(rng, opening);
  const sill = sillMarks(rng, opening);
  const light = lightMarks(rng, opening, night);
  return [...shellMarks(plan), ...light, ...curtain, ...sill];
}

export function drawWindow(
  ctx: CanvasRenderingContext2D,
  pen: Pen,
  palette: Palette,
  eye: Eye,
  night: boolean,
): void {
  execute(
    windowSceneMarks(pen.seed, expandShell(pen.seed), night),
    pen,
    ctx,
    palette,
    makeProjection(eye),
  );
}
