import { describe, expect, it } from 'vitest';
import { cssToOklch, mixCss, oklchToCss } from './oklch';

describe('cssToOklch', () => {
  // The anchors come from the research file's independent Python implementation
  // of the same published matrices (scratch/colour-research.md, section 2):
  // the repo's two theme grounds and its ink, measured in OKLCH.
  it('measures the light paper ground', () => {
    const o = cssToOklch('#E5DED6');
    expect(o.l).toBeCloseTo(0.904, 2);
    expect(o.c).toBeCloseTo(0.013, 2);
    expect(o.h).toBeCloseTo(71, 0);
  });

  it('measures the dark paper ground', () => {
    const o = cssToOklch('rgb(0 0 0)');
    expect(o.l).toBeCloseTo(0, 3);
    expect(o.c).toBeCloseTo(0, 3);
  });

  it('measures the ink', () => {
    const o = cssToOklch('#212529');
    expect(o.l).toBeCloseTo(0.262, 2);
    expect(o.c).toBeCloseTo(0.009, 2);
    expect(o.h).toBeCloseTo(248, 0);
  });

  it('measures white', () => {
    const o = cssToOklch('rgb(255 255 255)');
    expect(o.l).toBeCloseTo(1, 3);
    expect(o.c).toBeCloseTo(0, 3);
  });
});

describe('oklchToCss', () => {
  it('round-trips the paper ground within one channel step', () => {
    const back = oklchToCss(cssToOklch('#E5DED6'));
    const channels = back.match(/\d+/g)!.map(Number);
    expect(channels[0]).toBeGreaterThanOrEqual(228);
    expect(channels[0]).toBeLessThanOrEqual(230);
    expect(channels[1]).toBeGreaterThanOrEqual(221);
    expect(channels[1]).toBeLessThanOrEqual(223);
    expect(channels[2]).toBeGreaterThanOrEqual(213);
    expect(channels[2]).toBeLessThanOrEqual(215);
  });

  it('round-trips a saturated wash colour', () => {
    const row = { l: 0.58, c: 0.09, h: 38 };
    const mid = cssToOklch(oklchToCss(row));
    expect(Math.abs(mid.l - row.l)).toBeLessThan(0.002);
    expect(Math.abs(mid.c - row.c)).toBeLessThan(0.002);
    expect(Math.abs(mid.h - row.h)).toBeLessThan(0.5);
  });

  it('throws on an unreadable colour instead of propagating NaN', () => {
    expect(() => cssToOklch('rgb(1 2')).toThrow();
    expect(() => cssToOklch('#12345')).toThrow();
    expect(() => cssToOklch('not a colour')).toThrow();
  });

  it('mixes two colours in the encoded space the canvas composites in', () => {
    // Encoded mid grey measures L 0.6 — the mix is a channel blend, not a
    // perceptual halfway point: it is exactly what compositing the colour
    // over the ground at 1 − t produces.
    expect(cssToOklch(mixCss('rgb(0 0 0)', 'rgb(255 255 255)', 0.5)).l).toBeCloseTo(0.6, 1);
    expect(mixCss('rgb(100 120 140)', 'rgb(0 0 0)', 0.9)).toBe('rgb(10 12 14)');
    expect(mixCss('rgb(100 120 140)', 'rgb(0 0 0)', 0)).toBe('rgb(100 120 140)');
    expect(() => mixCss('nonsense', 'rgb(0 0 0)', 0.5)).toThrow();
  });

  it('clamps out-of-gamut chroma instead of leaving the sRGB cube', () => {
    const css = oklchToCss({ l: 0.9, c: 0.3, h: 30 });
    const channels = css.match(/\d+/g)!.map(Number);
    for (const ch of channels) {
      expect(ch).toBeGreaterThanOrEqual(0);
      expect(ch).toBeLessThanOrEqual(255);
    }
    const mid = cssToOklch(css);
    expect(mid.l).toBeCloseTo(0.9, 1);
    expect(mid.c).toBeLessThan(0.15);
    expect(mid.h).toBeCloseTo(30, 0);
  });
});
