// The wall demo's control UI lives in the reseed and reset buttons
// (src/components/DemoReseedButton.astro, DemoResetButton.astro); the
// catalogue plates pin ShellPlans by hand so the chapter can enumerate the
// vocabulary instead of describing it.
import { centreUnit, createDemoLoop, cssBox } from '@/components/demoLoop';
import { Pen } from '@/pen/pen';
import { registerDemo, type TuningHandle } from '@/components/mount';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { makePalette, type ThemeColors } from '@/styling/roles';
import { windowSeed } from '@/core/randomness/rng';
import { drawWindow, windowMarks } from '@/core/entry';
import { execute } from '@/core/scene/execute';
import { CENTRE_EYE, makeProjection } from '@/motion/projection';
import type { CasementPlan, PicturePlan, ShellPlan, SlidingPlan } from '@/core/window-shell/archetypes';

const COLS = 3;
const ROWS = 2;
// Unit-measure pitch between columns and rows: window box, sill, and air.
const PITCH_X = 2.3;
const PITCH_Y = 1.9;
// The catalogue plates carry sills and add-ons, so they breathe a little more.
const PLATE_PITCH_Y = 2.25;
const DEFAULT_SEED = 1335613256;

const SLOTS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  col: i % COLS,
  row: Math.floor(i / COLS),
}));

function mountShellStrip(canvas: HTMLCanvasElement): TuningHandle {
  let baseSeed = DEFAULT_SEED;
  // One pen per window, kept across frames: the pen caches each trace's warp
  // field, and rebuilding them per frame throws the cache away. Colours ride
  // with the frame's palette, so a theme switch never rebuilds a pen.
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
    (ctx, time, colors: ThemeColors) => {
      const palette = makePalette(colors);
      const box = cssBox(canvas);
      centreUnit(ctx, box, COLS * PITCH_X, ROWS * PITCH_Y, -0.1);
      pens.forEach(({ seed, pen }, i) => {
        pen.setTime(time);
        ctx.save();
        ctx.translate(
          (SLOTS[i].col - (COLS - 1) / 2) * PITCH_X,
          (SLOTS[i].row - (ROWS - 1) / 2) * PITCH_Y,
        );
        drawWindow(ctx, pen, palette, CENTRE_EYE);
        ctx.restore();
      });
    },
  );

  const handle: TuningHandle = {
    setParam() {
      throw new Error('shell grid: no tuning parameters — use reseed');
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

registerDemo('shell-grid', mountShellStrip);

// A plate is a row of pinned ShellPlans — the drawers are pure, so the demo
// hands each its plan directly instead of rolling one from a seed. The pens
// still carry real seeds, for the tremor; the plate seed is a constant, so a
// plate always draws the same windows.

const MEASURED = {
  thicknessJitter: 1,
  faceWidth: 0.07,
  sill: 'flat',
  awning: 'none',
  shutters: 'none',
  box: 'none',
} as const;

function pinnedSliding(overrides: Partial<SlidingPlan> = {}): SlidingPlan {
  return { archetype: 'sliding', layout: 'two', open: 'closed', slideSide: 'left', ...MEASURED, ...overrides };
}

function pinnedCasement(overrides: Partial<CasementPlan> = {}): CasementPlan {
  return { archetype: 'casement', layout: 'pair', open: 'closed', ...MEASURED, ...overrides };
}

function pinnedPicture(): PicturePlan {
  return { archetype: 'picture', layout: 'single', ...MEASURED };
}

function mountPlates(canvas: HTMLCanvasElement, plans: ShellPlan[], cols: number): TuningHandle {
  let baseSeed = DEFAULT_SEED;
  let plates: { plan: ShellPlan; pen: Pen }[] = [];

  const rebuild = () => {
    plates = plans.map((plan, i) => ({
      plan,
      pen: new Pen({ ...DEFAULT_TUNING }, windowSeed(baseSeed, i, 0)),
    }));
  };
  rebuild();

  const rows = Math.ceil(plans.length / cols);
  const loop = createDemoLoop(
    canvas,
    (ctx, time, colors: ThemeColors) => {
      const palette = makePalette(colors);
      const box = cssBox(canvas);
      centreUnit(ctx, box, cols * PITCH_X, rows * PLATE_PITCH_Y);
      plates.forEach(({ plan, pen }, i) => {
        pen.setTime(time);
        ctx.save();
        ctx.translate(
          ((i % cols) - (cols - 1) / 2) * PITCH_X,
          (Math.floor(i / cols) - (rows - 1) / 2) * PLATE_PITCH_Y,
        );
        execute(windowMarks(plan), pen, ctx, palette, makeProjection(CENTRE_EYE));
        ctx.restore();
      });
    },
  );

  const handle: TuningHandle = {
    setParam() {
      throw new Error('shell plates: no tuning parameters — the plans are pinned');
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

const ARCHETYPES: ShellPlan[] = [
  pinnedSliding(),
  pinnedSliding({ layout: 'three' }),
  pinnedSliding({ layout: 'transom' }),
  pinnedCasement(),
  pinnedCasement({ layout: 'one-two' }),
  pinnedPicture(),
];
registerDemo('shell-archetypes', (canvas) => mountPlates(canvas, ARCHETYPES, 3));

// Sliders travel behind their fixed neighbours: never past the stile, never
// into the wall, one moving panel at a time. Casement leaves swing out of
// the wall.
const OPEN_STATES: ShellPlan[] = [
  pinnedSliding({ open: 'closed' }),
  pinnedSliding({ open: 'half-open', slideSide: 'left' }),
  pinnedSliding({ open: 'open', slideSide: 'right' }),
  pinnedCasement({ open: 'closed' }),
  pinnedCasement({ open: 'half-open' }),
  pinnedCasement({ open: 'open' }),
];
registerDemo('shell-open', (canvas) => mountPlates(canvas, OPEN_STATES, 3));

const SILLS: ShellPlan[] = [
  pinnedSliding({ sill: 'flat' }),
  pinnedSliding({ sill: 'bracketed' }),
  pinnedSliding({ sill: 'flush' }),
];
registerDemo('shell-sills', (canvas) => mountPlates(canvas, SILLS, 3));

const ADDONS: ShellPlan[] = [
  pinnedSliding({ awning: 'slope' }),
  pinnedSliding({ awning: 'canopy' }),
  pinnedSliding({ shutters: 'louvered' }),
  pinnedSliding({ shutters: 'paneled' }),
  pinnedSliding({ box: 'box' }),
  pinnedSliding({ box: 'pair' }),
];
registerDemo('shell-addons', (canvas) => mountPlates(canvas, ADDONS, 3));
