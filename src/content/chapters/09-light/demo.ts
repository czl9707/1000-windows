// The light chapter's two benches, both pinned to the night look — the
// lamps live there. The kinds bench draws one window per construction off
// pinned plans (shell plus light block alone — no tenant occludes the
// lamp), the shared knobs reading across all six at once. The street bench
// rolls for real at night: every window walks its own light gene, the veil
// and the warmth on the tuning knobs (params.ts).
import { centreUnit, createDemoLoop, cssBox } from '@/components/demoLoop';
import { Pen } from '@/pen/pen';
import { registerDemo, plateCols, type TuningHandle } from '@/components/mount';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { type Theme } from '@/styling/roles';
import { DEFAULT_COLOURWAY_TUNING, tunedWindowPalette, windowPalette, type ColourwayTuning } from '@/styling/colourway';
import { windowSeed } from '@/core/randomness/rng';
import { execute } from '@/core/scene';
import { drawWindow, lampLit } from '@/core/window';
import { shellMarks, expandShell } from '@/core/window-shell';
import { innerRect } from '@/core/window-shell/shell';
import { LAMP_KINDS, ANCHORS, FACINGS } from '@/core/light/catalogue';
import { pinnedLamp } from '@/core/light/light';
import { lampMarks } from '@/core/light/drawLamp';
import { makeProjection, CENTRE_EYE } from '@/motion/projection';

const UNIT_PITCH_X = 2.3;
const UNIT_PITCH_Y = 2.25;
const STREET_SEED = 902104771;
const STREET_COUNT = 6;
const KIND_COUNT = LAMP_KINDS.length;

// The benches pin the theme: the lamps draw at night, so both paint the
// dark pair regardless of the page.
const DARK = { ink: 'rgb(233 236 239)', paper: 'rgb(0 0 0)', isNight: true, transitionMs: 0 } as const;

function buildStreet(seed: number, count: number): Pen[] {
  return Array.from(
    { length: count },
    (_, i) => new Pen({ ...DEFAULT_TUNING }, windowSeed(seed, i, 0)),
  );
}

function paintNight(ctx: CanvasRenderingContext2D, box: { width: number; height: number; dpr: number }): void {
  ctx.fillStyle = DARK.paper;
  ctx.fillRect(0, 0, box.width * box.dpr, box.height * box.dpr);
}

// The kinds bench: one construction per window, every lamp wearing the same
// pinned plan so a knob reads across the row. The night knob pins the dark
// pair when on; at day the bench draws in the page's own colours — the
// furniture, unlit, whatever the theme is.
function mountKinds(canvas: HTMLCanvasElement): TuningHandle {
  let baseSeed = STREET_SEED;
  let pens = buildStreet(baseSeed, KIND_COUNT);
  const pinned = { night: 1, location: 1, facing: 1, lit: 1 };

  const loop = createDemoLoop(canvas, (ctx, _time, pageTheme: Theme) => {
    const box = cssBox(canvas);
    const night = pinned.night >= 0.5;
    const theme = night ? DARK : pageTheme;
    if (night) paintNight(ctx, box);
    const cols = plateCols(KIND_COUNT);
    const rows = Math.ceil(KIND_COUNT / cols);
    centreUnit(ctx, box, cols * UNIT_PITCH_X, rows * UNIT_PITCH_Y);
    pens.forEach((pen, i) => {
      const plan = expandShell(pen.seed);
      const opening = innerRect(plan.faceWidth);
      const lamp = pinnedLamp({
        kind: LAMP_KINDS[i].value,
        location: ANCHORS[Math.round(pinned.location)].value,
        facing: FACINGS[Math.round(pinned.facing)].value,
        on: pinned.lit >= 0.5,
      });
      ctx.save();
      ctx.translate(
        ((i % cols) - (cols - 1) / 2) * UNIT_PITCH_X,
        (Math.floor(i / cols) - (rows - 1) / 2) * UNIT_PITCH_Y,
      );
      execute(
        [...shellMarks(plan), ...lampMarks(lamp, opening, night)],
        pen,
        ctx,
        windowPalette(pen.seed, theme),
        makeProjection(CENTRE_EYE),
      );
      ctx.restore();
    });
  });

  const handle: TuningHandle = {
    setParam(key, value) {
      if (key !== 'night' && key !== 'location' && key !== 'facing' && key !== 'lit') {
        throw new Error(`kinds bench: unknown parameter: ${key}`);
      }
      pinned[key] = value;
      loop.repaint();
      loop.notify();
    },
    reseed(value) {
      baseSeed = Math.round(value);
      pens = buildStreet(baseSeed, KIND_COUNT);
      loop.repaint();
      loop.notify();
    },
    resetParams() {
      pinned.night = 1;
      pinned.location = 1;
      pinned.facing = 1;
      pinned.lit = 1;
      loop.repaint();
      loop.notify();
    },
    snapshot: () => ({ ...pinned }),
    subscribe: (cb) => loop.subscribe(cb),
    destroy: () => loop.destroy(),
  };
  return handle;
}

registerDemo('light-kinds', mountKinds);

// The night street: real rolls, every window on its own gene — the veil
// sinking the unlit rooms, the lit ones wearing their warmth. The tuning
// knobs are the light layer's dials.
function mountStreet(canvas: HTMLCanvasElement): TuningHandle {
  let baseSeed = STREET_SEED;
  let pens = buildStreet(baseSeed, STREET_COUNT);
  const tuning: ColourwayTuning = { ...DEFAULT_COLOURWAY_TUNING };

  const loop = createDemoLoop(canvas, (ctx, time, _theme: Theme) => {
    const box = cssBox(canvas);
    paintNight(ctx, box);
    const cols = plateCols(STREET_COUNT);
    const rows = Math.ceil(STREET_COUNT / cols);
    centreUnit(ctx, box, cols * UNIT_PITCH_X, rows * UNIT_PITCH_Y);
    pens.forEach((pen, i) => {
      pen.setTime(time);
      ctx.save();
      ctx.translate(
        ((i % cols) - (cols - 1) / 2) * UNIT_PITCH_X,
        (Math.floor(i / cols) - (rows - 1) / 2) * UNIT_PITCH_Y,
      );
      drawWindow(ctx, pen, tunedWindowPalette(pen.seed, DARK, tuning, lampLit(pen.seed)), CENTRE_EYE, DARK.isNight);
      ctx.restore();
    });
  });

  const handle: TuningHandle = {
    setParam(key, value) {
      if (!(key in tuning)) throw new Error(`night street: unknown parameter: ${key}`);
      tuning[key as keyof ColourwayTuning] = value;
      loop.repaint();
      loop.notify();
    },
    reseed(value) {
      baseSeed = Math.round(value);
      pens = buildStreet(baseSeed, STREET_COUNT);
      loop.repaint();
      loop.notify();
    },
    resetParams() {
      Object.assign(tuning, DEFAULT_COLOURWAY_TUNING);
      loop.repaint();
      loop.notify();
    },
    snapshot: () => ({ ...tuning }),
    subscribe: (cb) => loop.subscribe(cb),
    destroy: () => loop.destroy(),
  };
  return handle;
}

registerDemo('light-night', mountStreet);
