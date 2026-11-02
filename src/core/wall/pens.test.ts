import { describe, expect, it } from 'vitest';
import { pairKey, planPens } from './pens';

describe('planPens', () => {
  it('creates pens for cells entering the viewport', () => {
    const plan = planPens(new Set<string>(), [pairKey(0, 0), pairKey(1, 0)]);
    expect(plan.create).toEqual([pairKey(0, 0), pairKey(1, 0)]);
    expect(plan.drop).toEqual([]);
  });

  it('drops pens for cells that left the viewport', () => {
    const active = new Set([pairKey(0, 0), pairKey(5, 5)]);
    const plan = planPens(active, [pairKey(0, 0)]);
    expect(plan.create).toEqual([]);
    expect(plan.drop).toEqual([pairKey(5, 5)]);
  });

  it('keeps visible pens untouched across frames', () => {
    const active = new Set([pairKey(0, 0)]);
    const plan = planPens(active, [pairKey(0, 0)]);
    expect(plan.create).toEqual([]);
    expect(plan.drop).toEqual([]);
  });

  it('is stable: re-planning the same wanted set after applying the plan plans nothing', () => {
    const active = new Set([pairKey(0, 0)]);
    const first = planPens(active, [pairKey(0, 0), pairKey(2, 1)]);
    const settled = new Set([...active, ...first.create]);
    const second = planPens(settled, [pairKey(0, 0), pairKey(2, 1)]);
    expect(second.create).toEqual([]);
    expect(second.drop).toEqual([]);
  });

  it('matches structurally: the same cell spelled twice is one key, not two', () => {
    const active = new Set([pairKey(0, 0)]);
    const plan = planPens(active, [pairKey(0, 0)]);
    expect(plan.create).toEqual([]);
    expect(plan.drop).toEqual([]);
  });
});
