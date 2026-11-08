// The control UI for this API lives in the React island
// (src/components/DemoCanvasControls.tsx); the reseed and reset buttons live
// in DemoReseedButton.astro and DemoResetButton.astro.
import { centreUnit, createDemoLoop, cssBox } from '@/components/demoLoop';
import type { Tuning } from '@/pen/pen';
import { Pen } from '@/pen/pen';
import { registerDemo, type TuningHandle } from '@/components/mount';
import type { NumericTuningKey } from '@/pen/tuning';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { type ThemeColors } from '@/styling/roles';
import { mockPalette } from '@/content/chapters/mock/palette';

const DEFAULT_SEED = 1335613256;

// Hand-set frame geometry in unit measure, picked so the edge lengths land
// where the boiling bands say they should: the four frame edges run past
// kochFrame and boil fully on the beat, the mullion and the pane borders
// slide in the mixed band, the dot hangs on the hand alone. Each pane draws
// its own four border lines regardlessly — the doubled edge on the mullion
// is the hand-set look.
const OVERSHOOT = 0.1;
const FRAME = { left: -0.6, right: 0.6, top: -0.5, bottom: 0.5 };
const GLASS = { left: -0.55, right: 0.55, top: -0.45, bottom: 0.45 };
const FRAME_WIDTH = 0.022;
const PANE_WIDTH = 0.016;
const DOT_RADIUS = 0.02;

function mountPenPrototype(canvas: HTMLCanvasElement): TuningHandle {
  const tuning: Tuning = { ...DEFAULT_TUNING };
  let seed = DEFAULT_SEED;
  // The pen keeps the tuning object by reference, so slider moves mutate the
  // live pen in place; only a new seed needs a fresh pen, since the seed is
  // baked into the warp field cache at construction.
  let pen = new Pen(tuning, seed);

  const loop = createDemoLoop(canvas, (ctx, time, colors: ThemeColors) => {
    pen.setTime(time);
    const palette = mockPalette(colors);
    const ink = palette('ink');
    const glass = palette('glass');

    centreUnit(ctx, cssBox(canvas), 2.4, 1.9);

    pen.fill(
      ctx,
      [
        { x: GLASS.left, y: GLASS.top },
        { x: GLASS.right, y: GLASS.top },
        { x: GLASS.right, y: GLASS.bottom },
        { x: GLASS.left, y: GLASS.bottom },
      ],
      { alpha: glass.alpha, color: glass.color },
    );

    pen.stroke(
      ctx,
      [
        { x: FRAME.left - OVERSHOOT, y: FRAME.top },
        { x: FRAME.right + OVERSHOOT, y: FRAME.top },
      ],
      { name: 'frame-top', width: FRAME_WIDTH, color: ink.color },
    );
    pen.stroke(
      ctx,
      [
        { x: FRAME.left - OVERSHOOT, y: FRAME.bottom },
        { x: FRAME.right + OVERSHOOT, y: FRAME.bottom },
      ],
      { name: 'frame-bottom', width: FRAME_WIDTH, color: ink.color },
    );
    pen.stroke(
      ctx,
      [
        { x: FRAME.left, y: FRAME.top - OVERSHOOT },
        { x: FRAME.left, y: FRAME.bottom + OVERSHOOT },
      ],
      { name: 'frame-left', width: FRAME_WIDTH, color: ink.color },
    );
    pen.stroke(
      ctx,
      [
        { x: FRAME.right, y: FRAME.top - OVERSHOOT },
        { x: FRAME.right, y: FRAME.bottom + OVERSHOOT },
      ],
      { name: 'frame-right', width: FRAME_WIDTH, color: ink.color },
    );

    pen.stroke(ctx, [{ x: 0, y: GLASS.top }, { x: 0, y: GLASS.bottom }], {
      name: 'mullion',
      width: PANE_WIDTH,
      color: ink.color,
    });

    for (const [side, pane] of [
      ['left', { left: GLASS.left, right: 0 }],
      ['right', { left: 0, right: GLASS.right }],
    ] as const) {
      const edges: [string, { x1: number; y1: number; x2: number; y2: number }][] = [
        ['top', { x1: pane.left, y1: GLASS.top, x2: pane.right, y2: GLASS.top }],
        ['bottom', { x1: pane.left, y1: GLASS.bottom, x2: pane.right, y2: GLASS.bottom }],
        ['jamb', { x1: pane.left, y1: GLASS.top, x2: pane.left, y2: GLASS.bottom }],
        ['mullion-side', { x1: pane.right, y1: GLASS.top, x2: pane.right, y2: GLASS.bottom }],
      ];
      for (const [edge, e] of edges) {
        pen.stroke(
          ctx,
          [
            { x: e.x1, y: e.y1 },
            { x: e.x2, y: e.y2 },
          ],
          {
            name: `pane-${side}-${edge}`,
            width: PANE_WIDTH,
            color: ink.color,
          },
        );
      }
    }

    pen.dot(ctx, 0, 0, DOT_RADIUS, 'latch-dot', ink.color);
  });

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
