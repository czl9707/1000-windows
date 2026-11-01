import { describe, expect, it } from 'vitest';
import { expandShell } from './shell';
import { ARCHETYPES, ADDONS, SILLS, type ShellPlan } from './archetypes';

describe('expandShell', () => {
  it('returns the same plan for the same seed', () => {
    expect(expandShell(1335613256)).toEqual(expandShell(1335613256));
  });

  it('returns independent plans for different seeds', () => {
    const a = expandShell(1);
    const b = expandShell(2);
    expect(a).not.toEqual(b);
  });
});

describe('archetype catalogue', () => {
  it('carries exactly the decided archetypes with their weights', () => {
    expect(Object.keys(ARCHETYPES).sort()).toEqual(['casement', 'picture', 'sash']);
    expect(ARCHETYPES.sash.weight).toBe(4);
    expect(ARCHETYPES.casement.weight).toBe(3);
    expect(ARCHETYPES.picture.weight).toBe(2);
  });

  it('carries the decided pane layouts with positive weights', () => {
    expect(ARCHETYPES.sash.layouts.map((l) => l.value).sort()).toEqual([
      '1-over-1',
      '2-over-2',
      '6-over-6',
    ]);
    expect(ARCHETYPES.casement.layouts.map((l) => l.value).sort()).toEqual([
      'four-pane',
      'pair',
      'single',
    ]);
    expect(ARCHETYPES.picture.layouts.map((l) => l.value)).toEqual(['single']);
    for (const archetype of Object.values(ARCHETYPES)) {
      for (const layout of archetype.layouts) {
        expect(layout.weight).toBeGreaterThan(0);
      }
    }
  });

  it('marks operability per the decision', () => {
    expect(ARCHETYPES.sash.operable).toBe(true);
    expect(ARCHETYPES.casement.operable).toBe(true);
    expect(ARCHETYPES.picture.operable).toBe(false);
  });
});

describe('add-on catalogues', () => {
  it('carries the decided sills and masses with positive weights', () => {
    expect(SILLS.map((s) => s.value).sort()).toEqual(['bracketed', 'flat', 'flush']);
    expect(ADDONS.awning.map((m) => m.value).sort()).toEqual(['canopy', 'none', 'slope']);
    expect(ADDONS.shutters.map((m) => m.value).sort()).toEqual(['louvered', 'none', 'paneled']);
    expect(ADDONS.box.map((m) => m.value).sort()).toEqual(['box', 'none', 'pair']);
    expect(ADDONS.box.find((m) => m.value === 'none')!.weight).toBe(8);
    expect(ADDONS.box.find((m) => m.value === 'box')!.weight).toBe(1);
    expect(ADDONS.box.find((m) => m.value === 'pair')!.weight).toBe(1);
    for (const list of [SILLS, ADDONS.awning, ADDONS.shutters, ADDONS.box]) {
      for (const item of list) expect(item.weight).toBeGreaterThan(0);
    }
  });
});

describe('shell plans', () => {
  function sweep(count: number): ShellPlan[] {
    return Array.from({ length: count }, (_, i) => expandShell(1000 + i * 7919));
  }

  it('never assigns an open state to a fixed archetype', () => {
    for (const plan of sweep(300)) {
      if (!ARCHETYPES[plan.archetype].operable) {
        expect(plan.open).toBe('closed');
      }
    }
  });

  it('keeps the thickness jitter within ±15%', () => {
    for (const plan of sweep(300)) {
      expect(plan.thicknessJitter).toBeGreaterThanOrEqual(0.85);
      expect(plan.thicknessJitter).toBeLessThanOrEqual(1.15);
    }
  });

  it('keeps the face width within its decided range', () => {
    for (const plan of sweep(300)) {
      expect(plan.faceWidth).toBeGreaterThanOrEqual(0.05);
      expect(plan.faceWidth).toBeLessThanOrEqual(0.09);
    }
  });

  it('rolls a sill and every mass kind on every window', () => {
    const plans = sweep(2000);
    const by = <T extends string>(pick: (p: ShellPlan) => T) => new Set(plans.map(pick));
    expect(by((p) => p.sill)).toEqual(new Set(SILLS.map((s) => s.value)));
    expect(by((p) => p.awning)).toEqual(new Set(ADDONS.awning.map((m) => m.value)));
    expect(by((p) => p.shutters)).toEqual(new Set(ADDONS.shutters.map((m) => m.value)));
    expect(by((p) => p.box)).toEqual(new Set(ADDONS.box.map((m) => m.value)));
  });

  it('rolls a hinge side for every open casement and never otherwise', () => {
    for (const plan of sweep(500)) {
      if (plan.archetype === 'casement' && plan.open !== 'closed') {
        expect(['left', 'right']).toContain(plan.hingeSide);
      } else {
        expect(plan.hingeSide).toBeNull();
      }
    }
  });

  it('reaches every archetype, layout, and open state across a seed sweep', () => {
    const plans = sweep(2000);
    const archetypes = new Set(plans.map((p) => p.archetype));
    expect(archetypes).toEqual(new Set(['sash', 'casement', 'picture']));
    for (const [id, archetype] of Object.entries(ARCHETYPES)) {
      const seen = new Set(
        plans.filter((p) => p.archetype === id).map((p) => p.layout),
      );
      expect(seen).toEqual(new Set(archetype.layouts.map((l) => l.value)));
    }
    const sash = plans.filter((p) => p.archetype === 'sash').map((p) => p.open);
    const casement = plans.filter((p) => p.archetype === 'casement').map((p) => p.open);
    expect(new Set(sash)).toEqual(new Set(['closed', 'half-open', 'open']));
    expect(new Set(casement)).toEqual(new Set(['closed', 'half-open', 'open']));
  });
});
