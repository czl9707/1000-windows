import { describe, expect, it } from 'vitest';
import { PITCH_X, PITCH_Y, wallUnits } from './grid';

describe('wallUnits', () => {
  it('holds the window-size floor on a desktop viewport', () => {
    // 1600×900: the five-column minimum (1600/16 = 100) and the clamp
    // (≈ 79.1) both sit below the 120 px floor, so the floor wins — the
    // view drops below five columns rather than shrinking the windows.
    expect(wallUnits(1600, 900)).toBe(120);
  });

  it('holds the floor through the row side on a wide viewport', () => {
    // 1920×700: the row bound (700/7.2 ≈ 97.2) is the smaller one, still
    // under the floor.
    expect(wallUnits(1920, 700)).toBe(120);
  });

  it('holds the floor on an extreme viewport, under the thirty-cell cap', () => {
    // 3440×500 ultrawide: at the floor the view shows about 9 × 1.7
    // cells, well under the cap, so neither the clamp nor the count
    // minimum gets a say.
    expect(wallUnits(3440, 500)).toBe(120);
  });

  it('holds the floor on a phone-sized viewport', () => {
    // 375×667: the clamp (≈ 33.3) and the five-column minimum (23.4) both
    // lose to the floor — a phone shows a couple of big windows, not
    // thirty specks.
    expect(wallUnits(375, 667)).toBe(120);
  });

  it('lets the fit minimum rise above the floor on a large viewport', () => {
    // 2560×1600: the column bound (2560/16 = 160) is the smaller fit
    // side, above both the floor and the clamp (≈ 133.3), so the fit rule
    // wins as usual.
    expect(wallUnits(2560, 1600)).toBeCloseTo(2560 / 16, 10);
  });

  it('lets the thirty-cell cap win when the fit minimum would overrun it', () => {
    // 8000×600: the fit minimum is the row bound (600/7.2 ≈ 83.3), where
    // the view would hold about 96 cells; the clamp (≈ 144.3) takes over,
    // holding the count at the thirty-cell cap.
    const clamp = Math.sqrt((8000 * 600) / (30 * PITCH_X * PITCH_Y));
    expect(wallUnits(8000, 600)).toBe(clamp);
  });
});
