// Recording machinery shared by the wall module's suites: a context that
// no-ops everything but records every fillStyle, a pen that records every
// stroke colour, and the Image stub for the node test environment (the
// stipple tile never loads, so the texture pass early-returns and the
// draws exercise the colour plumbing only).
import { Pen } from '@/pen/pen';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { PenLedger } from './ledger';

export function stubWallImage(): void {
  (globalThis as { Image?: unknown }).Image = class {
    complete = false;
  };
}

export function recordingCtx(): { ctx: CanvasRenderingContext2D; fills: string[] } {
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

export class StrokeRecordingPen extends Pen {
  colors: string[] = [];
  private readonly sink?: (color: string) => void;

  constructor(tuning: typeof DEFAULT_TUNING, seed: number, sink?: (color: string) => void) {
    super(tuning, seed);
    this.sink = sink;
  }

  stroke(ctx: CanvasRenderingContext2D, raw: unknown, opts: { color: string }): void {
    this.colors.push(opts.color);
    this.sink?.(opts.color);
  }
}

export function recordingSlotPens(seedOf: (key: string) => number): {
  pens: PenLedger;
  colors: string[];
} {
  const colors: string[] = [];
  const pens = new PenLedger(
    (key) => new StrokeRecordingPen({ ...DEFAULT_TUNING }, seedOf(key), (c) => colors.push(c)),
  );
  return { pens, colors };
}
