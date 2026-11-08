// The pointer stands in for the canvas's offset from the screen centre — on
// the home wall that offset is the canvas's real position, and no pointer
// is involved. Control UI lives in the reseed button and the focal slider.
import { centreUnit, createDemoLoop, cssBox, trackPointerEye } from '@/components/demoLoop';
import { Pen } from '@/pen/pen';
import { registerDemo, type TuningHandle } from '@/components/mount';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { type ThemeColors } from '@/styling/roles';
import { mockPalette } from '@/content/chapters/mock/palette';
import { windowSeed } from '@/core/randomness/rng';
import { shellMarks, expandShell } from '@/core/window-shell';
import { execute } from '@/core/scene';
import { makeProjection, type Eye } from '@/motion/projection';

const COLS = 3;
const ROWS = 2;
const UNIT_PITCH_X = 2.3;
const UNIT_PITCH_Y = 1.9;
const DEFAULT_SEED = 812333041;
// The focal slider's reset value — kept in step with the projection
// module's private default (30), which no longer exports it.
const DEFAULT_FOCAL = 30;

const SLOTS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  col: i % COLS,
  row: Math.floor(i / COLS),
}));

function mountParallaxStrip(canvas: HTMLCanvasElement): TuningHandle {
  let baseSeed = DEFAULT_SEED;
  let focal = DEFAULT_FOCAL;
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

  const pointer = trackPointerEye(canvas, COLS * UNIT_PITCH_X, ROWS * UNIT_PITCH_Y);

  const loop = createDemoLoop(
    canvas,
    (ctx, time, colors: ThemeColors, eye: Eye) => {
      const box = cssBox(canvas);
      centreUnit(ctx, box, COLS * UNIT_PITCH_X, ROWS * UNIT_PITCH_Y, -0.1);
      pens.forEach(({ pen }, i) => {
        pen.setTime(time);
        const wx = (SLOTS[i].col - (COLS - 1) / 2) * UNIT_PITCH_X;
        const wy = (SLOTS[i].row - (ROWS - 1) / 2) * UNIT_PITCH_Y;
        ctx.save();
        ctx.translate(wx, wy);
        // This window's origin seen from the eye — same term the wall feeds
        // per window while panning. The focal slider is the demo's own dial,
        // so it builds its projection with that focal instead of going
        // through drawWindow.
        execute(
          shellMarks(expandShell(pen.seed)),
          pen,
          ctx,
          mockPalette(colors),
          makeProjection({ x: eye.x + wx, y: eye.y + wy }, focal),
        );
        ctx.restore();
      });
    },
    pointer.eye,
  );

  const handle: TuningHandle = {
    setParam(key, value) {
      if (key !== 'focal') throw new Error(`parallax strip: unknown tuning parameter "${key}"`);
      focal = value;
      loop.repaint();
      loop.notify();
    },
    reseed(value) {
      baseSeed = Math.round(value);
      rebuild();
      loop.repaint();
      loop.notify();
    },
    resetParams() {
      baseSeed = DEFAULT_SEED;
      focal = DEFAULT_FOCAL;
      rebuild();
      loop.repaint();
      loop.notify();
    },
    snapshot: () => ({ seed: baseSeed, focal }),
    subscribe: (cb) => loop.subscribe(cb),
    destroy: () => {
      pointer.unbind();
      loop.destroy();
    },
  };
  return handle;
}

registerDemo('motion-parallax', mountParallaxStrip);
