import { describe, expect, it } from 'vitest';
import { type StrokeOptions, type Tuning, Pen } from '@/pen/pen';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { windowPalette } from '@/styling/colourway';
import { execute, type FillMark, type StrokeMark } from './scene';
import { makeProjection } from '@/motion/projection';
import type { ShellPlan } from './window-shell';
import type { CasementPlan, SlidingPlan } from './window-shell/archetypes';
import { drawCasement } from './window-shell/drawCasement';
import { drawSliding } from './window-shell/drawSliding';
import { BOX, SHELL_Z, innerRect } from './window-shell/shell';
import { expandShell, shellMarks } from './window-shell';
import { drawWindow } from './window';
import { expandSill } from './sill';
import { SILL_ITEM_Z } from './sill/catalogue';
import { expandCurtain } from './curtain';
import { expandLight, type LampPlan } from './light';
import { LIGHT_Z } from './light/catalogue';
import { expandFurniture } from './furniture';
import { clothMarks } from './curtain/drawCurtain';
import { fork } from './randomness/rng';
import { windowSceneMarks } from './window';
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
const PALETTE = windowPalette(0, { ink: '#000000', paper: '#ffffff', isNight: false });
const CLOTH_ALPHAS = (['fabric', 'shade'] as const).map((role) => PALETTE(role).alpha);
const isCloth = (alpha: number) => CLOTH_ALPHAS.some((a) => Math.abs(alpha - a) < 1e-9);

describe('drawWindow', () => {
  it('draws without throwing across a seed sweep', () => {
    for (let i = 0; i < 300; i++) {
      const pen = new RecordingPen(5000 + i * 104729);
      expect(() => drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE, false)).not.toThrow();
    }
  });

  it('emits strokes for every seed', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 9000 + i * 7919;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE, false);
      expect(pen.traces.length).toBeGreaterThan(0);
    }
  });

  it('never repeats a trace name within one window', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 12000 + i * 104729;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE, false);
      expect(new Set(pen.traces).size).toBe(pen.traces.length);
    }
  });

  it('borders its panes and never draws a handle', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 15000 + i * 104729;
      const plan = expandShell(seed);
      const traces = shellMarks(plan)
        .filter((m) => m.kind === 'stroke')
        .map((m) => m.name);
      const prefix = plan.archetype === 'picture' ? 'picture-' : plan.archetype === 'sliding' ? 'slide-' : 'leaf-';
      const paneTrace = traces.find((t) => t.startsWith(prefix));
      expect(paneTrace).toBeDefined();
      expect(paneTrace).toMatch(/-(top|bottom|left|right)$/);
      expect(traces.some((t) => t.includes('handle'))).toBe(false);
    }
  });

  it('washes at least one pane of glass in every window', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 17000 + i * 104729;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE, false);
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
      drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE, false);
      const top = pen.strokes.find((s) => s.name === 'frame-outer-top');
      expect(top).toBeDefined();
      const extent = Math.max(...top!.pts.map((p) => Math.abs(p.x)));
      expect(extent).toBeGreaterThan(BOX.halfW - 0.05);
    }
  });

  // Same invariant for the glass: the panes' fills are emitted from the wall
  // plane (or a hair off it, on a slider's front track) and must land there —
  // a SHELL_Z sort key reaching the points would flip a pane through the
  // origin and crush its span. The jars' glass-role fill sorts off the wall
  // and is not a pane; the panes carry SHELL_Z.glass.
  it('draws the glass at wall-plane scale', () => {
    for (let i = 0; i < 100; i++) {
      const seed = 27000 + i * 104729;
      const panes = windowSceneMarks(seed, expandShell(seed), false).filter(
        (m): m is FillMark => m.kind === 'fill' && m.role === 'glass' && m.z >= SHELL_Z.glass,
      );
      expect(panes.length).toBeGreaterThanOrEqual(1);
      for (const pane of panes) {
        const xs = pane.pts.map((p) => p.x);
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

  it('foreshortens by the swing, stands out of the wall at the swing depth, carries its glass as a wash that sorts above the frame, and keeps the fixed pane flat on the wall', () => {
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
    expect(wash!.role).toBe('glass');
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
    const face = shellMarks(plan).filter(
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
  const CLOTH_ROLES = ['fabric', 'shade', 'blind'] as const;

  it('draws the curtain when the DNA stream rolls one, never when bare', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 31000 + i * 104729;
      const curtain = expandCurtain(fork(seed, 'dna'));
      const cloth = clothMarks(curtain, innerRect(expandShell(seed).faceWidth)).filter(
        (m): m is FillMark => m.kind === 'fill' && (CLOTH_ROLES as readonly string[]).includes(m.role),
      );
      expect(cloth.length > 0).toBe(curtain.present);
    }
  });

  it('leaves the shell-only assembly bare: shellMarks draws no cloth', () => {
    for (let i = 0; i < 100; i++) {
      const seed = 35000 + i * 104729;
      const pen = new RecordingPen(seed);
      execute(shellMarks(expandShell(seed)), pen, NOOP_CTX, PALETTE, makeProjection(CENTRE_EYE));
      expect(pen.fills.some((f) => isCloth(f.alpha))).toBe(false);
    }
  });

  it('sets the sill item on the ledge iff the stream rolls one, sorting under the wash', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 41000 + i * 104729;
      const rng = fork(seed, 'dna');
      expandCurtain(rng);
      const present = expandSill(rng).present;
      const marks = windowSceneMarks(seed, expandShell(seed), false);
      const onLedge = marks.filter((m) => m.z === SILL_ITEM_Z);
      expect(onLedge.length > 0, `seed ${seed}`).toBe(present);
      expect(onLedge.every((m) => m.pts.every((p) => p.z < 0)), `seed ${seed} behind the wall`).toBe(true);
    }
  });
});

describe('the furniture behind the glass', () => {
  // The furniture block appends after the light on the DNA stream: the roll
  // read from the post-light position must predict whether the assembled
  // scene carries furniture — a block inserted earlier would shift the
  // prediction and the marks apart.
  it('rolls its pieces after the light and draws them between backing and light', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 94000 + i * 104729;
      const rng = fork(seed, 'dna');
      expandCurtain(rng);
      expandSill(rng);
      const lamp: LampPlan = expandLight(rng);
      const plan = expandFurniture(rng, lamp.present);
      const marks = windowSceneMarks(seed, expandShell(seed), false);
      const furniture = marks.filter(
        (m) => m.z < LIGHT_Z && m.z > SHELL_Z.backing,
      );
      expect(furniture.length > 0, `seed ${seed}`).toBe(plan.pieces.length > 0);
      // The room draws back to front under the light block, over the shell
      // backing — the planes' own sort buckets.
      for (const m of furniture) {
        expect(m.z).toBeGreaterThan(SHELL_Z.backing);
        expect(m.z).toBeLessThan(LIGHT_Z);
      }
    }
  });

  // The lamp counts toward the cap regardless of theme, so flipping day to
  // night re-dresses the scene and never re-rolls the room.
  it('keeps the furniture when the theme flips', () => {
    const key = (m: { kind: string; role: string; z: number; pts: { x: number; y: number; z: number }[] }) =>
      `${m.kind}|${m.role}|${m.z}|${m.pts.map((p) => `${p.x},${p.y},${p.z}`).join(';')}`;
    for (let i = 0; i < 100; i++) {
      const seed = 98000 + i * 104729;
      const day = windowSceneMarks(seed, expandShell(seed), false).filter(
        (m) => m.z < LIGHT_Z && m.z > SHELL_Z.backing,
      );
      const night = windowSceneMarks(seed, expandShell(seed), true).filter(
        (m) => m.z < LIGHT_Z && m.z > SHELL_Z.backing,
      );
      expect(day.map(key)).toEqual(night.map(key));
    }
  });
});

describe('the aperture', () => {
  // The frame occludes at the wall plane: whatever the parallax drift
  // carries, the interior clips to the opening after projection — the
  // furniture drawn whole past the opening never lands on the wall around
  // the window, even for a window far off the screen's centre.
  it('keeps the interior inside the opening at an off-centre eye', () => {
    for (let i = 0; i < 100; i++) {
      const seed = 102000 + i * 104729;
      const pen = new RecordingPen(seed);
      drawWindow(NOOP_CTX, pen, PALETTE, { x: 2.5, y: 1.5 }, false);
      const opening = innerRect(expandShell(seed).faceWidth);
      const furn = pen.strokes.filter((s) => s.name.startsWith('furn'));
      for (const s of furn) {
        for (const p of s.pts) {
          expect(p.x).toBeGreaterThanOrEqual(opening.left - 1e-9);
          expect(p.x).toBeLessThanOrEqual(opening.right + 1e-9);
          expect(p.y).toBeGreaterThanOrEqual(opening.top - 1e-9);
          expect(p.y).toBeLessThanOrEqual(opening.bottom + 1e-9);
        }
      }
    }
  });
});

describe('tuning immutability', () => {
  it('does not mutate the caller tuning object', () => {
    const tuning: Tuning = { ...DEFAULT_TUNING };
    const snapshot = { ...tuning };
    const pen = new RecordingPen(42, tuning);
    drawWindow(NOOP_CTX, pen, PALETTE, CENTRE_EYE, false);
    expect(tuning).toEqual(snapshot);
  });
});
