import { describe, expect, it } from 'vitest';
import { Pen } from '@/pen/pen';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { windowPalette } from '@/styling/colourway';
import { PenLedger } from './ledger';
import { drawWallSurface } from './texture';

// Node has no Image: the stipple tile never loads, so the texture pass
// early-returns and the test exercises the colour plumbing only.
(globalThis as { Image?: unknown }).Image = class {
  complete = false;
};

const strokeColors: string[] = [];

class StrokeRecordingPen extends Pen {
  colors: string[] = [];
  stroke(ctx: CanvasRenderingContext2D, raw: unknown, opts: { color: string }): void {
    this.colors.push(opts.color);
    strokeColors.push(opts.color);
  }
}

// A context that records every fillStyle the surface lays down and no-ops
// everything else — the base fill is the first fillStyle it sets.
function recordingCtx(): { ctx: CanvasRenderingContext2D; fills: string[] } {
  const fills: string[] = [];
  const ctx = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'fillStyle') return fills[fills.length - 1];
        return () => {};
      },
      set: (_target, prop, value) => {
        if (prop === 'fillStyle') fills.push(String(value));
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, fills };
}

describe('drawWallSurface', () => {
  it('fills the paper base with the palette and strokes every patch in the palette ink', () => {
    const theme = { ink: 'rgb(33 37 41)', paper: 'rgb(229 222 214)', night: 0, transitionMs: 0 };
    const palette = windowPalette(424242, theme);
    const slotPens = new PenLedger((key) => {
      const seed = 3100 + [...key].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      return new StrokeRecordingPen({ ...DEFAULT_TUNING }, seed);
    });

    const { ctx, fills } = recordingCtx();
    drawWallSurface(ctx, { x: 0, y: 0 }, 4, 3, 424242, slotPens, 0, palette);

    expect(fills[0]).toBe(theme.paper);
    expect(strokeColors.length).toBeGreaterThan(0);
    for (const color of strokeColors) expect(color).toBe(palette('ink').color);
  });
});
