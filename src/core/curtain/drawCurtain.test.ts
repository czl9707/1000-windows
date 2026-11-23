import { describe, expect, it } from 'vitest';
import { clothMarks } from './drawCurtain';
import { KINDS, ZONE_CEILING, type CurtainKind } from './catalogue';
import type { CoveredCurtain, CurtainPlan } from './curtain';
import { windowPalette } from '@/styling/colourway';
import { cssToOklch } from '@/styling/oklch';
import { innerRect, SHELL_Z } from '@/core/window-shell/shell';
import { ROD_CLEARANCE } from './catalogue';
import { FOLD_BANDS, HEM_CLEARANCE } from './drawCurtain';
import type { FillMark, StrokeMark } from '@/core/scene';

const OPENING = innerRect(0.07);
const PALETTE = windowPalette(0, { ink: '#000000', paper: '#ffffff', isNight: false, transitionMs: 0 });
const CLOTH_ROLES = ['fabric', 'shade', 'blind'] as const;
type ClothRole = (typeof CLOTH_ROLES)[number];

// Each kind draws in the role its construction resolves: hanging cloth in
// fabric, the roman's flat cloth in shade, the venetian's slat rows in blind.
const KIND_ROLE: Record<CurtainKind, ClothRole> = {
  panels: 'fabric',
  drapes: 'fabric',
  roman: 'shade',
  venetian: 'blind',
};

function covered(kind: CurtainKind, coverage: number, overrides: Partial<CoveredCurtain> = {}): CoveredCurtain {
  return { present: true, kind, coverage, rodY: 0, widthJitter: 1, drapeSide: 'left', slatShare: 0, ...overrides };
}

function fills(marks: ReturnType<typeof clothMarks>): FillMark[] {
  return marks.filter((m): m is FillMark => m.kind === 'fill');
}

function clothFills(marks: ReturnType<typeof clothMarks>, role?: ClothRole): FillMark[] {
  return fills(marks).filter((f) => (role ? f.role === role : (CLOTH_ROLES as readonly string[]).includes(f.role)));
}

function strokes(marks: ReturnType<typeof clothMarks>): StrokeMark[] {
  return marks.filter((m): m is StrokeMark => m.kind === 'stroke');
}

describe('the cloth roles', () => {
  it('resolve as a colourway wash — louder than the glass, under solid ink', () => {
    for (const role of ['fabric', 'shade'] as const) {
      const dress = PALETTE(role);
      expect(dress.color).not.toBe(PALETTE('ink').color);
      expect(() => cssToOklch(dress.color)).not.toThrow();
      expect(dress.alpha).toBeGreaterThan(PALETTE('glass').alpha);
      expect(dress.alpha).toBeLessThan(1);
    }
  });

  it('resolves the mullion face in its own paint, occluding', () => {
    const dress = PALETTE('mullion');
    expect(dress.color).not.toBe(PALETTE('paper').color);
    expect(() => cssToOklch(dress.color)).not.toThrow();
    expect(dress.alpha).toBe(1);
  });
});

describe('clothMarks', () => {
  it('draws nothing behind a bare window', () => {
    const bare: CurtainPlan = { present: false };
    expect(clothMarks(bare, OPENING)).toEqual([]);
  });

  it('gives every kind a cloth fill in its construction role, plus line work', () => {
    for (const { value: kind } of KINDS) {
      for (const coverage of [0.12, 0.3, ZONE_CEILING[kind]]) {
        const marks = clothMarks(covered(kind, coverage), OPENING);
        expect(clothFills(marks, KIND_ROLE[kind]).length, `${kind} cloth`).toBeGreaterThan(0);
        expect(strokes(marks).length, `${kind} lines`).toBeGreaterThan(0);
      }
    }
  });

  it('hangs all cloth inside the opening and behind the wall plane, never repeating a trace name', () => {
    for (const { value: kind } of KINDS) {
      const marks = clothMarks(covered(kind, ZONE_CEILING[kind]), OPENING);
      for (const mark of marks) {
        expect(mark.z, `${kind} sort bucket`).toBeLessThan(SHELL_Z.glass);
        for (const p of mark.pts) {
          expect(p.x, `${kind} x`).toBeGreaterThanOrEqual(OPENING.left - 1e-9);
          expect(p.x, `${kind} x`).toBeLessThanOrEqual(OPENING.right + 1e-9);
          expect(p.y, `${kind} y`).toBeGreaterThanOrEqual(OPENING.top - 1e-9);
          expect(p.y, `${kind} y`).toBeLessThanOrEqual(OPENING.bottom + 1e-9);
          expect(p.z, `${kind} depth`).toBeLessThan(0);
        }
      }
      const names = strokes(marks).map((s) => s.name);
      expect(new Set(names).size, kind).toBe(names.length);
    }
  });

  it('keeps the panels in their side strips, bounded by the rolled reach and its jitter', () => {
    const halfW = (OPENING.right - OPENING.left) / 2;
    for (const [coverage, widthJitter] of [
      [0.15, 1],
      [0.4, 1.1],
    ] as const) {
      const reach = coverage * halfW * widthJitter;
      const cloth = fills(
        clothMarks({ present: true, kind: 'panels', coverage, rodY: 0, widthJitter, drapeSide: 'left', slatShare: 0 }, OPENING),
      ).filter((f) => f.role === 'fabric');
      for (const fill of cloth) {
        for (const p of fill.pts) {
          const fromLeft = p.x - OPENING.left;
          const fromRight = OPENING.right - p.x;
          expect(
            Math.min(fromLeft, fromRight) <= reach + 1e-9,
            `panel reach ${coverage}×${widthJitter}: x=${p.x}`,
          ).toBe(true);
        }
      }
    }
  });

  it('hangs the panels and the drapes on verticals alone and all the way to the opening head', () => {
    const top = OPENING.top + ROD_CLEARANCE;
    for (const kind of ['panels', 'drapes'] as const) {
      for (const s of strokes(clothMarks(covered(kind, 0.5), OPENING))) {
        const [a, b] = s.pts;
        if (Math.abs(a.y - b.y) < 1e-9) {
          expect(a.y, `${kind} horizontal line`).not.toBeCloseTo(top, 9);
        }
      }
      const cloth = clothFills(clothMarks(covered(kind, 0.5), OPENING));
      expect(cloth.length).toBeGreaterThan(0);
      const clothTop = Math.min(...cloth.flatMap((f) => f.pts.map((p) => p.y)));
      expect(clothTop).toBeCloseTo(OPENING.top, 9);
    }
  });

  it('omits some dense lines outright — the fill carries the texture', () => {
    for (const [kind, totalFolds] of [
      ['panels', 2 * (FOLD_BANDS.panels - 1)],
      ['drapes', FOLD_BANDS.drapes - 1],
      ['roman', FOLD_BANDS.roman],
    ] as const) {
      const folds = strokes(clothMarks(covered(kind, 0.5), OPENING)).filter((s) => s.name.includes('-fold-'));
      expect(folds.length, `${kind} folds kept`).toBeGreaterThan(0);
      expect(folds.length).toBeLessThan(totalFolds);
    }
    const venetian = clothMarks(covered('venetian', 0.7), OPENING);
    const rows = clothFills(venetian, 'blind').length;
    const slats = strokes(venetian).filter((s) => s.name.startsWith('venetian-slat'));
    expect(slats.length, 'slat lines kept').toBeGreaterThan(0);
    expect(slats.length).toBeLessThan(rows);
  });

  it('draws a kept dense line over only part of its run', () => {
    const clothTop = OPENING.top;
    const clothBottom = OPENING.bottom - HEM_CLEARANCE;
    const drop = clothBottom - clothTop;
    for (const kind of ['panels', 'drapes'] as const) {
      const folds = strokes(clothMarks(covered(kind, 0.5), OPENING)).filter((s) => s.name.includes('-fold-'));
      expect(folds.length, `${kind} folds kept`).toBeGreaterThan(0);
      for (const s of folds) {
        const ys = s.pts.map((p) => p.y);
        expect(Math.max(...ys) - Math.min(...ys), `${kind} fold height`).toBeLessThan(drop - 1e-9);
      }
    }
    const width = OPENING.right - OPENING.left;
    for (const [kind, prefix] of [
      ['roman', 'roman-fold'],
      ['venetian', 'venetian-slat'],
    ] as const) {
      const lines = strokes(clothMarks(covered(kind, 0.7), OPENING)).filter((s) => s.name.startsWith(prefix));
      expect(lines.length, `${prefix} kept`).toBeGreaterThan(0);
      for (const s of lines) {
        const xs = s.pts.map((p) => p.x);
        expect(Math.max(...xs) - Math.min(...xs), `${prefix} span`).toBeLessThan(width - 1e-9);
      }
    }
  });

  it('hangs the drapes from its rolled side', () => {
    const width = OPENING.right - OPENING.left;
    const span = 0.5 * width;
    const left = clothFills(
      clothMarks({ present: true, kind: 'drapes', coverage: 0.5, rodY: 0, widthJitter: 1, drapeSide: 'left', slatShare: 0 }, OPENING),
    );
    const right = clothFills(
      clothMarks({ present: true, kind: 'drapes', coverage: 0.5, rodY: 0, widthJitter: 1, drapeSide: 'right', slatShare: 0 }, OPENING),
    );
    for (const [cloth, side] of [
      [left, 'left'],
      [right, 'right'],
    ] as const) {
      expect(cloth.length).toBeGreaterThanOrEqual(1);
      const xs = cloth.flatMap((f) => f.pts.map((p) => p.x));
      const near = side === 'left' ? Math.min(...xs) - OPENING.left : OPENING.right - Math.max(...xs);
      expect(near).toBeLessThan(1e-9);
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(span + 1e-9);
    }
  });

  it('spans the drapes no wider than the rolled coverage', () => {
    const width = OPENING.right - OPENING.left;
    for (const coverage of [0.2, 0.6]) {
      const cloth = fills(clothMarks(covered('drapes', coverage), OPENING)).filter((f) => f.role === 'fabric');
      expect(cloth.length).toBeGreaterThanOrEqual(1);
      const xs = cloth.flatMap((f) => f.pts.map((p) => p.x));
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(coverage * width + 1e-9);
    }
  });

  it('hangs venetian and roman no deeper than the rolled coverage', () => {
    const height = OPENING.bottom - OPENING.top;
    for (const kind of ['venetian', 'roman'] as const) {
      for (const coverage of [0.2, 0.6]) {
        const cloth = clothFills(clothMarks(covered(kind, coverage), OPENING));
        expect(cloth.length).toBeGreaterThanOrEqual(1);
        const ys = cloth.flatMap((f) => f.pts.map((p) => p.y));
        expect(Math.max(...ys) - Math.min(...ys), `${kind} drop`).toBeLessThanOrEqual(coverage * height + 1e-9);
      }
    }
  });

  it('spaces the venetian slats down the covered band, more where it reaches lower', () => {
    const shallow = strokes(clothMarks(covered('venetian', 0.2), OPENING)).filter((s) => s.name.startsWith('venetian-slat'));
    const deep = strokes(clothMarks(covered('venetian', 0.7), OPENING)).filter((s) => s.name.startsWith('venetian-slat'));
    expect(deep.length).toBeGreaterThan(shallow.length);
    for (const slat of shallow) {
      expect(slat.pts[0].y).toBeGreaterThanOrEqual(OPENING.top - 1e-9);
      expect(slat.pts[0].y).toBeLessThanOrEqual(OPENING.bottom);
    }
  });

  it('joins the venetian rows opaque when closed, and draws each row down its rolled share when open', () => {
    const height = OPENING.bottom - OPENING.top;
    // The cloth hangs from the rod, a clearance below the opening's head.
    const clothTop = OPENING.top + ROD_CLEARANCE;
    const coveredDrop = OPENING.top + 0.5 * height - clothTop;
    const spanOf = (marks: ReturnType<typeof clothMarks>) => {
      const xs = clothFills(marks, 'blind').flatMap((f) => f.pts.map((p) => p.x));
      return Math.max(...xs) - Math.min(...xs);
    };
    const closed = clothMarks(covered('venetian', 0.5, { slatShare: 0 }), OPENING);
    // Closed: the rows join into one opaque blind — full width, full drop.
    expect(spanOf(closed)).toBeCloseTo(OPENING.right - OPENING.left, 9);
    const closedYs = clothFills(closed, 'blind').flatMap((f) => f.pts.map((p) => p.y));
    expect(Math.max(...closedYs) - Math.min(...closedYs)).toBeCloseTo(coveredDrop, 9);
    // Open: every slat keeps the jambs hard to its edge — no padding — and
    // each opaque face runs down the rolled share of the row.
    const open = clothMarks(covered('venetian', 0.5, { slatShare: 0.8 }), OPENING);
    expect(spanOf(open)).toBeCloseTo(OPENING.right - OPENING.left, 9);
    const faces = clothFills(open, 'blind');
    const rowH = coveredDrop / faces.length;
    for (const f of faces) {
      const ys = f.pts.map((p) => p.y);
      expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(rowH * 0.8, 9);
    }
  });
});
