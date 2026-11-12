import { describe, expect, it } from 'vitest';
import { fork } from '@/core/randomness/rng';
import { expandCurtain } from '@/core/curtain';
import { expandSill } from './sill';
import { SIDES, KINDS, WIDTH_JITTER, BOOK_COUNT_RANGE, PLANT_KINDS } from './catalogue';

// The append invariant through the live producers: the sill reads exactly
// where the curtain left the stream — a curtain roll added later moves the
// sill's draws with it, and neither layer ever shifts the other. The
// expectation replays the block by hand off a fresh fork.
describe('expandSill', () => {
  it('rolls the kind only on an anchored sill — books 3 / mug 3 / jars 2 / plant 4 / clock 1', () => {
    for (const seed of [1, 42, 2000, 1335613256, 7, 99, 123456]) {
      const rng = fork(seed, 'dna');
      expandCurtain(rng);
      const sill = expandSill(rng);
      const exp = fork(seed, 'dna');
      expandCurtain(exp);
      const side = exp.weighted(SIDES);
      if (side === 'none') {
        expect(sill, `seed ${seed}`).toEqual({ present: false });
        continue;
      }
      const kind = exp.weighted(KINDS);
      expect(sill, `seed ${seed}`).toEqual({
        present: true,
        side,
        kind,
        widthJitter: exp.float(WIDTH_JITTER.min, WIDTH_JITTER.max),
        bookCount: Math.floor(exp.float(BOOK_COUNT_RANGE.min, BOOK_COUNT_RANGE.max + 1)),
        plantKind: exp.weighted(PLANT_KINDS),
      });
    }
  });
});
