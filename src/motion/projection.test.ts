import { describe, expect, it } from 'vitest';
import { project, scaleAt } from './projection';

describe('project', () => {
  it('leaves points on the wall plane unchanged', () => {
    const pts = [
      { x: -0.8, y: -0.5, z: 0 },
      { x: 0.8, y: 0.5, z: 0 },
    ];
    expect(project(pts)).toEqual([
      { x: -0.8, y: -0.5 },
      { x: 0.8, y: 0.5 },
    ]);
  });

  it('pulls nearer points outward from the origin', () => {
    const flat = project([{ x: 0.4, y: 0.2, z: 0 }])[0];
    const near = project([{ x: 0.4, y: 0.2, z: 1 }])[0];
    expect(Math.abs(near.x)).toBeGreaterThan(Math.abs(flat.x));
    expect(Math.abs(near.y)).toBeGreaterThan(Math.abs(flat.y));
  });

  it('keeps the projection stable for the same depth', () => {
    const a = project([{ x: 0.3, y: -0.3, z: 0.5 }])[0];
    const b = project([{ x: 0.3, y: -0.3, z: 0.5 }])[0];
    expect(a).toEqual(b);
  });

  it('defaults to the centred eye', () => {
    const pts = [{ x: 0.3, y: -0.3, z: 0.5 }];
    expect(project(pts)).toEqual(project(pts, { x: 0, y: 0 }));
  });
});

describe('project with an eye offset', () => {
  it('pins the wall plane: the eye never moves z = 0', () => {
    const pts = [
      { x: -0.8, y: -0.5, z: 0 },
      { x: 0.8, y: 0.5, z: 0 },
    ];
    expect(project(pts, { x: 2.4, y: -1.3 })).toEqual(project(pts));
  });

  it('drifts nearer layers away from the screen centre, by depth', () => {
    const eye = { x: 2, y: -1 };
    const near = project([{ x: 0, y: 0, z: 0.4 }], eye)[0];
    const nearer = project([{ x: 0, y: 0, z: 0.8 }], eye)[0];
    expect(near.x).toBeGreaterThan(0);
    expect(near.y).toBeLessThan(0);
    expect(Math.abs(nearer.x)).toBeGreaterThan(Math.abs(near.x));
    expect(Math.abs(nearer.y)).toBeGreaterThan(Math.abs(near.y));
  });

  it('shifts a wall-plane-point-sized scene exactly like its magnification around the eye axis', () => {
    // screen = (p + eye)·s, drawn back in the canvas frame: p·s + eye·(s−1).
    const eye = { x: 1.7, y: -0.6 };
    const p = { x: 0.35, y: 0.2, z: 0.6 };
    const s = scaleAt(p.z);
    const out = project([{ ...p }], eye)[0];
    expect(out.x).toBeCloseTo((p.x + eye.x) * s - eye.x, 12);
    expect(out.y).toBeCloseTo((p.y + eye.y) * s - eye.y, 12);
  });
});

describe('scaleAt', () => {
  it('is exactly 1 on the wall plane', () => {
    expect(scaleAt(0)).toBe(1);
  });

  it('grows with depth, never shrinks below 1', () => {
    expect(scaleAt(0.25)).toBeGreaterThan(1);
    expect(scaleAt(1)).toBeGreaterThan(scaleAt(0.25));
  });
});
