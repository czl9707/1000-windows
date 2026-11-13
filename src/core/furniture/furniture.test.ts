import { describe, expect, it } from 'vitest';
import { fork } from '@/core/randomness/rng';
import { ANCHOR_RANGE, WIDTH_JITTER, KINDS } from './catalogue';
import { expandFurniture } from './furniture';

describe('expandFurniture', () => {
  it('rolls five slots, one per plane, and the same seed rolls the same plan', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 61000 + i * 104729;
      const a = expandFurniture(fork(seed, 'dna'));
      const b = expandFurniture(fork(seed, 'dna'));
      expect(a).toEqual(b);
      expect(a.planes.length).toBe(5);
      const kinds = KINDS.map((k) => k.value);
      for (const slot of a.planes) {
        if (slot.present) expect(kinds).toContain(slot.kind);
        else expect(slot).toEqual({ present: false });
      }
    }
  });

  it('rolls a present slot within its ranges', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 64000 + i * 104729;
      const plan = expandFurniture(fork(seed, 'dna'));
      for (const slot of plan.planes) {
        if (!slot.present) continue;
        expect(slot.widthJitter).toBeGreaterThanOrEqual(WIDTH_JITTER.min);
        expect(slot.widthJitter).toBeLessThanOrEqual(WIDTH_JITTER.max);
        expect(slot.anchorX).toBeGreaterThan(ANCHOR_RANGE.min);
        expect(slot.anchorX).toBeLessThan(ANCHOR_RANGE.max);
      }
    }
  });

  it('thins the room as it recedes: near planes stand furnished more often than deep ones', () => {
    const occupancy = [0, 0, 0, 0, 0];
    const seeds = 2000;
    for (let i = 0; i < seeds; i++) {
      const plan = expandFurniture(fork(70000 + i * 31337, 'dna'));
      plan.planes.forEach((slot, planeIndex) => {
        if (slot.present) occupancy[planeIndex]++;
      });
    }
    for (let planeIndex = 0; planeIndex < 4; planeIndex++) {
      expect(occupancy[planeIndex]).toBeGreaterThan(occupancy[planeIndex + 1]);
    }
  });

  it('weights the TV toward the near planes', () => {
    const near: number[] = [0, 0];
    const deep: number[] = [0, 0, 0];
    for (let i = 0; i < 4000; i++) {
      const plan = expandFurniture(fork(74000 + i * 31337, 'dna'));
      plan.planes.forEach((slot, planeIndex) => {
        if (!slot.present || slot.kind !== 'tvStand') return;
        if (planeIndex < 2) near[planeIndex]++;
        else deep[planeIndex - 2]++;
      });
    }
    // The near planes' pair holds more TVs than the middle pair of the deep
    // three, the bias visible above the occupancy's own near-lean.
    expect(near[0] + near[1]).toBeGreaterThan(deep[0] + deep[1]);
  });
});
