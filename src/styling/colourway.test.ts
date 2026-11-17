import { describe, expect, it } from 'vitest';
import { fork } from '@/core/randomness/rng';
import { type ResolvedColor } from './roles';
import { COLOURWAYS, WARMTH, windowPalette, type Colourway } from './colourway';
import { cssToOklch, type Oklch } from './oklch';

// The grounds match the page's two themes, night declared as the themes
// declare it; the ink values are whatever the tokens hold — tinted roles
// must not depend on them.
const LIGHT = { ink: 'rgb(33 37 41)', paper: 'rgb(229 222 214)', isNight: false };
const DARK = { ink: 'rgb(233 236 239)', paper: 'rgb(0 0 0)', isNight: true };
const TINTED = ['mullion', 'fabric', 'shade', 'blind', 'awning', 'sill', 'box'] as const;
// The cloth washes land at their base alpha compounded with the half-strength
// pooling echo: fabric/shade 1 − 0.86 × 0.93, blind 1 − 0.84 × 0.92. Every
// painted surface goes down opaque — its fill exists to hide the wall and the
// layers behind it.
const WASH_ALPHAS = { fabric: 0.2002, shade: 0.2002 } as const;
const PAINTED = ['mullion', 'awning', 'awningThin', 'sill', 'box'] as const;

describe('the colourway catalogue', () => {
  it('weights sum to one and names its rows uniquely', () => {
    const total = COLOURWAYS.reduce((sum, row) => sum + row.weight, 0);
    expect(total).toBeCloseTo(1, 10);
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
// the hue moves. Both tables match on chroma first — chalk's is unique on
// the street, the warmth rows crowd a step apart — then nearest hue, since
// neighbours can share a hue neighbourhood. The slop absorbs the encoded
// rounding; the street window is tighter because the street chromas sit
// further apart.
function rowOf(table: readonly Colourway[], chromaSlop: number, { c, h }: Oklch): Colourway {
  const candidates = table.filter((row) => Math.abs(row.chroma - c) <= chromaSlop);
  expect(candidates.length).toBeGreaterThan(0);
  return candidates.reduce((best, row) =>
    Math.abs(row.hue - h) < Math.abs(best.hue - h) ? row : best,
  );
}

const familyOf = (o: Oklch) => rowOf(COLOURWAYS, 0.003, o);
const warmthOf = (o: Oklch) => rowOf(WARMTH, 0.01, o);

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

describe('the warmth table', () => {
  it('weights sum to one and names its rows uniquely', () => {
    const total = WARMTH.reduce((sum, row) => sum + row.weight, 0);
    expect(total).toBeCloseTo(1, 10);
    const names = WARMTH.map((row) => row.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('stays in the warm band and outshines the street rows', () => {
    for (const row of WARMTH) {
      expect(row.hue).toBeGreaterThanOrEqual(35);
      expect(row.hue).toBeLessThan(95);
      expect(row.chroma).toBeGreaterThan(0.05);
    }
  });

  it('reaches every row across a seed sweep', () => {
    // Matched by hue: the shipped warmth ceiling clips the hot rows' chroma
    // onto one band, so chroma no longer identifies a row — the hue does.
    // The window is the jitter band plus the encoded rounding's drift.
    const hues: number[] = [];
    for (let i = 0; i < 600; i++) {
      hues.push(cssToOklch(windowPalette(7000 + i * 7919, LIGHT)('light').color).h);
    }
    for (const row of WARMTH) {
      const hit = hues.some((hue) => Math.abs(hue - row.hue) <= 8);
      expect(hit, `${row.name} unreached`).toBe(true);
    }
  });
});

describe('the interior roles', () => {
  it('lights the emitter opaque from the warmth roll, shares one warmth across the room, and lays it in graded strengths', () => {
    const dress = windowPalette(42, LIGHT)('light');
    expect(dress.alpha).toBe(1);
    const o = cssToOklch(dress.color);
    expect(WARMTH).toContainEqual(warmthOf(o));
    const palette = windowPalette(42, LIGHT);
    expect(palette('ambient').color).toBe(palette('light').color);
    expect(palette('aura').color).toBe(palette('light').color);
    const ambient = palette('ambient').alpha;
    const aura = palette('aura').alpha;
    expect(ambient).toBeGreaterThan(0);
    expect(aura).toBeGreaterThan(0);
    expect(ambient).toBeGreaterThan(aura);
    expect(aura).toBeLessThan(1);
  });

  it('furnishes the lamp structure from its own roll, opaque and dark', () => {
    const palette = windowPalette(42, LIGHT);
    expect(palette('lamp').alpha).toBe(1);
    // A dark silhouette in both themes: the roll lands on a street family
    // and the resolution sinks it well below the street lightness.
    for (let i = 0; i < 200; i++) {
      const o = cssToOklch(windowPalette(8000 + i * 7919, LIGHT)('lamp').color);
      expect(o.l).toBeLessThan(0.6);
    }
    // Its own group: over a sweep the lamp's body colour mostly differs
    // from the cloth's, matching only by chance.
    let matching = 0;
    for (let i = 0; i < 200; i++) {
      const p = windowPalette(8000 + i * 7919, LIGHT);
      const lamp = cssToOklch(p('lamp').color);
      const cloth = cssToOklch(p('fabric').color);
      if (Math.abs(lamp.h - cloth.h) <= 12 && Math.abs(lamp.c - cloth.c) <= 0.001) matching++;
    }
    expect(matching).toBeLessThan(100);
  });

  it('veils in the ground colour', () => {
    const palette = windowPalette(42, LIGHT);
    const veil = palette('veil');
    expect(veil.color).toBe(LIGHT.paper);
    expect(veil.alpha).toBeGreaterThan(0);
    expect(veil.alpha).toBeLessThan(1);
  });

  it('keeps the interior off the night mix — the veil darkens instead', () => {
    for (const role of ['lamp', 'light', 'ambient', 'aura'] as const) {
      expect(windowPalette(42, DARK)(role).color).toBe(windowPalette(42, LIGHT)(role).color);
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

  it.each([...PAINTED, 'awningThin', 'blind'] as const)('mixes %s into the ground at night', (role) => {
    const day = windowPalette(42, LIGHT)(role).color;
    const night = windowPalette(42, DARK)(role).color;
    const ch = (css: string) => css.match(/\d+/g)!.map(Number);
    const [dr, dg, db] = ch(day);
    const [nr, ng, nb] = ch(night);
    expect(nr).toBe(Math.round(0.3 * dr));
    expect(ng).toBe(Math.round(0.3 * dg));
    expect(nb).toBe(Math.round(0.3 * db));
  });

  it('keeps the cloth off the night mix — it relies on the colour behind', () => {
    for (const role of ['fabric', 'shade'] as const) {
      const day = windowPalette(42, LIGHT)(role);
      const night = windowPalette(42, DARK)(role);
      expect(night.color).toBe(day.color);
      expect(night.alpha).toBe(day.alpha);
    }
  });

  it('resolves the blind opaque — no light reads through the slats', () => {
    const palette = windowPalette(42, LIGHT);
    expect(palette('blind').alpha).toBe(1);
    // Same cloth roll as the washes: one curtain, one cloth colour — the
    // hue reads through the echo's composite.
    const blind = cssToOklch(palette('blind').color);
    const shade = cssToOklch(palette('shade').color);
    expect(Math.abs(blind.h - shade.h)).toBeLessThanOrEqual(0.5 / blind.c);
  });

  it('dresses the unlit emitter in the lamp colourway without the dark sink', () => {
    for (let i = 0; i < 100; i++) {
      const palette = windowPalette(11000 + i * 7919, LIGHT);
      const body = cssToOklch(palette('lamp').color);
      const shade = cssToOklch(palette('lampShade').color);
      expect(Math.abs(shade.h - body.h)).toBeLessThanOrEqual(0.5 / shade.c);
      expect(shade.l).toBeGreaterThan(body.l);
      expect(palette('lampShade').alpha).toBe(1);
    }
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

describe('the furniture roles', () => {
  // The furniture wears no colourway: gray silhouettes derived from the
  // theme pair, one shade per depth plane, so a theme flip re-resolves them
  // without any furniture-specific rule.
  it('dresses the silhouette opaque and neutral', () => {
    const body = windowPalette(42, LIGHT)('furniture4');
    expect(body.alpha).toBe(1);
    const bodyO = cssToOklch(body.color);
    // A gray mixed from the theme pair inherits the theme's own tint (the
    // paper is warm), so the bound sits above any colourway row's chroma.
    expect(bodyO.c).toBeLessThan(0.02);
    expect(bodyO.l).toBeLessThan(cssToOklch(LIGHT.paper).l);
  });

  it('fades the gray lighter with depth', () => {
    const palette = windowPalette(42, LIGHT);
    const near = cssToOklch(palette('furniture2').color).l;
    const mid = cssToOklch(palette('furniture4').color).l;
    const deep = cssToOklch(palette('furniture6').color).l;
    expect(deep).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(near);
  });

  it('does not roll per seed — every window wears the same grays', () => {
    const a = windowPalette(42, LIGHT);
    const b = windowPalette(9000 + 13 * 7919, LIGHT);
    for (const plane of [2, 3, 4, 5, 6] as const) {
      expect(a(`furniture${plane}`).color).toBe(b(`furniture${plane}`).color);
    }
  });

  it('re-resolves the grays on the night theme', () => {
    const day = windowPalette(42, LIGHT);
    const night = windowPalette(42, DARK);
    for (const plane of [2, 3, 4, 5, 6] as const) {
      expect(night(`furniture${plane}`).color).not.toBe(day(`furniture${plane}`).color);
      expect(night(`furniture${plane}`).alpha).toBe(1);
    }
    // Night sinks toward the dark ground: the silhouette darker than by day.
    expect(cssToOklch(night('furniture4').color).l).toBeLessThan(
      cssToOklch(day('furniture4').color).l,
    );
  });
});
