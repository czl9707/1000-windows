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
