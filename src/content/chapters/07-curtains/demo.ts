// The curtain chapter's plates pin CurtainPlans by hand — the drawers are
// pure, so the demo hands each its plan directly and what differs between
// neighbours is exactly what the caption says differs. The shell is pinned
// too: one plan, one seed, so a plate always draws the same windows behind
// the same cloth (the pens still carry real seeds, for the tremor).
import { centreUnit, createDemoLoop, cssBox } from '@/components/demoLoop';
import { Pen } from '@/pen/pen';
import { registerDemo, plateCols, type TuningHandle } from '@/components/mount';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { type ThemeColors } from '@/styling/roles';
import { windowPalette } from '@/styling/colourway';
import { windowSeed } from '@/core/randomness/rng';
import { execute } from '@/core/scene';
import { CENTRE_EYE, makeProjection } from '@/motion/projection';
import { windowMarks, innerRect, type ShellPlan } from '@/core/window-shell';
import { curtainMarks, pinnedCurtain, type CurtainPlan } from '@/core/curtain';

const UNIT_PLATE_PITCH_Y = 2.25;
const UNIT_PITCH_X = 2.3;
const PLATE_SEED = 1335613256;

// The tenant chapters judge the tenant, not the frame.
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

function bare(): CurtainPlan {
  return { present: false };
}

function mountPlates(canvas: HTMLCanvasElement, plans: CurtainPlan[]): TuningHandle {
  const cols = plateCols(plans.length);
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
      const box = cssBox(canvas);
      centreUnit(ctx, box, cols * UNIT_PITCH_X, rows * UNIT_PLATE_PITCH_Y);
      plates.forEach(({ plan, pen }, i) => {
        pen.setTime(time);
        ctx.save();
        ctx.translate(
          ((i % cols) - (cols - 1) / 2) * UNIT_PITCH_X,
          (Math.floor(i / cols) - (rows - 1) / 2) * UNIT_PLATE_PITCH_Y,
        );
        execute(
          [...windowMarks(SHELL), ...curtainMarks(plan, OPENING)],
          pen,
          ctx,
          windowPalette(pen.seed, colors),
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
  pinnedCurtain('panels', 0.3),
  pinnedCurtain('drapes', 0.6),
  pinnedCurtain('venetian', 0.6),
  pinnedCurtain('roman', 0.6),
];
registerDemo('curtain-kinds', (canvas) => mountPlates(canvas, KINDS));

// Presence: bare and dressed neighbours on one street, the dressed ones
// varied the way the stream varies them — rod, width, side.
const PRESENCE: CurtainPlan[] = [
  bare(),
  pinnedCurtain('panels', 0.3, { rodY: 0.015, widthJitter: 1.08 }),
  bare(),
  pinnedCurtain('drapes', 0.6, { drapeSide: 'right', rodY: -0.01 }),
  bare(),
  pinnedCurtain('venetian', 0.3, { rodY: 0.01 }),
];
registerDemo('curtain-presence', (canvas) => mountPlates(canvas, PRESENCE));

// The coverage levels, and the zone clamp: drapes ride the level up to a
// near-full drop, while panels pull 0.6 and 1 both onto their dressing
// ceiling — the two right plates draw identically apart from the jitter.
const COVERAGE: CurtainPlan[] = [
  pinnedCurtain('drapes', 0.3),
  pinnedCurtain('drapes', 0.6),
  pinnedCurtain('drapes', 1),
  pinnedCurtain('panels', 0.3),
  pinnedCurtain('panels', 0.6),
  pinnedCurtain('panels', 1),
];
registerDemo('curtain-coverage', (canvas) => mountPlates(canvas, COVERAGE));
