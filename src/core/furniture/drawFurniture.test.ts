import { describe, expect, it } from 'vitest';
import { PLANE_DEPTH, PLANE_Z, KINDS, type FurnitureKind } from './catalogue';
import { pieceMarks } from './drawFurniture';
import { expandFurniture } from './furniture';
import type { FurniturePlan, FurnishedPlane } from './furniture';
import { innerRect } from '@/core/window-shell/shell';
import { fork } from '@/core/randomness/rng';
import type { FillMark, Mark } from '@/core/scene';

const OPENING = innerRect(0.05);

const furnished = (kind: FurnitureKind, planeIndex = 0): FurniturePlan => ({
  planes: Array.from({ length: 5 }, (_, i) =>
    i === planeIndex
      ? ({ present: true, kind, anchorX: 0.5, widthJitter: 1, variant: 0.5 } as FurnishedPlane)
      : { present: false },
  ),
});

const fillsOf = (marks: Mark[], role?: string) =>
  marks.filter((m): m is FillMark => m.kind === 'fill' && (role === undefined || m.role === role));

describe('pieceMarks', () => {
  it('draws a furniture-body fill for every kind, the TV screen additionally in its dark role', () => {
    for (const { value: kind } of KINDS) {
      const marks = pieceMarks(furnished(kind), OPENING);
      expect(fillsOf(marks, 'furniture').length, kind).toBeGreaterThan(0);
      const screens = fillsOf(marks, 'tvScreen');
      if (kind === 'tvStand') expect(screens.length).toBeGreaterThan(0);
      else expect(screens.length).toBe(0);
    }
  });

  it('draws nothing for an empty plan', () => {
    expect(pieceMarks({ planes: [{ present: false }, { present: false }, { present: false }, { present: false }, { present: false }] }, OPENING)).toEqual([]);
  });

  it('carries the plane depth on its points and its bucket on the marks', () => {
    for (let planeIndex = 0; planeIndex < 5; planeIndex++) {
      const marks = pieceMarks(furnished('bookshelf', planeIndex), OPENING);
      expect(marks.length).toBeGreaterThan(0);
      for (const mark of marks) {
        expect(mark.z).toBe(PLANE_Z[planeIndex]);
        for (const p of mark.pts) expect(p.z).toBe(PLANE_DEPTH[planeIndex]);
      }
    }
  });

  it('rises above the sill line and holds inside the opening width', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 77000 + i * 104729;
      const plan = expandFurniture(fork(seed, 'dna'));
      const marks = pieceMarks(plan, OPENING);
      for (const mark of marks) {
        const xs = mark.pts.map((p) => p.x);
        expect(Math.min(...xs)).toBeGreaterThanOrEqual(OPENING.left - 1e-9);
        expect(Math.max(...xs)).toBeLessThanOrEqual(OPENING.right + 1e-9);
      }
      // The piece as a whole breaks the sill line — its lower parts may sit
      // below it (the stack's bottom crate, the cabinet under the screen).
      for (const slot of plan.planes) {
        if (!slot.present) continue;
        const plane = PLANE_Z[plan.planes.indexOf(slot)];
        const piece = marks.filter((m) => m.z === plane);
        expect(Math.min(...piece.map((m) => Math.min(...m.pts.map((p) => p.y)))), `seed ${seed}`).toBeLessThan(OPENING.bottom);
      }
    }
  });

  it('never repeats a trace name within one window, planes and pieces alike', () => {
    for (let i = 0; i < 300; i++) {
      const seed = 80000 + i * 104729;
      const marks = pieceMarks(expandFurniture(fork(seed, 'dna')), OPENING);
      const names = marks.filter((m) => m.kind !== 'fill').map((m) => (m as { name: string }).name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
