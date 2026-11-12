// The per-window entry: seed → marks → pen. The shell draws from its own
// stream; the tenant layers read one live DNA stream in append order —
// appending a layer never shifts an earlier layer's rolls. The assembled
// scene draws through the scene's execute.
import type { Pen } from '@/pen/pen';
import type { Palette } from '@/styling/roles';
import { execute, type Mark } from './scene';
import { fork } from './randomness/rng';
import { curtainMarks, expandCurtain } from './curtain';
import { sillMarks, expandSill } from './sill';
import { expandLight } from './light';
import { lampMarks } from './light/drawLamp';
import { furnitureMarks } from './furniture';
import { shellMarks, expandShell, type ShellPlan } from './window-shell';
import { innerRect } from './window-shell/shell';
import { makeProjection, type Eye } from '@/motion/projection';

// One seed drives both the shell plan and the tremor — the pen is its only
// home. The tenant hangs behind the glass: the curtain rolls on the DNA
// stream, its marks sorting under the pane wash, and a bare tenant adds
// nothing. The light block and the furniture append after the sill —
// appending never re-randomizes an earlier layer — and the room's real
// floor carries its pieces on the planes' own sort buckets, back to front
// under the light block: the lamp always stands in front of every piece.
// The seed and the plan are one window's — the plan must come from
// expandShell(seed) (or a pinned variant of the same window), never another
// window's shell. `night` is the theme's own night flag, declared by the
// page and carried on the theme.
export function windowSceneMarks(seed: number, plan: ShellPlan, night: boolean): Mark[] {
  const rng = fork(seed, 'dna');
  const opening = innerRect(plan.faceWidth);
  // The rolls consume the stream in append order; the draw order lives on
  // the marks' sort keys.
  const curtain = curtainMarks(rng, opening);
  const sill = sillMarks(rng, opening);
  const lamp = expandLight(rng);
  const light = lampMarks(lamp, opening, night);
  // The lamp counts toward the furniture cap whether or not it draws —
  // the room's pieces roll after the light block, off the lamp's presence.
  const furniture = furnitureMarks(rng, lamp.present, opening);
  return [...shellMarks(plan), ...light, ...furniture, ...curtain, ...sill];
}

export function drawWindow(
  ctx: CanvasRenderingContext2D,
  pen: Pen,
  palette: Palette,
  eye: Eye,
  night: boolean,
): void {
  const plan = expandShell(pen.seed);
  execute(
    windowSceneMarks(pen.seed, plan, night),
    pen,
    ctx,
    palette,
    makeProjection(eye),
    // The frame occludes at the wall plane: the interior clips to the
    // opening after projection, whatever the parallax drift carries.
    innerRect(plan.faceWidth),
  );
}

// Whether this window's room burns — the lamp gene the tenant walk rolls.
// The colour model reads it for the backlit cloth, so the caller hands it
// to the palette beside the seed; the walk here is its own fork, consumed
// by the same pure roll picks the scene makes, in the same order.
export function lampLit(seed: number): boolean {
  const rng = fork(seed, 'dna');
  expandCurtain(rng);
  expandSill(rng);
  const lamp = expandLight(rng);
  return lamp.present && lamp.on;
}
