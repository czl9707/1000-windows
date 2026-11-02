// The control UI for this API lives in the React island
// (src/components/DemoCanvasControls.tsx); the reseed and reset buttons live
// in DemoReseedButton.astro and DemoResetButton.astro.
import { centreUnit, createDemoLoop, cssBox } from '@/components/demoLoop';
import type { Tuning } from '@/pen/pen';
import { Pen } from '@/pen/pen';
import { registerDemo, type TuningHandle } from '@/components/mount';
import type { NumericTuningKey } from '@/pen/tuning';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { makePalette, type ThemeColors } from '@/styling/roles';
import { drawWindow } from '@/core/entry';

const DEFAULT_SEED = 1335613256;

function mountPenPrototype(canvas: HTMLCanvasElement): TuningHandle {
  const tuning: Tuning = { ...DEFAULT_TUNING };
  let seed = DEFAULT_SEED;
  // The pen keeps the tuning object by reference, so slider moves mutate the
  // live pen in place; only a new seed needs a fresh pen, since the seed is
  // baked into the warp field cache at construction.
  let pen = new Pen(tuning, seed);

  const loop = createDemoLoop(
    canvas,
    (ctx, time, colors: ThemeColors) => {
      pen.setTime(time);
      centreUnit(ctx, cssBox(canvas), 2.4, 1.9);
      drawWindow(ctx, pen, makePalette(colors));
    },
  );

  const reseed = (value: number) => {
    seed = Math.round(value);
    pen = new Pen(tuning, seed);
  };

  const handle: TuningHandle = {
    setParam(key, value) {
      tuning[key as NumericTuningKey] = value;
      loop.repaint();
      loop.notify();
    },
    reseed(value) {
      reseed(value);
      loop.repaint();
      loop.notify();
    },
    resetParams() {
      Object.assign(tuning, DEFAULT_TUNING);
      reseed(DEFAULT_SEED);
      loop.repaint();
      loop.notify();
    },
    snapshot: () => ({ ...tuning, seed }),
    subscribe: (cb) => loop.subscribe(cb),
    destroy: () => loop.destroy(),
  };
  return handle;
}

registerDemo('pen-prototype', mountPenPrototype);
