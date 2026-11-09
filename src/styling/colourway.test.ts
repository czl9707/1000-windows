import { describe, expect, it } from 'vitest';
import { fork } from '@/core/randomness/rng';
import { type ResolvedColor } from './roles';
import { COLOURWAYS, LIGHTWAYS, DEFAULT_COLOURWAY_TUNING, windowPalette, type Colourway } from './colourway';
import { cssToOklch, type Oklch } from './oklch';

// The grounds match the page's two themes; the ink values are whatever the
// tokens hold — tinted roles must not depend on them.
const LIGHT = { ink: 'rgb(33 37 41)', paper: 'rgb(229 222 214)' };
const DARK = { ink: 'rgb(233 236 239)', paper: 'rgb(0 0 0)' };
const TINTED = ['mullion', 'fabric', 'shade', 'blind', 'awning', 'sill', 'box'] as const;
// The cloth washes land at their base alpha compounded with the half-strength
// pooling echo: fabric/shade 1 − 0.86 × 0.93, blind 1 − 0.84 × 0.92. Every
// painted surface goes down opaque — its fill exists to hide the wall and the
// layers behind it.
const WASH_ALPHAS = { fabric: 0.2002, shade: 0.2002, blind: 0.2272 } as const;
const PAINTED = ['mullion', 'awning', 'awningThin', 'sill', 'box'] as const;

describe('the colourway catalogue', () => {
  it('weights sum to one', () => {
    const total = COLOURWAYS.reduce((sum, row) => sum + row.weight, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('names its rows uniquely', () => {
    const names = COLOURWAYS.map((row) => row.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('keeps dyed-looking rows loud but capped', () => {
    for (const row of COLOURWAYS) {
      expect(row.chroma).toBeLessThanOrEqual(0.115);
      // Purple neon territory stays out of every row.
      const inNeonBand = row.hue >= 250 && row.hue < 300;
      expect(inNeonBand).toBe(false);
    }
  });

  it('reaches every row across a seed sweep', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      seen.add(familyOf(cssToOklch(windowPalette(2000 + i * 7919, LIGHT)('fabric').color)).name);
    }
    for (const row of COLOURWAYS) expect(seen).toContain(row.name);
  });
});

// A roll picks the row whole: chroma comes straight from the family, only
// the hue moves. Families match on chroma first — chalk's is unique — then
// nearest hue, since butter and chalk share a hue neighbourhood. The hue
// slop absorbs the encoded rounding, loudest at chalk's whisper chroma.
function familyOf({ c, h }: Oklch): Colourway {
  const candidates = COLOURWAYS.filter((row) => Math.abs(row.chroma - c) <= 0.003);
  expect(candidates.length).toBeGreaterThan(0);
  return candidates.reduce((best, row) =>
    Math.abs(row.hue - h) < Math.abs(best.hue - h) ? row : best,
  );
}

describe('the roll behind windowPalette', () => {
  it('picks a family row whole and jitters only its hue', () => {
    for (let i = 0; i < 400; i++) {
      const o = cssToOklch(windowPalette(3000 + i * 7919, LIGHT)('awning').color);
      const family = familyOf(o);
      expect(Math.abs(o.c - family.chroma)).toBeLessThanOrEqual(0.003);
      // The jitter band is ±6°; the slack beyond it absorbs the encoded hue
      // drift from 8-bit quantization — roughly a quarter degree per point
      // of chroma, loudest on the quiet rows.
      expect(Math.abs(o.h - family.hue)).toBeLessThanOrEqual(6 + 0.25 / o.c);
    }
  });

  it('never shifts the dna or shell streams', () => {
    for (const label of ['dna', 'shell']) {
      const expected = fork(987654, label).weighted([
        { value: 'a', weight: 1 },
        { value: 'b', weight: 1 },
      ]);
      windowPalette(987654, LIGHT);
      const actual = fork(987654, label).weighted([
        { value: 'a', weight: 1 },
        { value: 'b', weight: 1 },
      ]);
      expect(actual).toBe(expected);
    }
  });
});

describe('windowPalette', () => {
  it('keeps the theme-bound roles on the theme', () => {
    const palette = windowPalette(42, LIGHT);
    expect(palette('ink')).toEqual({ color: LIGHT.ink, alpha: 1 });
    expect(palette('glass')).toEqual({ color: LIGHT.ink, alpha: 0.05 });
    expect(palette('paper')).toEqual({ color: LIGHT.paper, alpha: 1 });
  });

  it.each(TINTED)('dresses %s from its family row by day', (role) => {
    const dress = windowPalette(42, LIGHT)(role);
    const measured = cssToOklch(dress.color);
    expect(measured.l).toBeGreaterThan(0.75);
    expect(measured.l).toBeLessThan(0.85);
    expect(measured.c).toBeLessThanOrEqual(0.092);
    expect(Number.isFinite(measured.h)).toBe(true);
  });

  const STREET = ['mullion', 'awning', 'awningThin', 'box'] as const;
  it.each(STREET)('mixes %s into the ground at night', (role) => {
    const day = windowPalette(42, LIGHT)(role).color;
    const night = windowPalette(42, DARK)(role).color;
    const ch = (css: string) => css.match(/\d+/g)!.map(Number);
    const [dr, dg, db] = ch(day);
    const [nr, ng, nb] = ch(night);
    expect(nr).toBe(Math.round(0.3 * dr));
    expect(ng).toBe(Math.round(0.3 * dg));
    expect(nb).toBe(Math.round(0.3 * db));
  });

  // The veil covers the street only: the room's interior is its own space —
  // its surfaces keep their day colour over the interior ground, which holds
  // the theme's ground in both themes.
  const INTERIOR = ['fabric', 'shade', 'blind', 'sill'] as const;
  it.each(INTERIOR)('keeps %s on its day colour at night', (role) => {
    expect(windowPalette(42, DARK)(role).color).toBe(windowPalette(42, LIGHT)(role).color);
    expect(windowPalette(42, DARK)(role).alpha).toBe(windowPalette(42, LIGHT)(role).alpha);
  });

  it.each(PAINTED)('paints %s opaque', (role) => {
    expect(windowPalette(42, LIGHT)(role).alpha).toBe(1);
  });

  it('wears the awning thin from the same roll: same hue, quieter and lighter', () => {
    for (let i = 0; i < 50; i++) {
      const palette = windowPalette(6000 + i * 7919, LIGHT);
      const full = cssToOklch(palette('awning').color);
      const thin = cssToOklch(palette('awningThin').color);
      // The hue slop absorbs the encoded rounding, loudest at the thin
      // wear's whisper chroma.
      expect(Math.abs(thin.h - full.h)).toBeLessThanOrEqual(0.5 / thin.c);
      expect(thin.c).toBeLessThan(full.c);
      expect(thin.l).toBeGreaterThan(full.l);
    }
  });

  it('washes the cloth roles at their whisper alphas', () => {
    for (const [role, alpha] of Object.entries(WASH_ALPHAS)) {
      expect(windowPalette(42, LIGHT)(role as keyof typeof WASH_ALPHAS).alpha).toBeCloseTo(alpha, 12);
    }
  });

  it('rolls each painted role its own colourway, the cloth roles sharing one', () => {
    const palette = windowPalette(42, LIGHT);
    // One curtain per window: fabric, shade, and blind are three
    // constructions of the same cloth, so they dress in the same colour.
    expect(palette('fabric').color).toBe(palette('shade').color);
    expect(palette('shade').color).toBe(palette('blind').color);
    // Independent rolls: over a sweep the painted surfaces mostly differ,
    // matching only by the chance of two rolls landing on one family — the
    // hues compare within both jitters, the chromas within round-trip slop.
    let matching = 0;
    const total = 200;
    for (let i = 0; i < total; i++) {
      const p = windowPalette(5000 + i * 7919, LIGHT);
      const frame = cssToOklch(p('mullion').color);
      const cloth = cssToOklch(p('fabric').color);
      if (Math.abs(frame.h - cloth.h) <= 12 && Math.abs(frame.c - cloth.c) <= 0.001) matching++;
    }
    expect(matching / total).toBeLessThan(0.25);
    expect(matching).toBeGreaterThan(0);
  });

  it('gives neighbouring seeds their own colourways often enough to differ', () => {
    const colours = new Set<string>();
    for (let i = 0; i < 40; i++) colours.add(windowPalette(2000 + i * 7919, LIGHT)('fabric').color);
    expect(colours.size).toBeGreaterThan(4);
  });

  it('throws on a role with no registered resolution', () => {
    const palette = windowPalette(42, LIGHT) as unknown as (role: string) => ResolvedColor;
    expect(() => palette('nonsense')).toThrow();
  });
});

describe('the light palette', () => {
  it('registers every light role', () => {
    for (const role of ['lamp', 'emitter', 'ambient', 'aura'] as const) {
      expect(() => windowPalette(42, LIGHT)(role)).not.toThrow();
    }
  });

  // The emitter resolves its warm row whole — no chroma cap, no night sink:
  // the bulb is the one surface allowed to shout, and it is furniture colour
  // in both themes.
  it('reads the emitter straight off the light fork', () => {
    for (const seed of [1, 42, 2000, 1335613256, 7, 99]) {
      const exp = fork(seed, 'light');
      const row = exp.weighted(LIGHTWAYS.map((w) => ({ value: w, weight: w.weight })));
      const hue = exp.float(
        row.hue - DEFAULT_COLOURWAY_TUNING.hueJitter,
        row.hue + DEFAULT_COLOURWAY_TUNING.hueJitter,
      );
      const emitter = cssToOklch(windowPalette(seed, LIGHT)('emitter').color);
      expect(emitter.l, `seed ${seed}`).toBeCloseTo(row.lightness, 2);
      expect(emitter.c, `seed ${seed}`).toBeCloseTo(row.chroma, 2);
      expect(emitter.h, `seed ${seed}`).toBeCloseTo(hue, 0);
    }
  });

  it('stays in the warm band over a seed sweep', () => {
    for (let i = 0; i < 200; i++) {
      const h = cssToOklch(windowPalette(3000 + i * 7919, LIGHT)('emitter').color).h;
      expect(h).toBeGreaterThanOrEqual(25);
      expect(h).toBeLessThanOrEqual(100);
    }
  });

  it('keeps every light role on its day colour at night', () => {
    for (const role of ['lamp', 'emitter', 'ambient', 'aura'] as const) {
      expect(windowPalette(42, DARK)(role).color).toBe(windowPalette(42, LIGHT)(role).color);
    }
  });

  // The washes the room reads by: the aura louder than the ambient, both
  // whispers against the emitter's opaque fill.
  it('washes the room at the aura and ambient dials', () => {
    const p = windowPalette(42, LIGHT);
    expect(p('emitter').alpha).toBe(1);
    expect(p('ambient').alpha).toBeGreaterThan(0);
    expect(p('ambient').alpha).toBeLessThan(p('aura').alpha);
    expect(p('aura').alpha).toBeLessThan(0.5);
  });
});
