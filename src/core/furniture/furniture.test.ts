import { describe, expect, it } from 'vitest';
import { fork } from '@/core/randomness/rng';
import { FURNITURE_KINDS, PLANE_DEPTH, PLANE_Z } from './catalogue';
import { expandFurniture, type FurniturePiece, type FurniturePlan } from './furniture';
import { drawFurniture } from './drawFurniture';
import { roomOf, ROOM_FLOOR_DROP } from './room';
import { innerRect, SHELL_Z, type PaneRect } from '@/core/window-shell/shell';
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
    // layer's lamps already stand on, imported rather than copied.
    expect(roomOf(OPENING).bottom).toBeCloseTo(OPENING.bottom + LAMP_FLOOR_DROP, 12);
  });

  it('stands every kind on the room floor line below the opening', () => {
    for (const { value: kind } of FURNITURE_KINDS) {
      const marks = drawFurniture(
        { pieces: [{ kind, plane: 3, side: 'left', screen: 'laptop' }] },
        OPENING,
      );
      expect(marks.length, kind).toBeGreaterThan(0);
      expect(roles(marks)).toContain(`furniture${3}`);
      const maxY = Math.max(...marks.flatMap((m) => m.pts.map((p) => p.y)));
      // The pieces are drawn whole — the hidden floor included — and the
      // walk's draw stage clips them at the opening after projection.
      expect(maxY, kind).toBeCloseTo(ROOM.bottom, 6);
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

  it('dresses every piece in its depth plane’s own gray, emitting no light', () => {
    for (let i = 0; i < 200; i++) {
      const rng = fork(87000 + i * 104729, 'dna');
      const plan = expandFurniture(rng, false);
      const marks = drawFurniture(plan, OPENING);
      for (const role of roles(marks)) {
        expect(role).toMatch(/^furniture[2-6]$/);
      }
      for (const piecePlan of plan.pieces.map((p) => ({ pieces: [p] }))) {
        for (const role of roles(drawFurniture(piecePlan, OPENING))) {
          expect(role).toBe(`furniture${piecePlan.pieces[0]!.plane}`);
        }
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
    // The screen sits atop the desk: the topmost furniture fill in the
    // plate is the screen itself.
    const screenW = (marks: Mark[]) => {
      const screen = marks
        .filter((m) => /^furniture[2-6]$/.test(m.role))
        .reduce((top, m) => (Math.min(...m.pts.map((p) => p.y)) < Math.min(...top.pts.map((p) => p.y)) ? m : top));
      const xs = screen.pts.map((p) => p.x);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(screenW(monitor)).toBeGreaterThan(screenW(laptop));
    expect(screenW(monitor)).toBeCloseTo(0.45 * (4 / 3), 6);
  });

  it('carries the ladder shelf as one silhouette — rails and boards, no strokes', () => {
    const marks = drawFurniture(
      { pieces: [{ kind: 'ladderShelf', plane: 5, side: 'left' }] },
      OPENING,
    );
    expect(marks.every((m) => m.kind === 'fill')).toBe(true);
    // Five boards between the rails, all the same gray.
    expect(marks.length).toBe(7);
  });

  it('clears the sightline — every kind shows through the window, the desk with its slab', () => {
    // The floor sits on the lamps' standing line, well below the opening's
    // bottom edge: a kind reads through the window only where some point of
    // its silhouette rises above that sightline. The desk's slab must clear
    // it too — a screen floating over an invisible desk is the failure the
    // eyeball caught once.
    for (const { value: kind } of FURNITURE_KINDS) {
      const marks = drawFurniture(
        { pieces: [{ kind, plane: 3, side: 'left', screen: 'laptop' }] },
        OPENING,
      );
      const clears = marks.some(
        (m) => /^furniture[2-6]$/.test(m.role) && m.pts.some((p) => p.y < OPENING.bottom),
      );
      expect(clears, kind).toBe(true);
      if (kind === 'desk') {
        const slabClears = marks.some(
          (m) => /^furniture[2-6]$/.test(m.role) && m.pts.some((p) => p.y < OPENING.bottom - 0.05),
        );
        expect(slabClears, 'the desk slab itself clears the sightline').toBe(true);
      }
    }
  });

  it('stands spreading crowns further in than the furniture hug', () => {
    // A plant's crown spreads past its footprint; a crown hugging the wall
    // draws half behind it. Every plant kind carries the longer gap the
    // bench needed, on both edges.
    for (const { value: kind } of FURNITURE_KINDS.filter((k) =>
      ['monstera', 'palm', 'yucca', 'olive'].includes(k.value),
    )) {
      const left = drawFurniture({ pieces: [{ kind, plane: 3, side: 'left' }] }, OPENING);
      const right = drawFurniture({ pieces: [{ kind, plane: 3, side: 'right' }] }, OPENING);
      const minX = Math.min(...left.flatMap((m) => m.pts.map((p) => p.x)));
      const maxX = Math.max(...right.flatMap((m) => m.pts.map((p) => p.x)));
      const hug = 0.1 * (OPENING.right - OPENING.left);
      expect(minX, kind).toBeGreaterThan(ROOM.left + hug);
      expect(maxX, kind).toBeLessThan(ROOM.right - hug);
    }
  });

  it('never throws across a sweep', () => {
    for (let i = 0; i < 300; i++) {
      const rng = fork(90000 + i * 104729, 'dna');
      const plan = expandFurniture(rng, false);
      expect(() => drawFurniture(plan, OPENING)).not.toThrow();
    }
  });
});
