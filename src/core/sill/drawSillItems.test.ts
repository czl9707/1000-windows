import { describe, expect, it } from 'vitest';
import { fork } from '@/core/randomness/rng';
import { expandSill } from './index';
import { itemMarks } from './drawSillItems';
import { CORNER_INSET, KINDS, LEDGE_OVERLAP, BOOK_COUNT_RANGE, PLANT_KINDS, SIDE_TUCK, SILL_ITEM_DEPTH, SILL_ITEM_Z, type SillKind } from './catalogue';
import type { AnchoredSill, SillPlan } from './sill';
import { expandCurtain } from '@/core/curtain';
import { CURTAIN_Z } from '@/core/curtain/catalogue';
import { innerRect, SHELL_Z } from '@/core/window-shell/shell';
import type { FillMark, StrokeMark } from '@/core/scene';

const OPENING = innerRect(0.07);
const HEIGHT = OPENING.bottom - OPENING.top;

function anchored(kind: SillKind, side: 'left' | 'right', widthJitter = 1, bookCount = 4): AnchoredSill {
  return { present: true, kind, side, widthJitter, bookCount, plantKind: 'rubber' };
}

const fills = (marks: ReturnType<typeof itemMarks>) => marks.filter((m): m is FillMark => m.kind === 'fill');
const strokes = (marks: ReturnType<typeof itemMarks>) => marks.filter((m): m is StrokeMark => m.kind === 'stroke');

describe('itemMarks', () => {
  it('draws nothing on an empty ledge', () => {
    const bare: SillPlan = { present: false };
    expect(itemMarks(bare, OPENING)).toEqual([]);
  });

  it('gives every kind a silhouette fill and line work in ink', () => {
    for (const { value: kind } of KINDS) {
      const marks = itemMarks(anchored(kind, 'left'), OPENING);
      expect(fills(marks).length, `${kind} silhouette`).toBeGreaterThan(0);
      expect(strokes(marks).length, `${kind} lines`).toBeGreaterThan(0);
    }
  });

  it('hangs every mark between the curtain cloth and the pane wash', () => {
    for (const { value: kind } of KINDS) {
      for (const mark of itemMarks(anchored(kind, 'right'), OPENING)) {
        expect(mark.z, `${kind} sort bucket`).toBe(SILL_ITEM_Z);
        expect(mark.z, `${kind} above the cloth`).toBeGreaterThan(CURTAIN_Z);
        expect(mark.z, `${kind} under the glass`).toBeLessThan(SHELL_Z.glass);
        for (const p of mark.pts) {
          expect(p.z, `${kind} depth`).toBe(SILL_ITEM_DEPTH);
        }
      }
    }
  });

  it('keeps every item inside the frame run and behind its bottom rail', () => {
    for (const { value: kind } of KINDS) {
      for (const side of ['left', 'right'] as const) {
        const marks = itemMarks(anchored(kind, side), OPENING);
        const ys = marks.flatMap((m) => m.pts.map((p) => p.y));
        expect(Math.max(...ys), `${kind} ${side} base`).toBeLessThanOrEqual(OPENING.bottom + LEDGE_OVERLAP + 1e-9);
        expect(Math.max(...ys), `${kind} ${side} grounded`).toBeGreaterThan(OPENING.bottom);
        // The books tuck into the side band; every other kind stays inside.
        const leftBound = kind === 'books' ? OPENING.left - SIDE_TUCK : OPENING.left;
        const rightBound = kind === 'books' ? OPENING.right + SIDE_TUCK : OPENING.right;
        for (const mark of marks) {
          for (const p of mark.pts) {
            expect(p.x, `${kind} ${side} x`).toBeGreaterThanOrEqual(leftBound - 1e-9);
            expect(p.x, `${kind} ${side} x`).toBeLessThanOrEqual(rightBound + 1e-9);
            expect(p.y, `${kind} y`).toBeGreaterThanOrEqual(OPENING.top - 1e-9);
          }
        }
      }
    }
  });

  it('tucks the books into the side frame, every other kind holding its inset', () => {
    const xsOf = (ms: ReturnType<typeof itemMarks>) => ms.flatMap((m) => m.pts.map((p) => p.x));
    expect(Math.min(...xsOf(itemMarks(anchored('books', 'left'), OPENING))), 'books tuck left').toBeLessThan(OPENING.left);
    expect(Math.max(...xsOf(itemMarks(anchored('books', 'right'), OPENING))), 'books tuck right').toBeGreaterThan(OPENING.right);
    for (const kind of ['mug', 'jars', 'plant', 'clock'] as const) {
      expect(Math.min(...xsOf(itemMarks(anchored(kind, 'left'), OPENING))), `${kind} inset left`).toBeGreaterThanOrEqual(OPENING.left + CORNER_INSET - 1e-9);
      expect(Math.max(...xsOf(itemMarks(anchored(kind, 'right'), OPENING))), `${kind} inset right`).toBeLessThanOrEqual(OPENING.right - CORNER_INSET + 1e-9);
    }
  });

  it('never grows past half the opening', () => {
    for (const { value: kind } of KINDS) {
      for (const side of ['left', 'right'] as const) {
        const marks = itemMarks(anchored(kind, side), OPENING);
        const ys = marks.flatMap((m) => m.pts.map((p) => p.y));
        expect(HEIGHT - (Math.max(...ys) - Math.min(...ys)), `${kind} height`).toBeGreaterThanOrEqual(HEIGHT / 2 - 1e-9);
      }
    }
  });

  it('jitters the silhouette width around its kind constant', () => {
    const narrow = itemMarks(anchored('books', 'left', 0.9), OPENING);
    const wide = itemMarks(anchored('books', 'left', 1.1), OPENING);
    const spanOf = (ms: ReturnType<typeof itemMarks>) => {
      const xs = ms.flatMap((m) => m.pts.map((p) => p.x));
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(spanOf(wide)).toBeGreaterThan(spanOf(narrow));
  });

  it('never repeats a trace name within one window', () => {
    for (const { value: kind } of KINDS) {
      const names = strokes(itemMarks(anchored(kind, 'left'), OPENING)).map((s) => s.name);
      expect(new Set(names).size, kind).toBe(names.length);
    }
  });

  it('reads the plant in its coloured roles: painted pot, washed foliage', () => {
    const marks = itemMarks(anchored('plant', 'left'), OPENING);
    const roles = fills(marks).map((f) => f.role);
    expect(roles).toContain('mullion');
    expect(roles).toContain('fabric');
  });

  // Every kind wears a visible wash — nothing fills in paper, which dies
  // into the background and leaves the item as bare line work.
  it('dresses every kind in a visible wash from the existing roles', () => {
    const rolesOf = (kind: SillKind) => fills(itemMarks(anchored(kind, 'left'), OPENING)).map((f) => f.role);
    for (const kind of KINDS) {
      const roles = rolesOf(kind.value);
      expect(roles.some((r) => r !== 'paper' && r !== 'glass'), `${kind.value} visible fill`).toBe(true);
    }
    expect(rolesOf('books')).toContain('mullion');
    expect(rolesOf('mug')).toContain('box');
    expect(rolesOf('clock')).toContain('mullion');
    expect(rolesOf('jars')).toContain('fabric');
  });

  it('builds the books as separate volumes with varied heights, not one box', () => {
    const volumes = fills(itemMarks(anchored('books', 'left'), OPENING)).filter((f) => f.role === 'mullion');
    expect(volumes.length).toBeGreaterThanOrEqual(3);
    const tops = volumes.map((f) => Math.min(...f.pts.map((p) => p.y)));
    expect(new Set(tops).size, 'varied tops').toBeGreaterThanOrEqual(2);
  });

  it('draws one volume per rolled book, at every count in the catalogue band', () => {
    for (let bookCount = BOOK_COUNT_RANGE.min; bookCount <= BOOK_COUNT_RANGE.max; bookCount++) {
      const volumes = fills(itemMarks(anchored('books', 'left', 1, bookCount), OPENING)).filter((f) => f.role === 'mullion');
      expect(volumes.length, `count ${bookCount}`).toBeGreaterThanOrEqual(bookCount);
    }
  });

  it('wears two strengths of paint: some books carry a second pass, never all', () => {
    const volumes = fills(itemMarks(anchored('books', 'left'), OPENING)).filter((f) => f.role === 'mullion');
    expect(volumes.length, 'some books double-passed').toBeGreaterThan(4);
    expect(volumes.length, 'not every book doubled').toBeLessThan(8);
  });

  it('draws every vertical of the books and the jars — no omitted lines', () => {
    const bookMarks = itemMarks(anchored('books', 'left'), OPENING);
    const verticals = strokes(bookMarks).filter((s) => {
      const [a, b] = s.pts;
      return Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) > 1e-9;
    });
    const xs = new Set(verticals.map((s) => s.pts[0].x.toPrecision(9)));
    // Every book's left edge plus the row's closing right edge.
    expect(verticals.length, 'book verticals').toBeGreaterThanOrEqual(5);
    expect(xs.size, 'each vertical at its own x').toBe(verticals.length);

    const jarMarks = itemMarks(anchored('jars', 'left'), OPENING);
    const jarVerticals = strokes(jarMarks).filter((s) => {
      const [a, b] = s.pts;
      return Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) > 1e-9;
    });
    expect(jarVerticals.length, 'both sides of every jar').toBeGreaterThanOrEqual(2 * 3);
  });

  it('marks the jars with contents and the clock with a centre', () => {
    const jars = itemMarks(anchored('jars', 'left'), OPENING);
    const contents = fills(jars).filter((f) => f.role === 'fabric');
    expect(contents.length).toBeGreaterThanOrEqual(1);
    const clock = itemMarks(anchored('clock', 'left'), OPENING);
    expect(clock.some((m) => m.kind === 'dot'), 'clock centre dot').toBe(true);
  });

  it('draws every plant in the vocabulary as a container plus greenery, inside its spot', () => {
    for (const { value: plantKind } of PLANT_KINDS) {
      const marks = itemMarks({ ...anchored('plant', 'left'), plantKind }, OPENING);
      expect(fills(marks).length, `${plantKind} mass`).toBeGreaterThan(0);
      expect(strokes(marks).length, `${plantKind} line work`).toBeGreaterThan(0);
      // Every vocabulary plant carries its container in a paint role.
      expect(
        fills(marks).some((f) => f.role === 'mullion' || f.role === 'box'),
        `${plantKind} container`,
      ).toBe(true);
      const xs = marks.flatMap((m) => m.pts.map((p) => p.x));
      expect(Math.min(...xs), `${plantKind} x`).toBeGreaterThanOrEqual(OPENING.left - 1e-9);
      expect(Math.max(...xs), `${plantKind} x`).toBeLessThanOrEqual(OPENING.right + 1e-9);
      const ys = marks.flatMap((m) => m.pts.map((p) => p.y));
      expect(Math.max(...ys) - Math.min(...ys), `${plantKind} height`).toBeLessThanOrEqual(OPENING.bottom - OPENING.top);
    }
  });

  it('rolls a distinct vocabulary per window: the seven kinds all occur', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const rng = fork(7000 + i * 104729, 'dna');
      expandCurtain(rng);
      const plan = expandSill(rng);
      if (plan.present && plan.kind === 'plant') seen.add(plan.plantKind);
    }
    expect(seen.size, 'vocabulary coverage over 200 seeds').toBe(PLANT_KINDS.length);
  });
});
