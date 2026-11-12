import { describe, expect, it } from 'vitest';
import { PITCH_X, PITCH_Y, visibleCells } from './grid';

// The window box is 1.6×1.0, so cell (1,0)'s box spans
// [PITCH_X − 0.8, PITCH_X + 0.8] in x.

describe('visibleCells', () => {
  it('sees exactly one cell when the extent covers only its box', () => {
    const cells = visibleCells({ x: 0, y: 0 }, 4, 2, 0);
    expect(cells).toEqual([{ col: 0, row: 0 }]);
  });

  it('sees a 3×3 neighbourhood when the extent reaches the neighbours\' boxes', () => {
    const cells = visibleCells({ x: 0, y: 0 }, PITCH_X + 1.6, PITCH_Y + 1.0, 0);
    expect(cells).toHaveLength(9);
    expect(cells).toContainEqual({ col: -1, row: -1 });
    expect(cells).toContainEqual({ col: 0, row: 0 });
    expect(cells).toContainEqual({ col: 1, row: 1 });
  });

  it('pans with the camera: the extent rides on the camera point', () => {
    const cells = visibleCells({ x: PITCH_X, y: 0 }, 4, 2, 0);
    expect(cells).toEqual([{ col: 1, row: 0 }]);
  });

  it('the margin widens the net by whole cells', () => {
    const cells = visibleCells({ x: 0, y: 0 }, 4, 2, Math.max(PITCH_X, PITCH_Y));
    expect(cells).toContainEqual({ col: -1, row: 0 });
    expect(cells).toContainEqual({ col: 1, row: 0 });
    expect(cells).toContainEqual({ col: 0, row: -1 });
    expect(cells).toContainEqual({ col: 0, row: 1 });
  });

  it('counts a cell when its window box crosses the extent edge, not when it falls short', () => {
    // Cell (1,0)'s box starts at x = 2.2. An extent ending at 2.25 counts
    // it; one ending at 2.15 does not.
    const extentW = 4;
    expect(visibleCells({ x: 0.25, y: 0 }, extentW, 2, 0)).toContainEqual({ col: 1, row: 0 });
    expect(visibleCells({ x: 0.15, y: 0 }, extentW, 2, 0)).not.toContainEqual({ col: 1, row: 0 });
  });
});
