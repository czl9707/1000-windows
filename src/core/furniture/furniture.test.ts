import { describe, expect, it } from 'vitest';
import { fork } from '@/core/randomness/rng';
import { FURNITURE_KINDS } from './catalogue';
import { expandFurniture } from './furniture';

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
});
