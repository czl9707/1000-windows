// The wall demo's control UI lives in the reseed and reset buttons
// (src/components/DemoReseedButton.astro, DemoResetButton.astro); the
// catalogue plates pin ShellPlans by hand so the chapter can enumerate the
// vocabulary instead of describing it.
import { centreUnit, createDemoLoop, cssBox } from '@/components/demoLoop';
import { Pen } from '@/pen/pen';
import { registerDemo, plateCols, type TuningHandle } from '@/components/mount';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { type ThemeColors } from '@/styling/roles';
import { windowPalette } from '@/styling/colourway';
import { windowSeed } from '@/core/randomness/rng';
import { drawWindow } from '@/core/window';
import { execute } from '@/core/scene';
import { CENTRE_EYE, makeProjection } from '@/motion/projection';
import { windowMarks, type CasementPlan, type PicturePlan, type ShellPlan, type SlidingPlan } from '@/core/window-shell';

const COLS = 3;
const ROWS = 2;
const UNIT_PITCH_X = 2.3;
const UNIT_PITCH_Y = 1.9;
// The catalogue plates carry sills and add-ons, so they breathe a little more.
const UNIT_PLATE_PITCH_Y = 2.25;
const DEFAULT_SEED = 1335613256;

const SLOTS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  col: i % COLS,
  row: Math.floor(i / COLS),
}));

function mountShellStrip(canvas: HTMLCanvasElement): TuningHandle {
  let baseSeed = DEFAULT_SEED;
  // One pen per window, kept across frames: the pen caches each trace's warp
  // field, and rebuilding them per frame throws the cache away. Colours ride
  // with the window's own palette, so a theme switch never rebuilds a pen.
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
      const box = cssBox(canvas);
      centreUnit(ctx, box, COLS * UNIT_PITCH_X, ROWS * UNIT_PITCH_Y, -0.1);
      pens.forEach(({ seed, pen }, i) => {
        pen.setTime(time);
        ctx.save();
        ctx.translate(
          (SLOTS[i].col - (COLS - 1) / 2) * UNIT_PITCH_X,
          (SLOTS[i].row - (ROWS - 1) / 2) * UNIT_PITCH_Y,
        );
        drawWindow(ctx, pen, windowPalette(pen.seed, colors), CENTRE_EYE);
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

function mountPlates(canvas: HTMLCanvasElement, plans: ShellPlan[]): TuningHandle {
  const cols = plateCols(plans.length);
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
      const box = cssBox(canvas);
      centreUnit(ctx, box, cols * UNIT_PITCH_X, rows * UNIT_PLATE_PITCH_Y);
      plates.forEach(({ plan, pen }, i) => {
        pen.setTime(time);
        ctx.save();
        ctx.translate(
          ((i % cols) - (cols - 1) / 2) * UNIT_PITCH_X,
          (Math.floor(i / cols) - (rows - 1) / 2) * UNIT_PLATE_PITCH_Y,
        );
        execute(windowMarks(plan), pen, ctx, windowPalette(pen.seed, colors), makeProjection(CENTRE_EYE));
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
registerDemo('shell-archetypes', (canvas) => mountPlates(canvas, ARCHETYPES));

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
registerDemo('shell-open', (canvas) => mountPlates(canvas, OPEN_STATES));

const SILLS: ShellPlan[] = [
  pinnedSliding({ sill: 'flat' }),
  pinnedSliding({ sill: 'bracketed' }),
  pinnedSliding({ sill: 'flush' }),
];
registerDemo('shell-sills', (canvas) => mountPlates(canvas, SILLS));

const ADDONS: ShellPlan[] = [
  pinnedSliding({ awning: 'slope' }),
  pinnedSliding({ awning: 'canopy' }),
  pinnedSliding({ shutters: 'louvered' }),
  pinnedSliding({ shutters: 'paneled' }),
  pinnedSliding({ box: 'box' }),
  pinnedSliding({ box: 'pair' }),
];
registerDemo('shell-addons', (canvas) => mountPlates(canvas, ADDONS));
