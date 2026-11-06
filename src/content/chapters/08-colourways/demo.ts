// The colour chapter's street rolls for real: every window resolves its own
// colourway from its seed, jitter included. The pens still carry real seeds,
// for the tremor.
import { centreUnit, createDemoLoop, cssBox } from '@/components/demoLoop';
import { Pen } from '@/pen/pen';
import { registerDemo, plateCols, type ReseedHandle } from '@/components/mount';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { type ThemeColors } from '@/styling/roles';
import { windowPalette } from '@/styling/colourway';
import { windowSeed } from '@/core/randomness/rng';
import { drawWindow } from '@/core/window';
import { CENTRE_EYE } from '@/motion/projection';

const UNIT_PITCH_X = 2.3;
const UNIT_PITCH_Y = 2.25;
const STREET_SEED = 1335613256;
const STREET_COUNT = 6;

function mountStreet(canvas: HTMLCanvasElement): ReseedHandle {
  const cols = plateCols(STREET_COUNT);
  const rows = Math.ceil(STREET_COUNT / cols);
  let baseSeed = STREET_SEED;
  let pens: Pen[] = [];

  const rebuild = () => {
    pens = Array.from(
      { length: STREET_COUNT },
      (_, i) => new Pen({ ...DEFAULT_TUNING }, windowSeed(baseSeed, i, 0)),
    );
  };
  rebuild();

  const loop = createDemoLoop(
    canvas,
    (ctx, time, colors: ThemeColors) => {
      const box = cssBox(canvas);
      centreUnit(ctx, box, cols * UNIT_PITCH_X, rows * UNIT_PITCH_Y);
      pens.forEach((pen, i) => {
        pen.setTime(time);
        ctx.save();
        ctx.translate(
          ((i % cols) - (cols - 1) / 2) * UNIT_PITCH_X,
          (Math.floor(i / cols) - (rows - 1) / 2) * UNIT_PITCH_Y,
        );
        drawWindow(ctx, pen, windowPalette(pen.seed, colors), CENTRE_EYE);
        ctx.restore();
      });
    },
  );

  return {
    reseed(value) {
      baseSeed = Math.round(value);
      rebuild();
      loop.repaint();
      loop.notify();
    },
    destroy: () => loop.destroy(),
  };
}

registerDemo('colourway-street', mountStreet);
