import { describe, expect, it } from 'vitest';
import { fork } from '@/core/randomness/rng';
import { FURNITURE_KINDS, PLANE_DEPTH, PLANE_Z } from './catalogue';
import { expandFurniture, type FurniturePiece, type FurniturePlan } from './furniture';
import { drawFurniture } from './drawFurniture';
import { roomOf, ROOM_FLOOR_DROP } from './room';
import { BOX, innerRect, SHELL_Z, type PaneRect } from '@/core/window-shell/shell';
import { FLOOR_DROP as LAMP_FLOOR_DROP, LIGHT_DEPTH, LIGHT_Z } from '@/core/light/catalogue';
import type { Mark } from '@/core/scene';

// The furniture plan rolls off the DNA stream appended after the light
// block. The lamp counts toward the room's cap whenever the room owns one —
// even in daylight — so a lampless room rolls zero, one, or two pieces and
// a lamp room rolls zero or one, and flipping the theme never re-randomizes
// the roll.
describe('the furniture plan roll', () => {
  it('caps a lamp room at one piece and a lampless room at two', () => {
    for (let i = 0; i < 600; i++) {
      const rng = fork(60000 + i * 104729, 'dna');
      expect(expandFurniture(rng, true).pieces.length).toBeLessThanOrEqual(1);
    }
    for (let i = 0; i < 600; i++) {
      const rng = fork(63000 + i * 104729, 'dna');
      expect(expandFurniture(rng, false).pieces.length).toBeLessThanOrEqual(2);
    }
  });

  it('reaches every count the caps allow across a sweep', () => {
    const lampRoomCounts = new Set<number>();
    const bareRoomCounts = new Set<number>();
    for (let i = 0; i < 800; i++) {
      lampRoomCounts.add(expandFurniture(fork(66000 + i * 104729, 'dna'), true).pieces.length);
      bareRoomCounts.add(expandFurniture(fork(69000 + i * 104729, 'dna'), false).pieces.length);
    }
    expect(lampRoomCounts).toEqual(new Set([0, 1]));
    expect(bareRoomCounts).toEqual(new Set([0, 1, 2]));
  });

  it('reads the same room from the same stream and the same lamp flag', () => {
    // The lamp's presence is the only furniture input: the same stream and
    // the same flag must always read the same room.
    for (let i = 0; i < 100; i++) {
      const seed = 72000 + i * 104729;
      expect(expandFurniture(fork(seed, 'dna'), false)).toEqual(
        expandFurniture(fork(seed, 'dna'), false),
      );
    }
  });

  it('puts each piece on its own plane from 2 to 6, one per plane', () => {
    for (let i = 0; i < 600; i++) {
      const rng = fork(75000 + i * 104729, 'dna');
      const plan = expandFurniture(rng, false);
      for (const piece of plan.pieces) {
        expect(piece.plane).toBeGreaterThanOrEqual(2);
        expect(piece.plane).toBeLessThanOrEqual(6);
        expect(Number.isInteger(piece.plane)).toBe(true);
      }
      const planes = plan.pieces.map((p) => p.plane);
      expect(new Set(planes).size).toBe(planes.length);
    }
  });

  it('draws kinds from the catalogue and never repeats a kind in one room', () => {
    const catalogue = new Set(FURNITURE_KINDS.map((k) => k.value));
    for (let i = 0; i < 600; i++) {
      const plan = expandFurniture(fork(78000 + i * 104729, 'dna'), false);
      for (const piece of plan.pieces) expect(catalogue.has(piece.kind)).toBe(true);
      const kinds = plan.pieces.map((p) => p.kind);
      expect(new Set(kinds).size).toBe(kinds.length);
    }
  });

  it('hugs a rolled edge and biases the second piece to the opposite one', () => {
    let opposite = 0;
    let second = 0;
    for (let i = 0; i < 2000; i++) {
      const plan = expandFurniture(fork(81000 + i * 104729, 'dna'), false);
      for (const piece of plan.pieces) {
        expect(['left', 'right']).toContain(piece.side);
      }
      if (plan.pieces.length === 2) {
        second++;
        const [first, secondPiece] = plan.pieces;
        if (secondPiece.side !== first.side) opposite++;
      }
    }
    // A soft bias, not a rule: the second piece prefers the opposite edge
    // most of the time, same-edge rooms stay possible.
    expect(second).toBeGreaterThan(200);
    expect(opposite / second).toBeGreaterThan(0.55);
    expect(opposite / second).toBeLessThan(0.95);
  });

  it('rolls a screen for a desk piece and nothing for the other kinds', () => {
    for (let i = 0; i < 800; i++) {
      const plan = expandFurniture(fork(84000 + i * 104729, 'dna'), false);
      for (const piece of plan.pieces) {
        if (piece.kind === 'desk') {
          expect(['laptop', 'monitor']).toContain(piece.screen);
        } else {
          expect(piece.screen).toBeUndefined();
        }
      }
    }
  });
});

// The drawer: the room rectangle with its real floor under edge-hugging
// pieces, drawn even where the wall hides them, on the planes' own sort
// keys — back to front, always under the light block.
const OPENING: PaneRect = innerRect(0.07);
const ROOM = roomOf(OPENING);
const EPS = 1e-9;

const piece = (over: Partial<FurniturePiece>): FurniturePlan => ({
  pieces: [{ kind: 'coatStand', plane: 4, side: 'left', ...over }],
});

const roles = (marks: Mark[]) => marks.map((m) => m.role);

describe('the furniture drawer', () => {
  it('draws nothing for an empty room', () => {
    expect(drawFurniture({ pieces: [] }, OPENING)).toEqual([]);
  });

  it('keeps the room floor on the lamps standing line', () => {
    // One room, one floor: the furniture's floor is the line the light
    // layer's lamps already stand on, pinned here so the copies cannot
    // drift.
    expect(ROOM_FLOOR_DROP).toBe(LAMP_FLOOR_DROP);
    expect(roomOf(OPENING).bottom).toBeCloseTo(OPENING.bottom + LAMP_FLOOR_DROP, 12);
  });

  it('runs every kind down past the box toward the room floor', () => {
    for (const { value: kind } of FURNITURE_KINDS) {
      const marks = drawFurniture(
        { pieces: [{ kind, plane: 3, side: 'left', screen: 'laptop' }] },
        OPENING,
      );
      expect(marks.length, kind).toBeGreaterThan(0);
      expect(roles(marks)).toContain('furniture');
      const maxY = Math.max(...marks.flatMap((m) => m.pts.map((p) => p.y)));
      // The legs run to the room floor, most of an opening below the
      // sightline; the box clip is all the wall ever sees of the cut.
      expect(maxY, kind).toBeCloseTo(BOX.halfH, 6);
    }
  });

  it('lands nothing on the wall around the window', () => {
    for (let i = 0; i < 300; i++) {
      const rng = fork(91000 + i * 104729, 'dna');
      const marks = drawFurniture(expandFurniture(rng, false), OPENING);
      for (const m of marks) {
        for (const p of m.pts) {
          expect(Math.abs(p.x)).toBeLessThanOrEqual(BOX.halfW + EPS);
          expect(Math.abs(p.y)).toBeLessThanOrEqual(BOX.halfH + EPS);
        }
      }
    }
  });

  it('hugs its rolled edge with a small gap inside the room rectangle', () => {
    for (const side of ['left', 'right'] as const) {
      const marks = drawFurniture(piece({ side, kind: 'roomDivider' }), OPENING);
      const minX = Math.min(...marks.flatMap((m) => m.pts.map((p) => p.x)));
      const maxX = Math.max(...marks.flatMap((m) => m.pts.map((p) => p.x)));
      const hug = 0.1 * (OPENING.right - OPENING.left);
      if (side === 'left') {
        expect(minX).toBeGreaterThanOrEqual(ROOM.left - EPS);
        expect(minX).toBeLessThanOrEqual(ROOM.left + hug);
      } else {
        expect(maxX).toBeLessThanOrEqual(ROOM.right + EPS);
        expect(maxX).toBeGreaterThanOrEqual(ROOM.right - hug);
      }
    }
  });

  it('draws past the opening — no clipping bares a hard cut', () => {
    const marks = drawFurniture(piece({ side: 'left', kind: 'roomDivider' }), OPENING);
    expect(Math.min(...marks.flatMap((m) => m.pts.map((p) => p.x)))).toBeLessThan(OPENING.left);
  });

  it('sorts its planes back to front, always under the light block and over the backing', () => {
    for (const plane of [2, 3, 4, 5, 6] as const) {
      const marks = drawFurniture(piece({ plane }), OPENING);
      expect(marks.length).toBeGreaterThan(0);
      for (const m of marks) {
        expect(m.z).toBe(PLANE_Z[plane]);
        for (const p of m.pts) expect(p.z).toBe(PLANE_DEPTH[plane]);
        expect(m.z).toBeLessThan(LIGHT_Z);
        expect(m.z).toBeGreaterThan(SHELL_Z.backing);
      }
    }
    expect(PLANE_Z[6]).toBeLessThan(PLANE_Z[2]);
    expect(PLANE_DEPTH[2]).toBeGreaterThan(PLANE_DEPTH[6]);
    // Plane 1 is the lamp's: the furniture sits behind it, deeper in the
    // room, so its depth is the more negative.
    expect(PLANE_DEPTH[2]).toBeLessThan(LIGHT_DEPTH);
  });

  it('keeps to the two furniture roles, the screen in the same gray, emitting no light', () => {
    for (let i = 0; i < 200; i++) {
      const rng = fork(87000 + i * 104729, 'dna');
      const plan = expandFurniture(rng, false);
      const marks = drawFurniture(plan, OPENING);
      for (const role of roles(marks)) {
        expect(['furniture', 'furnitureDetail']).toContain(role);
      }
    }
    // The desk's screen is part of the desk's silhouette — the same gray as
    // every piece — and the monitor wears the typical desktop ratio.
    const laptop = drawFurniture(
      { pieces: [{ kind: 'desk', plane: 2, side: 'right', screen: 'laptop' }] },
      OPENING,
    );
    const monitor = drawFurniture(
      { pieces: [{ kind: 'desk', plane: 2, side: 'right', screen: 'monitor' }] },
      OPENING,
    );
    const screenW = (marks: Mark[]) => {
      const xs = marks.filter((m) => m.role === 'furniture').flatMap((m) => m.pts.map((p) => p.x));
      return Math.max(...xs) - Math.min(...xs);
    };
    // The monitor's panel: 0.35 tall, 4:3 wide.
    expect(screenW(monitor)).toBeGreaterThan(screenW(laptop));
    expect(screenW(monitor)).toBeCloseTo(0.35 * (4 / 3), 6);
  });

  it('obeys the hand rule on the boards of a ladder shelf', () => {
    const marks = drawFurniture(
      { pieces: [{ kind: 'ladderShelf', plane: 5, side: 'left' }] },
      OPENING,
    );
    const boards = marks.filter((m) => m.kind === 'stroke' && m.name.includes('board'));
    // Five boards designed; the hand rule omits some outright, and the box
    // clip keeps only what the sightline shows — either way fewer kept
    // lines than the run holds.
    expect(boards.length).toBeLessThan(5);
    expect(boards.length).toBeGreaterThan(0);
    const widths = boards.map(
      (m) => Math.max(...m.pts.map((p) => p.x)) - Math.min(...m.pts.map((p) => p.x)),
    );
    const shelfW = 0.3 * (OPENING.right - OPENING.left);
    // A kept line runs over only part of its span at least somewhere.
    expect(widths.some((w) => w < shelfW * 0.9)).toBe(true);
  });

  it('names its traces uniquely and never throws across a sweep', () => {
    for (let i = 0; i < 300; i++) {
      const rng = fork(90000 + i * 104729, 'dna');
      const plan = expandFurniture(rng, false);
      const marks = drawFurniture(plan, OPENING);
      const names = marks.filter((m) => m.kind === 'stroke').map((m) => m.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
