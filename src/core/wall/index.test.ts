import { describe, expect, it } from 'vitest';
import { Pen } from '@/pen/pen';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { visibleCells } from './grid';
import { drawPatchSlot } from './texture';
import { Wall } from './index';

// Node has no Image: the stipple tile never loads, so the texture pass
// early-returns and the draw exercises the palette plumbing only.
(globalThis as { Image?: unknown }).Image = class {
  complete = false;
};

// A context that records every fillStyle the draw sets, no-ops everything
// else — the wall's base fill is the first fillStyle it lays down.
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

const channels = (css: string) => css.match(/\d+/g)!.map(Number);

describe('Wall.draw', () => {
  const DAY = { ink: 'rgb(33 37 41)', paper: 'rgb(229 222 214)', night: 0, transitionMs: 600 };
  const NIGHT = { ink: 'rgb(255 255 255)', paper: 'rgb(10 10 10)', night: 1, transitionMs: 600 };

  it('paints the wall surface through the fading palette', () => {
    const wall = new Wall(91234);
    const box = { width: 320, height: 200, dpr: 1 };
    const frame = {
      unit: 40,
      eye: { x: 0, y: 0 },
      cells: visibleCells(wall.camera, box.width / 40, box.height / 40),
    };

    wall.draw(recordingCtx().ctx, box, frame, 0, DAY, 0);
    const flip = recordingCtx();
    wall.draw(flip.ctx, box, frame, 0, NIGHT, 0);
    const mid = recordingCtx();
    wall.draw(mid.ctx, box, frame, 1, NIGHT, 300);
    const done = recordingCtx();
    wall.draw(done.ctx, box, frame, 2, NIGHT, 600);

    // The base fill is the first fillStyle each draw lays down; it fades
    // with the same clock the windows fade on, never snapping.
    const base = (r: { fills: string[] }) => channels(r.fills[0]);
    const before = base(flip);
    const half = base(mid);
    const after = base(done);
    expect(after).toEqual(channels(NIGHT.paper));
    for (let i = 0; i < 3; i++) {
      const lo = Math.min(before[i], after[i]);
      const hi = Math.max(before[i], after[i]);
      expect(half[i]).toBeGreaterThan(lo);
      expect(half[i]).toBeLessThan(hi);
    }
    // The texture strokes ride the same pipe: the wall hands the palette's
    // fading ink to the patch pass, never the theme's raw ink. The routing
    // is pinned on the patch pass itself, where the ink is consumed.
    class StrokeRecordingPen extends Pen {
      colors: string[] = [];
      stroke(ctx: CanvasRenderingContext2D, raw: unknown, opts: { color: string }): void {
        this.colors.push(opts.color);
      }
    }
    let strokes = 0;
    for (let slot = 0; strokes === 0 && slot < 24; slot++) {
      const patchPen = new StrokeRecordingPen({ ...DEFAULT_TUNING }, 7000 + slot * 104729);
      drawPatchSlot(recordingCtx().ctx, patchPen, 91234, slot % 6, Math.floor(slot / 6), 'rgb(1 2 3)');
      strokes = patchPen.colors.length;
      for (const c of patchPen.colors) expect(c).toBe('rgb(1 2 3)');
    }
    expect(strokes).toBeGreaterThan(0);
  });
});
