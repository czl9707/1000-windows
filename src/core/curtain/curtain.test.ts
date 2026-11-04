import { describe, expect, it } from 'vitest';
import { expandCurtain, type CurtainPlan, type CoveredCurtain } from './curtain';
import { fork } from '@/core/randomness/rng';
import {
  COVERAGE_LEVELS,
  DRAPE_SIDES,
  KINDS,
  SLAT_SHARE_RANGE,
  ROD_JITTER,
  WIDTH_JITTER,
  ZONE_CEILING,
} from './catalogue';

describe('curtain catalogue', () => {
  it('carries the decided coverage levels with their weights', () => {
    expect(COVERAGE_LEVELS.map((l) => l.value)).toEqual([0, 0.3, 0.6, 1]);
    expect(COVERAGE_LEVELS.map((l) => l.weight)).toEqual([4, 4, 1, 1]);
  });

  it('carries the decided home kinds with their weights', () => {
    expect(KINDS.map((k) => k.value).sort()).toEqual(['drapes', 'panels', 'roman', 'venetian']);
    const weights = Object.fromEntries(KINDS.map((k) => [k.value, k.weight]));
    expect(weights).toEqual({ panels: 4, drapes: 3, venetian: 2, roman: 2 });
  });

  it('ceils every kind inside the opening', () => {
    for (const kind of KINDS) {
      expect(ZONE_CEILING[kind.value]).toBeGreaterThan(0);
      expect(ZONE_CEILING[kind.value]).toBeLessThanOrEqual(1);
    }
  });
});

describe('expandCurtain', () => {
  function sweep(count: number): CurtainPlan[] {
    return Array.from({ length: count }, (_, i) => expandCurtain(2000 + i * 7919));
  }

  it('returns the same plan for the same seed', () => {
    expect(expandCurtain(1335613256)).toEqual(expandCurtain(1335613256));
  });

  it('returns independent plans for different seeds', () => {
    expect(expandCurtain(1)).not.toEqual(expandCurtain(2));
  });

  it('rolls bare windows at the zero-level weight — about two in five', () => {
    const plans = sweep(4000);
    const bareShare = plans.filter((p) => !p.present).length / plans.length;
    expect(bareShare).toBeGreaterThan(0.3);
    expect(bareShare).toBeLessThan(0.5);
  });

  it('ends the stream at the zero level: a bare plan carries nothing else', () => {
    for (const plan of sweep(2000)) {
      if (!plan.present) expect(Object.keys(plan).sort()).toEqual(['present']);
    }
  });

  it('rolls a covered kind only from the home catalogue', () => {
    for (const plan of sweep(2000)) {
      if (plan.present) {
        expect(KINDS.map((k) => k.value)).toContain(plan.kind);
      }
    }
  });

  it('lands coverage on a level, clamped by the kind zone', () => {
    for (const plan of sweep(4000)) {
      if (plan.present) {
        const allowed = new Set([0.3, Math.min(0.6, ZONE_CEILING[plan.kind]), Math.min(1, ZONE_CEILING[plan.kind])]);
        expect(allowed.has(plan.coverage), `${plan.kind} coverage ${plan.coverage}`).toBe(true);
      }
    }
  });

  it('keeps most covered windows at the smallest dressed level', () => {
    const covered = sweep(4000).filter((p): p is CoveredCurtain => p.present);
    const modest = covered.filter((p) => p.coverage === 0.3).length;
    expect(modest / covered.length).toBeGreaterThan(0.5);
  });

  it('reads the stream in catalogue order, leaving later draws in step for appended layers', () => {
    for (const seed of [1, 42, 2000, 1335613256]) {
      const plan = expandCurtain(seed);
      const rng = fork(seed, 'dna');
      const level = rng.weighted(COVERAGE_LEVELS);
      expect(plan.present, `seed ${seed}`).toBe(level !== 0);
      if (!plan.present) continue;
      const kind = rng.weighted(KINDS);
      expect(plan.kind).toBe(kind);
      expect(plan.coverage).toBe(Math.min(level, ZONE_CEILING[kind]));
      expect(plan.rodY).toBe(rng.float(ROD_JITTER.min, ROD_JITTER.max));
      expect(plan.widthJitter).toBe(rng.float(WIDTH_JITTER.min, WIDTH_JITTER.max));
      expect(plan.drapeSide).toBe(rng.weighted(DRAPE_SIDES));
      expect(plan.slatShare).toBe(
        rng.outliers(SLAT_SHARE_RANGE.min, SLAT_SHARE_RANGE.max, SLAT_SHARE_RANGE.outlierMin, SLAT_SHARE_RANGE.outlierMax),
      );
    }
  });

  it('draws the shell stream untouched by the curtain rolls', () => {
    const drawn = (seed: number) => {
      const rng = fork(seed, 'shell');
      return Array.from({ length: 8 }, () => rng.float(0, 1));
    };
    for (const seed of [1, 42, 1335613256]) {
      const before = drawn(seed);
      expandCurtain(seed);
      expect(drawn(seed)).toEqual(before);
    }
  });

  it('jitters the rod height and cloth widths within their bands', () => {
    for (const plan of sweep(2000)) {
      if (plan.present) {
        expect(plan.rodY).toBeGreaterThanOrEqual(-0.02);
        expect(plan.rodY).toBeLessThanOrEqual(0.02);
        expect(plan.widthJitter).toBeGreaterThanOrEqual(0.9);
        expect(plan.widthJitter).toBeLessThanOrEqual(1.1);
      }
    }
  });

  it('rolls a drape side only ever left or right', () => {
    for (const plan of sweep(2000)) {
      if (plan.present) expect(['left', 'right']).toContain(plan.drapeSide);
    }
  });

  it('keeps the blind slat share in its band: mostly light, a rare heavy blind', () => {
    for (const plan of sweep(2000)) {
      if (plan.present) {
        expect(plan.slatShare).toBeGreaterThanOrEqual(0);
        expect(plan.slatShare).toBeLessThanOrEqual(0.8);
      }
    }
    const heavy = sweep(4000).filter((p) => p.present && p.slatShare > 0.35);
    expect(heavy.length).toBeGreaterThan(0);
  });
});
