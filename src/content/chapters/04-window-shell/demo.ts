// The wall demo's control UI lives in the reseed and reset buttons
// (src/components/DemoReseedButton.astro, DemoResetButton.astro). The rest of
// this file is the catalogue plates: fixed ShellPlans pinned by hand, one demo
// per variant group and one per depth layer, so the chapter can enumerate the
// vocabulary instead of describing it.
import { centreUnit, createDemoLoop, cssBox } from '../../../components/demoLoop';
import { Pen } from '../../../pen/pen';
import { registerDemo, type TuningHandle } from '../../../components/mount';
import { DEFAULT_TUNING } from '../../../pen/tuning';
import type { Palette } from '../../../styling/roles';
import { windowSeed } from '../../../core/randomness/rng';
import { drawWindow, windowMarks } from '../../../core/window';
import { execute } from '../../../core/scene/execute';
import type { ShellPlan } from '../../../core/window-shell/archetypes';

const COLS = 3;
const ROWS = 2;
// Unit-measure pitch between columns and rows: window box, sill, and air.
const PITCH_X = 2.3;
const PITCH_Y = 1.9;
// The catalogue plates carry sills and add-ons, so they breathe a little more.
const PLATE_PITCH_Y = 2.25;
const DEFAULT_SEED = 1335613256;

// The wall's grid addresses, fixed: the demo only re-rolls the meta-seed.
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
    (ctx, time, palette: Palette) => {
      const box = cssBox(canvas);
      centreUnit(ctx, box, COLS * PITCH_X, ROWS * PITCH_Y, -0.1);
      pens.forEach(({ seed, pen }, i) => {
        pen.setTime(time);
        ctx.save();
        ctx.translate(
          (SLOTS[i].col - (COLS - 1) / 2) * PITCH_X,
          (SLOTS[i].row - (ROWS - 1) / 2) * PITCH_Y,
        );
        drawWindow(ctx, pen, palette);
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

// --- The catalogue plates -------------------------------------------------
//
// A plate is a row of pinned ShellPlans — the drawers are pure, so the demo
// hands each its plan directly instead of rolling one from a seed. The pens
// still carry real seeds, for the tremor; the plate seed is a constant, so a
// plate always draws the same six (or three) windows.

function pinnedPlan(archetype: ShellPlan['archetype'], overrides: Partial<ShellPlan> = {}): ShellPlan {
  const layout = archetype === 'sash' ? '1-over-1' : archetype === 'casement' ? 'pair' : 'single';
  return {
    archetype,
    layout,
    open: 'closed',
    hingeSide: null,
    thicknessJitter: 1,
    faceWidth: 0.07,
    sill: 'flat',
    awning: 'none',
    shutters: 'none',
    box: 'none',
    ...overrides,
  };
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
    (ctx, time, palette: Palette) => {
      const box = cssBox(canvas);
      centreUnit(ctx, box, cols * PITCH_X, rows * PLATE_PITCH_Y);
      plates.forEach(({ plan, pen }, i) => {
        pen.setTime(time);
        ctx.save();
        ctx.translate(
          ((i % cols) - (cols - 1) / 2) * PITCH_X,
          (Math.floor(i / cols) - (rows - 1) / 2) * PLATE_PITCH_Y,
        );
        execute(windowMarks(plan), pen, ctx, palette);
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

// The archetype catalogue in one plate: sash's layouts on the first row,
// casement's on the second, picture alone below — it has no layout axis.
const ARCHETYPES: ShellPlan[] = [
  pinnedPlan('sash', { layout: '1-over-1' }),
  pinnedPlan('sash', { layout: '2-over-2' }),
  pinnedPlan('sash', { layout: '6-over-6' }),
  pinnedPlan('casement', { layout: 'single' }),
  pinnedPlan('casement', { layout: 'pair' }),
  pinnedPlan('casement', { layout: 'four-pane' }),
  pinnedPlan('picture', { layout: 'single' }),
];
registerDemo('shell-archetypes', (canvas) => mountPlates(canvas, ARCHETYPES, 3));

// The open states, sash above casement. Sash slides: the lower sash lifts off
// the frame. Casement swings: the leaf narrows by the swing's cosine — and the
// two open windows show both hinge sides (open left-hinged, half-open right).
const OPEN_STATES: ShellPlan[] = [
  pinnedPlan('sash', { open: 'closed' }),
  pinnedPlan('sash', { open: 'half-open' }),
  pinnedPlan('sash', { open: 'open' }),
  pinnedPlan('casement', { open: 'closed' }),
  pinnedPlan('casement', { open: 'half-open', hingeSide: 'right' }),
  pinnedPlan('casement', { open: 'open', hingeSide: 'left' }),
];
registerDemo('shell-open', (canvas) => mountPlates(canvas, OPEN_STATES, 3));

// The sills, on an otherwise bare sash: flat, bracketed, flush (none).
const SILLS: ShellPlan[] = [
  pinnedPlan('sash', { sill: 'flat' }),
  pinnedPlan('sash', { sill: 'bracketed' }),
  pinnedPlan('sash', { sill: 'flush' }),
];
registerDemo('shell-sills', (canvas) => mountPlates(canvas, SILLS, 3));

// The add-on masses, one kind per window: both awning kinds, both shutter
// kinds, both box counts.
const ADDONS: ShellPlan[] = [
  pinnedPlan('sash', { awning: 'slope' }),
  pinnedPlan('sash', { awning: 'canopy' }),
  pinnedPlan('sash', { shutters: 'louvered' }),
  pinnedPlan('sash', { shutters: 'paneled' }),
  pinnedPlan('sash', { box: 'box' }),
  pinnedPlan('sash', { box: 'pair' }),
];
registerDemo('shell-addons', (canvas) => mountPlates(canvas, ADDONS, 3));
