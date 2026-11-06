import { describe, expect, it } from 'vitest';
import { type StrokeOptions, type Tuning, Pen } from '@/pen/pen';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { windowPalette } from '@/styling/colourway';
import { execute, type FillMark, type StrokeMark } from './scene';
import { makeProjection } from '@/motion/projection';
import type { CasementPlan, ShellPlan, SlidingPlan } from './window-shell';
import { drawCasement } from './window-shell/drawCasement';
import { drawSliding } from './window-shell/drawSliding';
import { BOX, SHELL_Z, expandShell, innerRect, windowMarks } from './window-shell';
import { drawWindow } from './window';
import { expandCurtain } from './curtain';
import { CENTRE_EYE } from '@/motion/projection';

class RecordingPen extends Pen {
  traces: string[] = [];
  strokes: { name: string; pts: { x: number; y: number }[] }[] = [];

  private readonly stub: CanvasRenderingContext2D = {
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    fill() {},
  } as unknown as CanvasRenderingContext2D;

  constructor(seed: number, tuning: Tuning = { ...DEFAULT_TUNING }) {
    super(tuning, seed);
  }

  stroke(_ctx: CanvasRenderingContext2D, pts: Parameters<Pen['stroke']>[1], opts: StrokeOptions): void {
    this.traces.push(opts.name);
    this.strokes.push({ name: opts.name, pts: pts.map((p) => ({ x: p.x, y: p.y })) });
    super.stroke(this.stub, pts, opts);
  }

  dot(_ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, name: string): void {
    this.traces.push(name);
    super.dot(this.stub, cx, cy, r, name, '#000');
  }

  fill(_ctx: CanvasRenderingContext2D, pts: Parameters<Pen['fill']>[1], opts: { alpha: number }): void {
    this.washes.push(opts.alpha);
    this.fills.push({ alpha: opts.alpha, pts: pts.map((p) => ({ x: p.x, y: p.y })) });
    super.fill(this.stub, pts, { ...opts, color: '#000' });
  }

  washes: number[] = [];
  fills: { alpha: number; pts: { x: number; y: number }[] }[] = [];
}

const NOOP_CTX = {} as CanvasRenderingContext2D;
const PALETTE = windowPalette(0, { ink: '#000000', paper: '#ffffff' });
const CLOTH_ALPHAS = (['fabric', 'shade', 'blind'] as const).map((role) => PALETTE(role).alpha);
const isCloth = (alpha: number) => CLOTH_ALPHAS.some((a) => Math.abs(alpha - a) < 1e-9);

describe('drawWindow', () => {
  it('draws without throwing across a seed sweep', () => {
    for (let i = 0; i < 300; i++) {
      const pen = new RecordingPen(5000 + i * 104729);
      expect(() => drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE)).not.toThrow();
    }
  });

  it('emits strokes for every seed', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 9000 + i * 7919;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE);
      expect(pen.traces.length).toBeGreaterThan(0);
    }
  });

  it('never repeats a trace name within one window', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 12000 + i * 104729;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE);
      expect(new Set(pen.traces).size).toBe(pen.traces.length);
    }
  });

  it('borders its panes and never draws a handle', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 15000 + i * 104729;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE);
      const { archetype } = expandShell(seed);
      const prefix = archetype === 'picture' ? 'picture-' : archetype === 'sliding' ? 'slide-' : 'leaf-';
      const paneTrace = pen.traces.find((t) => t.startsWith(prefix));
      expect(paneTrace).toBeDefined();
      expect(paneTrace).toMatch(/-(top|bottom|left|right)$/);
      expect(pen.traces.some((t) => t.includes('handle'))).toBe(false);
    }
  });

  it('washes at least one pane of glass in every window', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 17000 + i * 104729;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE);
      expect(pen.washes.length).toBeGreaterThanOrEqual(1);
    }
  });

  // The frame lies on the wall, so projection must leave its scale at 1 — a
  // SHELL_Z sort key reaching the points would shrink and mirror the frame
  // through the origin while the glass stays true.
  it('draws the frame at wall-plane scale', () => {
    for (let i = 0; i < 100; i++) {
      const seed = 21000 + i * 104729;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE);
      const top = pen.strokes.find((s) => s.name === 'frame-outer-top');
      expect(top).toBeDefined();
      const extent = Math.max(...top!.pts.map((p) => Math.abs(p.x)));
      expect(extent).toBeGreaterThan(BOX.halfW - 0.05);
    }
  });

  // Same invariant for the glass: the panes' fills are emitted from the wall
  // plane (or a hair off it, on a slider's front track) and must land there —
  // a SHELL_Z sort key reaching the points would flip a pane through the
  // origin and crush its span.
  it('draws the glass at wall-plane scale', () => {
    for (let i = 0; i < 100; i++) {
      const seed = 27000 + i * 104729;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE);
      // Panes are the only fills drawn at exactly the glass wash — the cloth
      // fills land strictly between the glass and cloth strengths.
      const washes = pen.fills.filter((f) => f.alpha === PALETTE('glass').alpha);
      expect(washes.length).toBeGreaterThanOrEqual(1);
      for (const wash of washes) {
        const xs = wash.pts.map((p) => p.x);
        // The narrowest pane at wall scale: a swung one-two casement leaf,
        // foreshortened by the swing's cosine (~0.30).
        expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.2);
      }
    }
  });
});

describe('the swung casement leaf', () => {
  const plan: CasementPlan = {
    archetype: 'casement',
    layout: 'one-two',
    open: 'open',
    thicknessJitter: 1,
    faceWidth: 0.07,
    sill: 'flat',
    awning: 'none',
    shutters: 'none',
    box: 'none',
  };

  it('foreshortens by the swing and stands out of the wall at the swing depth', () => {
    const marks = drawCasement(plan);
    const free = marks.find((m) => m.kind === 'stroke' && m.name === 'leaf-0-right');
    const wash = marks.find((m): m is FillMark => m.kind === 'fill' && m.z === SHELL_Z.open);
    expect(free).toBeDefined();
    expect(wash).toBeDefined();
    const hingeX = wash!.pts[0].x;
    const freeX = free!.pts[0].x;
    const expectedDepth = Math.abs(freeX - hingeX) * Math.tan(0.9);
    for (const p of wash!.pts) {
      if (p.x === hingeX) expect(p.z).toBe(0);
      else expect(p.z).toBeCloseTo(expectedDepth, 12);
    }
    expect(free!.pts[0].z).toBeCloseTo(expectedDepth, 12);
    for (const rail of ['leaf-0-top', 'leaf-0-bottom']) {
      const stroke = marks.find((m): m is StrokeMark => m.kind === 'stroke' && m.name === rail);
      expect(stroke).toBeDefined();
      expect(stroke!.pts[0]).toEqual({ x: hingeX, y: stroke!.pts[0].y, z: 0 });
      expect(stroke!.pts[1].z).toBeCloseTo(expectedDepth, 12);
    }
    expect(freeX).toBeGreaterThan(-0.73);
    expect(freeX).toBeLessThan(0);
    expect(wash!.pts.some((p) => p.y < -0.4)).toBe(true);
    expect(wash!.pts.some((p) => p.y > 0.4)).toBe(true);
  });

  it('carries its glass as a wash that sorts above the frame', () => {
    const marks = drawCasement(plan);
    const wash = marks.find((m): m is FillMark => m.kind === 'fill' && m.z === SHELL_Z.open);
    expect(wash).toBeDefined();
    expect(wash!.role).toBe('glass');
  });

  it('keeps the fixed pane flat on the wall', () => {
    const marks = drawCasement(plan);
    const fixed = marks.find((m): m is FillMark => m.kind === 'fill' && m.z === SHELL_Z.glass);
    expect(fixed).toBeDefined();
  });
});

describe('the sliding panels', () => {
  const base: SlidingPlan = {
    archetype: 'sliding',
    layout: 'two',
    open: 'open',
    slideSide: 'left',
    thicknessJitter: 1,
    faceWidth: 0.07,
    sill: 'flat',
    awning: 'none',
    shutters: 'none',
    box: 'none',
  };

  it('stays inside the frame and visibly clear at every open state', () => {
    const { left, right } = innerRect(base.faceWidth);
    for (const layout of ['two', 'three', 'transom'] as const) {
      for (const slideSide of ['left', 'right'] as const) {
        for (const open of ['closed', 'half-open', 'open'] as const) {
          const marks = drawSliding({ ...base, layout, slideSide, open });
          const fills = marks.filter(
            (m): m is FillMark => m.kind === 'fill' && m.z === SHELL_Z.glass,
          );
          expect(fills.length).toBeGreaterThanOrEqual(2);
          for (const fill of fills) {
            const xs = fill.pts.map((p) => p.x);
            expect(Math.min(...xs)).toBeGreaterThanOrEqual(left - 1e-9);
            expect(Math.max(...xs)).toBeLessThanOrEqual(right + 1e-9);
            const strip: number[] = [];
            for (const p of fill.pts) if (p.y === fill.pts[0].y) strip.push(p.x);
            expect(Math.max(...strip) - Math.min(...strip)).toBeGreaterThanOrEqual(0.12);
          }
        }
      }
    }
  });
  it('fills the frame face in four strips on its own mullion role', () => {
    const seed = 4200;
    const plan = expandShell(seed);
    const face = windowMarks(plan).filter(
      (m): m is FillMark => m.kind === 'fill' && m.role === 'mullion',
    );
    expect(face.length).toBe(4);
    for (const strip of face) expect(strip.z).toBe(SHELL_Z.frame);
    const { left, top, right, bottom } = innerRect(plan.faceWidth);
    for (const strip of face) {
      for (const p of strip.pts) {
        const inHole = p.x > left && p.x < right && p.y > top && p.y < bottom;
        expect(inHole).toBe(false);
      }
    }
    const corners: [number, number][] = [
      [-BOX.halfW, -BOX.halfH],
      [BOX.halfW, -BOX.halfH],
      [BOX.halfW, BOX.halfH],
      [-BOX.halfW, BOX.halfH],
    ];
    for (const [cx, cy] of corners) {
      expect(
        face.some((f) => f.pts.some((p) => Math.abs(p.x - cx) < 1e-9 && Math.abs(p.y - cy) < 1e-9)),
        `corner ${cx},${cy}`,
      ).toBe(true);
    }
  });
});

describe('the tenant behind the glass', () => {
  it('draws the curtain when the DNA stream rolls one, never when bare', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 31000 + i * 104729;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE);
      const cloth = pen.fills.filter((f) => isCloth(f.alpha));
      expect(cloth.length > 0).toBe(expandCurtain(seed).present);
    }
  });

  it('leaves the shell-only assembly bare: windowMarks draws no cloth', () => {
    for (let i = 0; i < 100; i++) {
      const seed = 35000 + i * 104729;
      const pen = new RecordingPen(seed);
      execute(windowMarks(expandShell(seed)), pen, NOOP_CTX, PALETTE, makeProjection(CENTRE_EYE));
      expect(pen.fills.some((f) => isCloth(f.alpha))).toBe(false);
    }
  });
});

describe('tuning immutability', () => {
  it('does not mutate the caller tuning object', () => {
    const tuning: Tuning = { ...DEFAULT_TUNING };
    const snapshot = { ...tuning };
    const pen = new RecordingPen(42, tuning);
    drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE);
    expect(tuning).toEqual(snapshot);
  });
});
