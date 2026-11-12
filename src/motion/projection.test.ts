import { describe, expect, it } from 'vitest';
import { CENTRE_EYE, makeProjection } from './projection';

describe('makeProjection', () => {
  it('leaves points on the wall plane unchanged', () => {
    const pts = [
      { x: -0.8, y: -0.5, z: 0 },
      { x: 0.8, y: 0.5, z: 0 },
    ];
    expect(makeProjection(CENTRE_EYE).project(pts)).toEqual([
      { x: -0.8, y: -0.5 },
      { x: 0.8, y: 0.5 },
    ]);
  });

  it('pulls nearer points outward from the origin', () => {
    const view = makeProjection(CENTRE_EYE);
    const flat = view.project([{ x: 0.4, y: 0.2, z: 0 }])[0];
    const near = view.project([{ x: 0.4, y: 0.2, z: 1 }])[0];
    expect(Math.abs(near.x)).toBeGreaterThan(Math.abs(flat.x));
    expect(Math.abs(near.y)).toBeGreaterThan(Math.abs(flat.y));
  });

  it('centres the eye on the literal zero offset', () => {
    const pts = [{ x: 0.3, y: -0.3, z: 0.5 }];
    expect(makeProjection(CENTRE_EYE).project(pts)).toEqual(
      makeProjection({ x: 0, y: 0 }).project(pts),
    );
  });

  it('pins the wall plane: the eye never moves z = 0', () => {
    const pts = [
      { x: -0.8, y: -0.5, z: 0 },
      { x: 0.8, y: 0.5, z: 0 },
    ];
    expect(makeProjection({ x: 2.4, y: -1.3 }).project(pts)).toEqual(
      makeProjection(CENTRE_EYE).project(pts),
    );
  });

  it('drifts nearer layers away from the screen centre, by depth', () => {
    const view = makeProjection({ x: 2, y: -1 });
    const near = view.project([{ x: 0, y: 0, z: 0.4 }])[0];
    const nearer = view.project([{ x: 0, y: 0, z: 0.8 }])[0];
    expect(near.x).toBeGreaterThan(0);
    expect(near.y).toBeLessThan(0);
    expect(Math.abs(nearer.x)).toBeGreaterThan(Math.abs(near.x));
    expect(Math.abs(nearer.y)).toBeGreaterThan(Math.abs(near.y));
  });

  it('shifts a wall-plane-point-sized scene exactly like its magnification around the eye axis', () => {
    const eye = { x: 1.7, y: -0.6 };
    const p = { x: 0.35, y: 0.2, z: 0.6 };
    const view = makeProjection(eye);
    const s = view.scaleAt(p.z);
    const out = view.project([{ ...p }])[0];
    expect(out.x).toBeCloseTo((p.x + eye.x) * s - eye.x, 12);
    expect(out.y).toBeCloseTo((p.y + eye.y) * s - eye.y, 12);
  });

  it('scales widths by the depth of the point, exactly 1 on the wall plane', () => {
    const view = makeProjection(CENTRE_EYE);
    expect(view.scaleAt(0)).toBe(1);
    expect(view.scaleAt(0.25)).toBeGreaterThan(1);
    expect(view.scaleAt(1)).toBeGreaterThan(view.scaleAt(0.25));
  });

  it('honours an explicit focal for the demo slider', () => {
    const view = makeProjection(CENTRE_EYE, 6);
    expect(view.scaleAt(1)).toBeCloseTo(1.2, 12);
  });
});
