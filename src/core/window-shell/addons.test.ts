import { describe, expect, it } from 'vitest';
import type { SlidingPlan } from './archetypes';
import { drawAwning } from './drawAwning';
import { drawShutters } from './drawShutters';
import { drawSill } from './drawSill';
import { drawWindowBox } from './drawWindowBox';
import { innerRect } from './shell';

const BASE: SlidingPlan = {
  archetype: 'sliding',
  layout: 'two',
  open: 'closed',
  slideSide: 'left',
  thicknessJitter: 1,
  faceWidth: 0.07,
  sill: 'flat',
  awning: 'none',
  shutters: 'none',
  box: 'none',
};

const plan = (over: Partial<SlidingPlan>): SlidingPlan => ({ ...BASE, ...over });

describe('sill kinds', () => {
  it('emits nothing for a flush sill', () => {
    expect(drawSill(plan({ sill: 'flush' }))).toEqual([]);
  });

  it('emits sill marks for flat and bracketed', () => {
    expect(drawSill(plan({ sill: 'flat' })).length).toBeGreaterThan(0);
    const bracketed = drawSill(plan({ sill: 'bracketed' }));
    expect(bracketed.length).toBeGreaterThan(0);
    expect(bracketed.some((m) => m.kind === 'stroke' && m.name === 'sill-bracket-l')).toBe(true);
  });
});

describe('masses', () => {
  it('emit nothing when rolled none', () => {
    expect(drawAwning(plan({ awning: 'none' }))).toEqual([]);
    expect(drawShutters(plan({ shutters: 'none' }))).toEqual([]);
    expect(drawWindowBox(plan({ box: 'none' }))).toEqual([]);
  });

  it('emit marks for every drawn kind, within the add-on reach bounds', () => {
    const slope = drawAwning(plan({ awning: 'slope' }));
    const canopy = drawAwning(plan({ awning: 'canopy' }));
    const louvered = drawShutters(plan({ shutters: 'louvered' }));
    const paneled = drawShutters(plan({ shutters: 'paneled' }));
    const box = drawWindowBox(plan({ box: 'box' }));
    expect(slope.length).toBeGreaterThan(0);
    expect(canopy.length).toBeGreaterThan(0);
    expect(louvered.length).toBeGreaterThan(0);
    expect(paneled.length).toBeGreaterThan(0);
    expect(box.length).toBeGreaterThan(0);
    const marks = [...slope, ...canopy, ...louvered, ...paneled, ...box];
    for (const mark of marks) {
      for (const p of mark.pts) {
        expect(Math.abs(p.x)).toBeLessThanOrEqual(1.151);
        expect(p.y).toBeGreaterThanOrEqual(-0.901);
        expect(p.y).toBeLessThanOrEqual(0.851);
      }
    }
  });

  it('fills the awning fabric with the occluding role', () => {
    for (const kind of ['slope', 'canopy'] as const) {
      const fill = drawAwning(plan({ awning: kind })).find((m) => m.kind === 'fill');
      expect(fill).toBeDefined();
      expect(fill!.role).toBe('awning');
    }
  });

  it('fills the box front with the occluding role and overlaps the sill face', () => {
    const fill = drawWindowBox(plan({ box: 'box' })).find((m) => m.kind === 'fill');
    expect(fill).toBeDefined();
    expect(fill!.role).toBe('box');
    // The sill's front edge (y 0.62 flat) falls inside the box's span, so the
    // planter reads as standing in front of the sill.
    const ys = fill!.pts.map((p) => p.y);
    expect(Math.min(...ys)).toBeLessThan(0.62);
    expect(Math.max(...ys)).toBeGreaterThan(0.62);
  });

  it('draws the pair as two opaque boxes in a row, unique traces', () => {
    const marks = drawWindowBox(plan({ box: 'pair' }));
    const fills = marks.filter((m) => m.kind === 'fill');
    expect(fills.length).toBe(2);
    expect(fills.every((f) => f.role === 'box')).toBe(true);
    const xs = marks.flatMap((m) => m.pts.map((p) => p.x));
    expect(Math.max(...xs.map(Math.abs))).toBeLessThanOrEqual(0.79);
    const names = marks.filter((m) => m.kind !== 'fill').map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('fills the shutters with the occluding role, swung clear of the glass', () => {
    for (const kind of ['louvered', 'paneled'] as const) {
      const marks = drawShutters(plan({ shutters: kind }));
      const fill = marks.find((m) => m.kind === 'fill');
      expect(fill).toBeDefined();
      expect(fill!.role).toBe('mullion');
      const { left, right } = innerRect(BASE.faceWidth);
      for (const mark of marks) {
        for (const p of mark.pts) {
          expect(p.x <= left || p.x >= right).toBe(true);
        }
      }
    }
  });
});
