import { describe, expect, it } from 'vitest';
import { fork } from '@/core/randomness/rng';
import { expandCurtain } from '@/core/curtain';
import { expandSill } from '@/core/sill';
import { expandLight } from './light';
import { FACING_SIDES, KINDS, LIGHTS, SEAT_RANGE } from './catalogue';

// The append invariant through the live producers: the light block reads
// exactly where the sill left the stream. The block never ends early — an
// off window still rolls kind, seat, and facing (the sill's bookCount
// pattern), so a layer appended after this one never shifts.
describe('expandLight', () => {
  it('reads its on roll after the sill block: 2 dark : 1 lit', () => {
    for (const seed of [1, 42, 2000, 1335613256, 7, 99, 123456]) {
      const rng = fork(seed, 'dna');
      expandCurtain(rng);
      expandSill(rng);
      const light = expandLight(rng);
      const exp = fork(seed, 'dna');
      expandCurtain(exp);
      expandSill(exp);
      const on = exp.weighted(LIGHTS);
      expect(light.on, `seed ${seed}`).toBe(on === 'on');
    }
  });

  it('rolls kind, seat, and facing even on an off window, in order', () => {
    for (const seed of [1, 42, 2000, 1335613256, 7, 99, 123456]) {
      const rng = fork(seed, 'dna');
      expandCurtain(rng);
      expandSill(rng);
      const light = expandLight(rng);
      const exp = fork(seed, 'dna');
      expandCurtain(exp);
      expandSill(exp);
      exp.weighted(LIGHTS);
      const kind = exp.weighted(KINDS);
      expect(light, `seed ${seed}`).toEqual({
        on: light.on,
        kind,
        seatX: exp.float(SEAT_RANGE.min, SEAT_RANGE.max),
        facing: exp.weighted(FACING_SIDES),
      });
    }
  });

  // The weights of the street: roughly a third of the houses lit at any
  // hour, no construction favoured.
  it('lights about a third of the street and reaches every kind', () => {
    const kinds = new Set<string>();
    let lit = 0;
    const total = 600;
    for (let i = 0; i < total; i++) {
      const rng = fork(6000 + i * 7919, 'dna');
      expandCurtain(rng);
      expandSill(rng);
      const light = expandLight(rng);
      if (light.on) lit++;
      kinds.add(light.kind);
    }
    expect(lit / total).toBeGreaterThan(0.25);
    expect(lit / total).toBeLessThan(0.42);
    for (const kind of KINDS) expect(kinds.has(kind.value), kind.value).toBe(true);
  });
});
