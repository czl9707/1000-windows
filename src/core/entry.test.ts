import { describe, expect, it } from 'vitest';
import { type StrokeOptions, type Tuning, Pen } from '@/pen/pen';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { makePalette } from '@/styling/roles';
import type { FillMark, StrokeMark } from './scene/mark';
import type { ShellPlan } from './window-shell/archetypes';
import { drawCasement } from './window-shell/drawCasement';
import { BOX, SHELL_Z, expandShell } from './window-shell/shell';
import { drawWindow } from './entry';
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
const PALETTE = makePalette({ ink: '#000', paper: '#fff' });

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

  it('draws a meeting rail on every sash and none on other archetypes', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 15000 + i * 104729;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE);
      const { archetype } = expandShell(seed);
      const hasRail = pen.traces.some((t) => t.startsWith('rail'));
      if (archetype === 'sash') expect(hasRail).toBe(true);
      else expect(hasRail).toBe(false);
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
  // plane and must land there, unshrunk and unmirrored.
  it('draws the glass at wall-plane scale', () => {
    for (let i = 0; i < 100; i++) {
      const seed = 27000 + i * 104729;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE);
      const wash = pen.fills.find((f) => f.alpha < 0.5);
      expect(wash).toBeDefined();
      const extent = Math.max(...wash!.pts.map((p) => Math.abs(p.x)));
      expect(extent).toBeGreaterThan(BOX.halfW - 0.1);
    }
  });
});

describe('the swung casement leaf', () => {
  const plan: ShellPlan = {
    archetype: 'casement',
    layout: 'pair',
    open: 'open',
    hingeSide: 'left',
    thicknessJitter: 1,
    faceWidth: 0.07,
    sill: 'flat',
    awning: 'none',
    shutters: 'none',
    box: 'none',
  };

  it('foreshortens by the swing and stands out of the wall at the swing depth', () => {
    const marks = drawCasement(plan);
    const free = marks.find((m) => m.kind === 'stroke' && m.name === 'casement-leaf-free');
    const wash = marks.find((m): m is FillMark => m.kind === 'fill' && m.z === SHELL_Z.open);
    expect(free).toBeDefined();
    expect(wash).toBeDefined();
    // The hinge edge lies on the wall plane; the free edge stands out of the
    // wall by the swing — its drawn span times the swing's tangent.
    const hingeX = wash!.pts[0].x;
    const freeX = free!.pts[0].x;
    const expectedDepth = Math.abs(freeX - hingeX) * Math.tan(0.9);
    for (const p of wash!.pts) {
      if (p.x === hingeX) expect(p.z).toBe(0);
      else expect(p.z).toBeCloseTo(expectedDepth, 12);
    }
    expect(free!.pts[0].z).toBeCloseTo(expectedDepth, 12);
    // The rails connect the free edge back to the hinge, riding the same
    // depth gradient.
    for (const rail of ['casement-leaf-top', 'casement-leaf-bottom']) {
      const stroke = marks.find((m): m is StrokeMark => m.kind === 'stroke' && m.name === rail);
      expect(stroke).toBeDefined();
      expect(stroke!.pts[0]).toEqual({ x: hingeX, y: stroke!.pts[0].y, z: 0 });
      expect(stroke!.pts[1].z).toBeCloseTo(expectedDepth, 12);
    }
    // The free edge pulled in from the opening's far side, still inside it.
    expect(freeX).toBeGreaterThan(-0.73);
    expect(freeX).toBeLessThan(0);
    // The leaf keeps its full height.
    expect(wash!.pts.some((p) => p.y < -0.4)).toBe(true);
    expect(wash!.pts.some((p) => p.y > 0.4)).toBe(true);
  });

  it('carries its glass as a wash that sorts above the frame', () => {
    const marks = drawCasement(plan);
    const wash = marks.find((m): m is FillMark => m.kind === 'fill' && m.z === SHELL_Z.open);
    expect(wash).toBeDefined();
    expect(wash!.role).toBe('glass');
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
