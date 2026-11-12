import { describe, expect, it } from 'vitest';
import { expandShell } from './shell';
import {
  ARCHETYPES,
  ADDONS,
  SILLS,
  type CasementPlan,
  type ShellPlan,
  type SlidingPlan,
} from './archetypes';

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
  it('carries the decided pane layouts with positive weights', () => {
    expect(ARCHETYPES.sliding.layouts.map((l) => l.value).sort()).toEqual([
      'three',
      'transom',
      'two',
    ]);
    expect(ARCHETYPES.casement.layouts.map((l) => l.value).sort()).toEqual([
      'one-two',
      'pair',
    ]);
    expect(ARCHETYPES.picture.layouts.map((l) => l.value)).toEqual(['single']);
    for (const archetype of Object.values(ARCHETYPES)) {
      for (const layout of archetype.layouts) {
        expect(layout.weight).toBeGreaterThan(0);
      }
    }
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

  it('gives an open state to the operable archetypes only', () => {
    for (const plan of sweep(300)) {
      if (plan.archetype === 'picture') {
        expect('open' in plan).toBe(false);
      } else {
        expect(plan.open).toBeDefined();
      }
    }
  });

  it('rolls sills, masses, shutters, slide sides, archetypes, layouts, and open states over a seed sweep', () => {
    const plans = sweep(2000);
    const by = <T extends string>(pick: (p: ShellPlan) => T) => new Set(plans.map(pick));
    expect(by((p) => p.sill)).toEqual(new Set(SILLS.map((s) => s.value)));
    expect(by((p) => p.awning)).toEqual(new Set(ADDONS.awning.map((m) => m.value)));
    expect(by((p) => p.shutters)).toEqual(new Set(ADDONS.shutters.map((m) => m.value)));
    expect(by((p) => p.box)).toEqual(new Set(ADDONS.box.map((m) => m.value)));
    for (const plan of plans) {
      if (plan.archetype !== 'sliding') {
        expect(plan.shutters).toBe('none');
      }
    }
    for (const plan of plans) {
      expect('slideSide' in plan).toBe(plan.archetype === 'sliding');
      if (plan.archetype === 'sliding') {
        expect(['left', 'right']).toContain(plan.slideSide);
      }
    }
    const archetypes = new Set(plans.map((p) => p.archetype));
    expect(archetypes).toEqual(new Set(['sliding', 'casement', 'picture']));
    for (const [id, archetype] of Object.entries(ARCHETYPES)) {
      const seen = new Set(
        plans.filter((p) => p.archetype === id).map((p) => p.layout),
      );
      expect(seen).toEqual(new Set(archetype.layouts.map((l) => l.value)));
    }
    const operable = plans.filter(
      (p): p is SlidingPlan | CasementPlan => p.archetype !== 'picture',
    );
    for (const id of ['sliding', 'casement'] as const) {
      const opens = operable.filter((p) => p.archetype === id).map((p) => p.open);
      expect(new Set(opens)).toEqual(new Set(['closed', 'half-open', 'open']));
    }
  });
});
