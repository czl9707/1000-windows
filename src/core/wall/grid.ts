// The wall's world grid. Every cell holds a window at the fixed pitch; a
// cell's identity is its integer coordinates, and its seed is
// `windowSeed(metaSeed, col, row)` — coordinates exist nowhere else, so the
// same address is the same tenant no matter how the camera arrived.
import { BOX } from '@/core/window-shell/shell';

export const PITCH_X = 3;
export const PITCH_Y = 2;

// A point in world space, unit measure. The camera is the world point the
// canvas's centre stands on.
export interface Camera {
  x: number;
  y: number;
}

// Screen pixels per unit measure, from the viewport rule: the uncapped
// minimum fits the minimum view of five columns and three rows; the clamp
// below holds the visible cell count at the thirty-cell cap; the floor
// holds each window's rendered size up — a shrinking viewport drops
// columns and rows rather than shrinking tenants into specks, so the
// count bounds yield before the floor does.
const MIN_COLS = 5;
const MIN_ROWS = 3;
const MAX_CELLS = 30;
const MIN_UNIT_PX = 120;

export function wallUnits(widthPx: number, heightPx: number): number {
  const cap = Math.sqrt((widthPx * heightPx) / (MAX_CELLS * PITCH_X * PITCH_Y));
  return Math.max(
    Math.min(widthPx / (MIN_COLS * PITCH_X), heightPx / (MIN_ROWS * PITCH_Y)),
    cap,
    MIN_UNIT_PX,
  );
}

export interface Cell {
  col: number;
  row: number;
}

// Pure on the camera point: the cells depend on where the camera is,
// never on how it got there.
export function visibleCells(camera: Camera, extentW: number, extentH: number, margin = 0): Cell[] {
  const xMin = camera.x - extentW / 2 - margin;
  const xMax = camera.x + extentW / 2 + margin;
  const yMin = camera.y - extentH / 2 - margin;
  const yMax = camera.y + extentH / 2 + margin;
  const cells: Cell[] = [];
  // `+ 0` normalizes Math.ceil's -0 so cell keys compare equal.
  const col0 = Math.ceil((xMin - BOX.halfW) / PITCH_X) + 0;
  const col1 = Math.floor((xMax + BOX.halfW) / PITCH_X) + 0;
  const row0 = Math.ceil((yMin - BOX.halfH) / PITCH_Y) + 0;
  const row1 = Math.floor((yMax + BOX.halfH) / PITCH_Y) + 0;
  for (let row = row0; row <= row1; row++) {
    for (let col = col0; col <= col1; col++) {
      cells.push({ col, row });
    }
  }
  return cells;
}
