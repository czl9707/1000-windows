// The layers chapter's exhibit is the colour pipeline in full: the same
// shell grid the window shell chapter mounts, drawn through the whole chain
// — marks, projection, the per-surface colourway — so the page shows what
// the division of labour produces. The prose itself stays at the pipeline's
// level; this canvas is the finished article the pipeline builds toward.
import { centreUnit, createDemoLoop, cssBox } from '@/components/demoLoop';
import { Pen } from '@/pen/pen';
import { registerDemo, type TuningHandle } from '@/components/mount';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { type Theme } from '@/styling/roles';
import { windowPalette } from '@/styling/colourway';
import { windowSeed } from '@/core/randomness/rng';
import { execute } from '@/core/scene';
import { CENTRE_EYE, makeProjection } from '@/motion/projection';
import { shellMarks, expandShell } from '@/core/window-shell';

const COLS = 3;
const ROWS = 2;
const UNIT_PITCH_X = 2.3;
const UNIT_PITCH_Y = 1.9;
const DEFAULT_SEED = 1335613256;

const SLOTS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  col: i % COLS,
  row: Math.floor(i / COLS),
}));

function mountLayersGrid(canvas: HTMLCanvasElement): TuningHandle {
  let baseSeed = DEFAULT_SEED;
  let pens: { seed: number; pen: Pen }[] = [];

  const rebuild = () => {
    pens = SLOTS.map(({ col, row }) => {
      const seed = windowSeed(baseSeed, col, row);
      return { seed, pen: new Pen({ ...DEFAULT_TUNING }, seed) };
    });
  };
  rebuild();

  const loop = createDemoLoop(
    canvas,
    (ctx, time, theme: Theme) => {
      const box = cssBox(canvas);
      centreUnit(ctx, box, COLS * UNIT_PITCH_X, ROWS * UNIT_PITCH_Y, -0.1);
      pens.forEach(({ seed, pen }, i) => {
        pen.setTime(time);
        ctx.save();
        ctx.translate(
          (SLOTS[i].col - (COLS - 1) / 2) * UNIT_PITCH_X,
          (SLOTS[i].row - (ROWS - 1) / 2) * UNIT_PITCH_Y,
        );
        execute(shellMarks(expandShell(pen.seed)), pen, ctx, windowPalette(seed, theme), makeProjection(CENTRE_EYE));
        ctx.restore();
      });
    },
  );

  const handle: TuningHandle = {
    setParam() {
      throw new Error('layers grid: no tuning parameters — use reseed');
    },
    reseed(value) {
      baseSeed = Math.round(value);
      rebuild();
      loop.repaint();
      loop.notify();
    },
    resetParams() {
      baseSeed = DEFAULT_SEED;
      rebuild();
      loop.repaint();
      loop.notify();
    },
    snapshot: () => ({ seed: baseSeed }),
    subscribe: (cb) => loop.subscribe(cb),
    destroy: () => loop.destroy(),
  };
  return handle;
}

registerDemo('layers-grid', mountLayersGrid);
