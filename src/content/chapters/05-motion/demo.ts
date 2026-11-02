// The motion chapter's demo: a wall strip whose parallax is driven by the
// pointer standing in for the canvas's offset from the screen centre — on
// the home wall that offset is the canvas's real position, and no pointer
// is involved. Control UI lives in the reseed button.
import { centreUnit, createDemoLoop, cssBox, type Eye, type Pointer } from '../../../components/demoLoop';
import { Pen } from '../../../pen/pen';
import { registerDemo, type TuningHandle } from '../../../components/mount';
import { DEFAULT_TUNING } from '../../../pen/tuning';
import { makePalette, type ThemeColors } from '../../../styling/roles';
import { windowSeed } from '../../../core/randomness/rng';
import { drawWindow } from '../../../core/entry';

const COLS = 3;
const ROWS = 2;
// Unit-measure pitch between columns and rows: window box, sill, and air.
const PITCH_X = 2.3;
const PITCH_Y = 1.9;
const DEFAULT_SEED = 812333041;

const SLOTS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  col: i % COLS,
  row: Math.floor(i / COLS),
}));

function mountParallaxStrip(canvas: HTMLCanvasElement): TuningHandle {
  let baseSeed = DEFAULT_SEED;
  // One pen per window, kept across frames: the pen caches each trace's warp
  // field, and rebuilding them per frame throws the cache away.
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
    (ctx, time, colors: ThemeColors, eye: Eye) => {
      const box = cssBox(canvas);
      centreUnit(ctx, box, COLS * PITCH_X, ROWS * PITCH_Y, -0.1);
      pens.forEach(({ pen }, i) => {
        pen.setTime(time);
        ctx.save();
        ctx.translate(
          (SLOTS[i].col - (COLS - 1) / 2) * PITCH_X,
          (SLOTS[i].row - (ROWS - 1) / 2) * PITCH_Y,
        );
        drawWindow(ctx, pen, makePalette(colors), eye);
        ctx.restore();
      });
    },
    // The pointer spans the canvas, so the eye offset spans the same canvas
    // in unit measure: the cursor at an edge reads as this strip sitting at
    // the screen's edge.
    (_canvas, pointer: Pointer) => ({
      x: pointer.x * COLS * PITCH_X,
      y: pointer.y * ROWS * PITCH_Y,
    }),
  );

  const handle: TuningHandle = {
    setParam() {
      throw new Error('parallax strip: no tuning parameters — use reseed');
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

registerDemo('motion-parallax', mountParallaxStrip);
