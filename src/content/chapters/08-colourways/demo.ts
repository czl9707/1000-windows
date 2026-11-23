// The colour chapter's street rolls for real: every window resolves its own
// colourway from its seed, jitter included. The pens still carry real seeds,
// for the tremor. Two benches ride the same street: the compare bench puts
// the same three windows in two columns, day on the left and night on the
// right, with the night veil on a slider; the tuning bench drives the
// feelings knobs (params.ts), re-resolving the palettes unmemoized every
// frame.
import { centreUnit, createDemoLoop, cssBox } from '@/components/demoLoop';
import { Pen } from '@/pen/pen';
import { registerDemo, plateCols, type ReseedHandle, type TuningHandle } from '@/components/mount';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { type Palette, type Theme } from '@/styling/roles';
import {
  DEFAULT_COLOURWAY_TUNING,
  tunedWindowPalette,
  windowPalette,
  type ColourwayTuning,
} from '@/styling/colourway';
import { windowSeed } from '@/core/randomness/rng';
import { drawWindow, lampLit } from '@/core/window';
import { CENTRE_EYE } from '@/motion/projection';

const UNIT_PITCH_X = 2.3;
const UNIT_PITCH_Y = 2.25;
const STREET_SEED = 1335613256;
const STREET_COUNT = 6;
const COMPARE_COUNT = 3;

const DAY = { ink: 'rgb(33 37 41)', paper: 'rgb(229 222 214)', isNight: false, transitionMs: 0 } as const;
const DARK = { ink: 'rgb(233 236 239)', paper: 'rgb(0 0 0)', isNight: true, transitionMs: 0 } as const;

function buildStreet(seed: number, count: number = STREET_COUNT): Pen[] {
  return Array.from(
    { length: count },
    (_, i) => new Pen({ ...DEFAULT_TUNING }, windowSeed(seed, i, 0)),
  );
}

function drawStreet(
  ctx: CanvasRenderingContext2D,
  box: { width: number; height: number; dpr: number },
  time: number,
  pens: Pen[],
  paletteFor: (pen: Pen, theme: Theme) => Palette,
  theme: Theme,
): void {
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
    drawWindow(ctx, pen, paletteFor(pen, theme), CENTRE_EYE, theme.isNight);
    ctx.restore();
  });
}

function mountStreet(canvas: HTMLCanvasElement): ReseedHandle {
  let baseSeed = STREET_SEED;
  let pens = buildStreet(baseSeed);

  const loop = createDemoLoop(canvas, (ctx, time, theme: Theme) => {
    drawStreet(ctx, cssBox(canvas), time, pens, (pen) => windowPalette(pen.seed, theme), theme);
  });

  return {
    reseed(value) {
      baseSeed = Math.round(value);
      pens = buildStreet(baseSeed);
      loop.repaint();
      loop.notify();
    },
    destroy: () => loop.destroy(),
  };
}

registerDemo('colourway-street', mountStreet);

// The compare bench: the same three windows in two columns — the light
// theme on the left, the dark one on the right — with the night veil (the
// mix that sinks night's colours into its ground) on a slider. Each half
// runs full-bleed and centres its column, so the two grounds meet at the
// canvas's midline.
function mountCompare(canvas: HTMLCanvasElement): TuningHandle {
  let baseSeed = STREET_SEED;
  let veil = DEFAULT_COLOURWAY_TUNING.nightMix;
  let pens = buildStreet(baseSeed, COMPARE_COUNT);

  const loop = createDemoLoop(canvas, (ctx, time) => {
    const box = cssBox(canvas);
    const extentW = 2 * UNIT_PITCH_X;
    const extentH = COMPARE_COUNT * UNIT_PITCH_Y;
    const scale = Math.min(box.width / extentW, box.height / extentH);
    ctx.fillStyle = DAY.paper;
    ctx.fillRect(0, 0, canvas.width / 2, canvas.height);
    ctx.fillStyle = DARK.paper;
    ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
    ctx.scale(box.dpr * scale, box.dpr * scale);
    ctx.translate(box.width / (2 * scale), box.height / (2 * scale));
    const colX = box.width / (4 * scale);
    const day = { ...DAY };
    const dark = { ...DARK };
    const nightTuning: ColourwayTuning = { ...DEFAULT_COLOURWAY_TUNING, nightMix: veil };
    pens.forEach((pen, i) => {
      pen.setTime(time);
      const columns = [
        { x: -colX, palette: windowPalette(pen.seed, day), night: day.isNight },
        { x: colX, palette: tunedWindowPalette(pen.seed, dark, nightTuning, lampLit(pen.seed)), night: dark.isNight },
      ];
      for (const { x, palette, night } of columns) {
        ctx.save();
        ctx.translate(x, (i - (COMPARE_COUNT - 1) / 2) * UNIT_PITCH_Y);
        drawWindow(ctx, pen, palette, CENTRE_EYE, night);
        ctx.restore();
      }
    });
  });

  const handle: TuningHandle = {
    setParam(key, value) {
      if (key !== 'nightMix') throw new Error(`compare bench: unknown parameter: ${key}`);
      veil = value;
      loop.repaint();
      loop.notify();
    },
    reseed(value) {
      baseSeed = Math.round(value);
      pens = buildStreet(baseSeed, COMPARE_COUNT);
      loop.repaint();
      loop.notify();
    },
    resetParams() {
      veil = DEFAULT_COLOURWAY_TUNING.nightMix;
      loop.repaint();
      loop.notify();
    },
    snapshot: () => ({ nightMix: veil }),
    subscribe: (cb) => loop.subscribe(cb),
    destroy: () => loop.destroy(),
  };
  return handle;
}

registerDemo('colourway-night', mountCompare);

// The tuning bench: the feelings knobs (params.ts) over the street at the
// page's own theme, palettes re-resolved unmemoized every frame.
function mountBench(canvas: HTMLCanvasElement): TuningHandle {
  let baseSeed = STREET_SEED;
  const tuning: ColourwayTuning = { ...DEFAULT_COLOURWAY_TUNING };
  let pens = buildStreet(baseSeed);

  const loop = createDemoLoop(canvas, (ctx, time, theme: Theme) => {
    drawStreet(
      ctx,
      cssBox(canvas),
      time,
      pens,
      (pen) => tunedWindowPalette(pen.seed, theme, tuning, lampLit(pen.seed)),
      theme,
    );
  });

  const handle: TuningHandle = {
    setParam(key, value) {
      tuning[key as keyof ColourwayTuning] = value;
      loop.repaint();
      loop.notify();
    },
    reseed(value) {
      baseSeed = Math.round(value);
      pens = buildStreet(baseSeed);
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

registerDemo('colourway-tuning', mountBench);
