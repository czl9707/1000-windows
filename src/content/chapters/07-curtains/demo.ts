// The curtain chapter's plates pin CurtainPlans by hand — the drawers are
// pure, so the demo hands each its plan directly and what differs between
// neighbours is exactly what the caption says differs. The shell is pinned
// too: one plan, one seed, so a plate always draws the same windows behind
// the same cloth (the pens still carry real seeds, for the tremor).
import { centreUnit, createDemoLoop, cssBox } from '@/components/demoLoop';
import { Pen } from '@/pen/pen';
import { registerDemo, type TuningHandle } from '@/components/mount';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { makePalette, type ThemeColors } from '@/styling/roles';
import { windowSeed } from '@/core/randomness/rng';
import { execute } from '@/core/scene/execute';
import { CENTRE_EYE, makeProjection } from '@/motion/projection';
import { windowMarks } from '@/core/entry';
import { innerRect } from '@/core/window-shell/shell';
import type { ShellPlan } from '@/core/window-shell/archetypes';
import { curtainMarks } from '@/core/curtain/drawCurtain';
import { ZONE_CEILING, type CurtainKind } from '@/core/curtain/catalogue';
import type { CurtainPlan } from '@/core/curtain/curtain';

const COLS = 3;
// Unit-measure pitch between plates: window box, sill, and air.
const PLATE_PITCH_Y = 2.25;
const PITCH_X = 2.3;
const PLATE_SEED = 1335613256;

// One shell for every plate: the casement pair, closed, mid face width —
// the tenant chapters judge the tenant, not the frame.
const SHELL: ShellPlan = {
  archetype: 'casement',
  layout: 'pair',
  open: 'closed',
  thicknessJitter: 1,
  faceWidth: 0.07,
  sill: 'flat',
  awning: 'none',
  shutters: 'none',
  box: 'none',
};
const OPENING = innerRect(SHELL.faceWidth);

function pinned(
  kind: CurtainKind,
  coverage: number,
  overrides: Partial<Extract<CurtainPlan, { present: true }>> = {},
): CurtainPlan {
  const base: Extract<CurtainPlan, { present: true }> = {
    present: true,
    kind,
    // The same clamp the roller applies, so a pinned level draws what the
    // street would draw.
    coverage: Math.min(coverage, ZONE_CEILING[kind]),
    rodY: 0,
    widthJitter: 1,
    drapeSide: 'left',
    slatShare: 0,
  };
  return { ...base, ...overrides };
}

function bare(): CurtainPlan {
  return { present: false };
}

function mountPlates(canvas: HTMLCanvasElement, plans: CurtainPlan[], cols: number): TuningHandle {
  let baseSeed = PLATE_SEED;
  let plates: { plan: CurtainPlan; pen: Pen }[] = [];

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
        execute(
          [...windowMarks(SHELL), ...curtainMarks(plan, OPENING)],
          pen,
          ctx,
          palette,
          makeProjection(CENTRE_EYE),
        );
        ctx.restore();
      });
    },
  );

  const handle: TuningHandle = {
    setParam() {
      throw new Error('curtain plates: no tuning parameters — the plans are pinned');
    },
    reseed(value) {
      baseSeed = Math.round(value);
      rebuild();
      loop.repaint();
      loop.notify();
    },
    resetParams() {
      baseSeed = PLATE_SEED;
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

// The four kinds at a mid level, so the cloth fills a sensible share of
// the same opening.
const KINDS: CurtainPlan[] = [
  pinned('panels', 0.3),
  pinned('drapes', 0.6),
  pinned('venetian', 0.6),
  pinned('roman', 0.6),
];
registerDemo('curtain-kinds', (canvas) => mountPlates(canvas, KINDS, COLS));

// Presence: bare and dressed neighbours on one street, the dressed ones
// varied the way the stream varies them — rod, width, side.
const PRESENCE: CurtainPlan[] = [
  bare(),
  pinned('panels', 0.3, { rodY: 0.015, widthJitter: 1.08 }),
  bare(),
  pinned('drapes', 0.6, { drapeSide: 'right', rodY: -0.01 }),
  bare(),
  pinned('venetian', 0.3, { rodY: 0.01 }),
];
registerDemo('curtain-presence', (canvas) => mountPlates(canvas, PRESENCE, COLS));

// The coverage levels, and the zone clamp: drapes ride the level up to a
// near-full drop, while panels pull 0.6 and 1 both onto their dressing
// ceiling — the two right plates draw identically apart from the jitter.
const COVERAGE: CurtainPlan[] = [
  pinned('drapes', 0.3),
  pinned('drapes', 0.6),
  pinned('drapes', 1),
  pinned('panels', 0.3),
  pinned('panels', 0.6),
  pinned('panels', 1),
];
registerDemo('curtain-coverage', (canvas) => mountPlates(canvas, COVERAGE, COLS));
