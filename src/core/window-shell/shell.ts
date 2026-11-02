// The window shell: frame archetype, pane layout, open state, sill. The shell
// is a pure function of the window seed — it rolls on its own fork so shell
// and DNA vocabularies grow without re-randomizing each other (see the
// determinism chapter). Roll order lives in archetypes.ts.
//
// This module is the shell's vocabulary: the plan, the catalogue rolls, and
// the unit-measure geometry helpers the drawers share. Assembly — collecting
// the drawers' marks and drawing the window — lives in core/entry.ts.
import { fork } from '@/core/randomness/rng';
import type { Pt3 } from '@/motion/projection';
import { ARCHETYPES, ADDONS, OPEN_STATES, SILLS, type HingeSide, type ShellPlan } from './archetypes';

export function expandShell(seed: number): ShellPlan {
  const rng = fork(seed, 'shell');
  const archetypeId = rng.weighted(
    Object.entries(ARCHETYPES).map(([value, a]) => ({ value, weight: a.weight })),
  ) as keyof typeof ARCHETYPES;
  const archetype = ARCHETYPES[archetypeId];

  const layout = rng.weighted(archetype.layouts);

  const open = archetype.operable ? rng.weighted(OPEN_STATES) : 'closed';

  let hingeSide: HingeSide | null = null;
  if (archetypeId === 'casement' && open !== 'closed') {
    hingeSide = rng.weighted([
      { value: 'left' as HingeSide, weight: 1 },
      { value: 'right' as HingeSide, weight: 1 },
    ]);
  }

  const thicknessJitter = rng.float(0.85, 1.15);
  const faceWidth = rng.float(0.05, 0.09);

  return {
    archetype: archetypeId,
    layout,
    open,
    hingeSide,
    thicknessJitter,
    faceWidth,
    sill: rng.weighted(SILLS),
    awning: rng.weighted(ADDONS.awning),
    shutters: rng.weighted(ADDONS.shutters),
    box: rng.weighted(ADDONS.box),
  };
}

// Unit measure: the window box is 1.6 × 1.0, centred on the origin.
export const BOX = { halfW: 0.8, halfH: 0.5 };

// Sort keys for the shell's marks, spaced so later layers interleave. Sort
// keys only: a unit-measure depth stays under ~1.2 (an open casement leaf
// swung fully out), and one of these values fed to the projection would flip
// the geometry through the origin.
export const SHELL_Z = { glass: 0, frame: 10, sill: 20, open: 30, addon: 40 } as const;

// The glass opening: the inner frame line, inset by the rolled face width.
export function innerRect(face: number): { top: number; bottom: number; left: number; right: number } {
  return {
    top: -BOX.halfH + face,
    bottom: BOX.halfH - face,
    left: -BOX.halfW + face,
    right: BOX.halfW - face,
  };
}

// Geometry helpers in unit measure. Points always lie where the geometry says
// — a SHELL_Z sort key must never reach them (see window.ts).
export function rectPts(x0: number, y0: number, x1: number, y1: number): Pt3[] {
  return [
    { x: x0, y: y0, z: 0 },
    { x: x1, y: y0, z: 0 },
    { x: x1, y: y1, z: 0 },
    { x: x0, y: y1, z: 0 },
  ];
}

// A cols × rows grid of pane rectangles across the given span.
export function gridRects(
  top: number,
  bottom: number,
  left: number,
  right: number,
  cols: number,
  rows: number,
): Pt3[][] {
  const rects: Pt3[][] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      rects.push(
        rectPts(
          left + (c * (right - left)) / cols,
          top + (r * (bottom - top)) / rows,
          left + ((c + 1) * (right - left)) / cols,
          top + ((r + 1) * (bottom - top)) / rows,
        ),
      );
    }
  }
  return rects;
}

export function line(x0: number, y0: number, x1: number, y1: number): Pt3[] {
  return [
    { x: x0, y: y0, z: 0 },
    { x: x1, y: y1, z: 0 },
  ];
}
