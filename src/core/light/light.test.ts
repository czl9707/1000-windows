import { describe, expect, it } from 'vitest';
import { fork } from '@/core/randomness/rng';
import { innerRect } from '@/core/window-shell/shell';
import { expandCurtain, curtainMarks } from '@/core/curtain';
import { expandSill, sillMarks } from '@/core/sill';
import { windowSceneMarks } from '@/core/window';
import { expandShell, shellMarks, type ShellPlan } from '@/core/window-shell';
import { ANCHORS, ANCHOR_X, FACINGS, FLOOR_DROP, FLOOR_LAMP_REACH, LAMP_KINDS, LIGHT_Z, type LampKind } from './catalogue';

import { expandLight, type LampPlan, type OwnedLamp } from './light';
import { lampMarks } from './drawLamp';

const OPENING = innerRect(0.07);
const INTERIOR_ROLES = ['lamp', 'lampShade', 'light', 'ambient', 'aura', 'veil'] as const;

// The stream walk the assembly performs: the light block appends after the
// curtain and sill blocks on the one dna fork.
function rollLightAfterWalk(seed: number): LampPlan {
  const rng = fork(seed, 'dna');
  expandCurtain(rng);
  expandSill(rng);
  return expandLight(rng);
}

describe('the light roll', () => {
  it('gives two rooms in three a lamp', () => {
    let present = 0;
    const total = 600;
    for (let i = 0; i < total; i++) {
      if (rollLightAfterWalk(20000 + i * 7919).present) present++;
    }
    expect(present / total).toBeGreaterThan(0.58);
    expect(present / total).toBeLessThan(0.75);
  });

  it('lights half of the lamp rooms', () => {
    let lit = 0;
    let owned = 0;
    for (let i = 0; i < 600; i++) {
      const plan = rollLightAfterWalk(21000 + i * 7919);
      if (!plan.present) continue;
      owned++;
      if (plan.on) lit++;
    }
    expect(owned).toBeGreaterThan(100);
    expect(lit / owned).toBeGreaterThan(0.4);
    expect(lit / owned).toBeLessThan(0.6);
  });

  it('reaches every kind, anchor, and facing across a sweep', () => {
    const kinds = new Set<LampKind>();
    const anchors = new Set<string>();
    const facings = new Set<string>();
    for (let i = 0; i < 600; i++) {
      const plan = rollLightAfterWalk(30000 + i * 104729);
      if (!plan.present) continue;
      kinds.add(plan.kind);
      anchors.add(plan.location);
      facings.add(plan.facing);
    }
    for (const kind of LAMP_KINDS) expect(kinds).toContain(kind.value);
    for (const anchor of ANCHORS) expect(anchors).toContain(anchor.value);
    for (const facing of FACINGS) expect(facings).toContain(facing.value);
  });
});

describe('lampMarks', () => {
  const plan: OwnedLamp = { present: true, on: true, kind: 'floorLamp', location: 'innerLeft', facing: 'right' };

  it('draws nothing for a lampless room by day, and only the veil at night', () => {
    const day = lampMarks({ present: false }, OPENING, false);
    expect(day).toEqual([]);
    const night = lampMarks({ present: false }, OPENING, true);
    expect(night.length).toBe(1);
    expect(night[0].role).toBe('veil');
  });

  it('draws the furniture in every owned room at every state', () => {
    for (const night of [false, true]) {
      for (const on of [false, true]) {
        const marks = lampMarks({ ...plan, on }, OPENING, night);
        expect(marks.some((m) => m.role === 'lamp')).toBe(true);
      }
    }
  });

  it('dresses the unlit emitter in its own colour, not the dark structure paint', () => {
    for (const night of [false, true]) {
      const marks = lampMarks({ ...plan, on: false }, OPENING, night);
      expect(marks.some((m) => m.role === 'lampShade')).toBe(true);
    }
    const lit = lampMarks(plan, OPENING, true);
    expect(lit.some((m) => m.role === 'light')).toBe(true);
    expect(lit.some((m) => m.role === 'lampShade')).toBe(false);
  });

  it('gates the light on the night theme: day emits no veil, ambient, aura, or warm emitter', () => {
    const marks = lampMarks(plan, OPENING, false);
    for (const role of ['veil', 'ambient', 'aura', 'light'] as const) {
      expect(marks.some((m) => m.role === role)).toBe(false);
    }
  });

  it('veils an unlit room at night and lights nothing', () => {
    const marks = lampMarks({ ...plan, on: false }, OPENING, true);
    expect(marks.some((m) => m.role === 'veil')).toBe(true);
    for (const role of ['ambient', 'aura', 'light'] as const) {
      expect(marks.some((m) => m.role === role)).toBe(false);
    }
  });

  it('lays the ambient beneath the aura, both over the emitter, and fades the shade auras from the lamp: one cone to the floor, one to the ceiling', () => {
    const marks = lampMarks(plan, OPENING, true);
    const ambientAt = marks.findIndex((m) => m.role === 'ambient');
    const firstAuraAt = marks.findIndex((m) => m.role === 'aura');
    const emitterAt = marks.findIndex((m) => m.role === 'light');
    expect(emitterAt).toBeGreaterThanOrEqual(0);
    expect(ambientAt).toBeGreaterThan(emitterAt);
    expect(ambientAt).toBeLessThan(firstAuraAt);
    expect(marks.some((m) => m.role === 'veil')).toBe(false);
    const h = OPENING.bottom - OPENING.top;
    const auras = marks.filter((m) => m.role === 'aura');
    expect(auras.length).toBe(6);
    const shadeBottom = OPENING.bottom + FLOOR_DROP - FLOOR_LAMP_REACH * h;
    const shadeTop = shadeBottom - 0.14 * h;
    for (const aura of auras) {
      const top = Math.min(...aura.pts.map((p) => p.y));
      const bottom = Math.max(...aura.pts.map((p) => p.y));
      const anchored = Math.abs(top - shadeBottom) < 1e-6 || Math.abs(bottom - shadeTop) < 1e-6;
      expect(anchored, 'every aura pass stays anchored on the shade').toBe(true);
    }
    const lowest = Math.max(...auras.map((a) => Math.max(...a.pts.map((p) => p.y))));
    const highest = Math.min(...auras.map((a) => Math.min(...a.pts.map((p) => p.y))));
    expect(lowest).toBeCloseTo(OPENING.bottom, 6);
    expect(highest).toBe(OPENING.top);
  });

  it('keeps every light mark inside the opening', () => {
    for (const kind of LAMP_KINDS) {
      for (const location of ANCHORS) {
        const marks = lampMarks(
          { present: true, on: true, kind: kind.value, location: location.value, facing: 'right' },
          OPENING,
          true,
        );
        for (const mark of marks) {
          for (const p of mark.pts) {
            expect(p.x).toBeGreaterThanOrEqual(OPENING.left - 1e-9);
            expect(p.x).toBeLessThanOrEqual(OPENING.right + 1e-9);
            expect(p.y).toBeGreaterThanOrEqual(OPENING.top - 1e-9);
            expect(p.y).toBeLessThanOrEqual(OPENING.bottom + 1e-9);
          }
        }
      }
    }
  });

  it('keeps every arc aura pass centred on the dome', () => {
    const arc: OwnedLamp = { present: true, on: true, kind: 'arcLamp', location: 'innerLeft', facing: 'right' };
    const marks = lampMarks(arc, OPENING, true);
    const emitters = marks.filter((m) => m.role === 'light');
    expect(emitters.length).toBe(1);
    const emitter = emitters[0];
    const centre = (m: typeof emitter) => ({
      x: m.pts.reduce((s, p) => s + p.x, 0) / m.pts.length,
      y: m.pts.reduce((s, p) => s + p.y, 0) / m.pts.length,
    });
    for (const aura of marks.filter((m) => m.role === 'aura')) {
      expect(centre(aura).x).toBeCloseTo(centre(emitter).x, 6);
      expect(centre(aura).y).toBeCloseTo(centre(emitter).y, 6);
    }
  });

  it('mirrors the arc aura with the facing: the pool follows the arm', () => {
    const arc: OwnedLamp = { present: true, on: true, kind: 'arcLamp', location: 'innerLeft', facing: 'right' };
    const centreX = (marks: ReturnType<typeof lampMarks>) => {
      const aura = marks.filter((m) => m.role === 'aura');
      return aura.reduce((sum, m) => sum + m.pts.reduce((s, p) => s + p.x, 0) / m.pts.length, 0) / aura.length;
    };
    const anchor = OPENING.left + ANCHOR_X.innerLeft * (OPENING.right - OPENING.left);
    expect(centreX(lampMarks({ ...arc, facing: 'left' }, OPENING, true))).toBeLessThan(anchor);
    expect(centreX(lampMarks({ ...arc, facing: 'right' }, OPENING, true))).toBeGreaterThan(anchor);
  });

  it('centres the symmetric auras on the lamp axis, facing or not', () => {
    const centreX = (marks: ReturnType<typeof lampMarks>) => {
      const aura = marks.filter((m) => m.role === 'aura');
      return aura.reduce((sum, m) => sum + m.pts.reduce((s, p) => s + p.x, 0) / m.pts.length, 0) / aura.length;
    };
    const axis = OPENING.left + ANCHOR_X.innerLeft * (OPENING.right - OPENING.left);
    for (const kind of LAMP_KINDS) {
      if (kind.value === 'arcLamp') continue;
      const left = centreX(
        lampMarks({ present: true, on: true, kind: kind.value, location: 'innerLeft', facing: 'left' }, OPENING, true),
      );
      const right = centreX(
        lampMarks({ present: true, on: true, kind: kind.value, location: 'innerLeft', facing: 'right' }, OPENING, true),
      );
      expect(Math.abs(left - axis)).toBeLessThan(1e-9);
      expect(Math.abs(right - axis)).toBeLessThan(1e-9);
    }
  });

  it('constructs every kind at every state without throwing', () => {
    for (const kind of LAMP_KINDS) {
      for (const night of [false, true]) {
        for (const on of [false, true]) {
          expect(() =>
            lampMarks({ present: true, on, kind: kind.value, location: 'left', facing: 'left' }, OPENING, night),
          ).not.toThrow();
        }
      }
    }
  });
});

describe('the light block in the assembled scene', () => {
  const planFor = (seed: number): ShellPlan => expandShell(seed);

  it('sorts the whole block under the curtain cloth', () => {
    for (let i = 0; i < 50; i++) {
      const seed = 50000 + i * 104729;
      const marks = windowSceneMarks(seed, planFor(seed), true);
      const curtainTop = Math.min(
        ...marks.filter((m) => m.role === 'fabric').map((m) => m.z),
      );
      const lightTop = Math.max(
        ...marks.filter((m) => (INTERIOR_ROLES as readonly string[]).includes(m.role)).map((m) => m.z),
      );
      expect(lightTop).toBeLessThan(curtainTop);
    }
  });

  it('reads the state off the appended stream: a lit seed lights, a dark seed veils', () => {
    let sawLit = false;
    let sawVeiled = false;
    for (let i = 0; i < 200; i++) {
      const seed = 60000 + i * 104729;
      const plan = rollLightAfterWalk(seed);
      const marks = windowSceneMarks(seed, planFor(seed), true);
      const roles = new Set(marks.map((m) => m.role));
      if (!plan.present) {
        sawVeiled ||= roles.has('veil');
        expect(roles.has('aura')).toBe(false);
      } else if (plan.on) {
        sawLit ||= roles.has('aura');
        expect(roles.has('veil')).toBe(false);
      } else {
        sawVeiled ||= roles.has('veil');
        expect(roles.has('aura')).toBe(false);
      }
    }
    expect(sawLit).toBe(true);
    expect(sawVeiled).toBe(true);
  });

  it('keeps every lamp stroke name unique within the window', () => {
    for (let i = 0; i < 100; i++) {
      const seed = 70000 + i * 104729;
      const marks = windowSceneMarks(seed, planFor(seed), true);
      const strokes = marks.filter((m) => m.kind === 'stroke' && m.name.startsWith('lamp-'));
      const names = strokes.map((m) => (m as { name: string }).name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('sits the whole block at the interior depth sort key', () => {
    const marks = windowSceneMarks(80001, planFor(80001), true);
    const light = marks.filter((m) => (INTERIOR_ROLES as readonly string[]).includes(m.role));
    expect(light.length).toBeGreaterThan(0);
    for (const mark of light) expect(mark.z).toBe(LIGHT_Z);
  });

  it('appends without re-randomizing: the curtain and sill blocks match the un-appended walk', () => {
    for (let i = 0; i < 100; i++) {
      const seed = 90000 + i * 104729;
      const plan = planFor(seed);
      const assembled = windowSceneMarks(seed, plan, true).filter((m) => m.z !== LIGHT_Z);
      // The walk without the light block: the same fork consumed by the
      // curtain and sill alone, over the shell's own opening.
      const rng = fork(seed, 'dna');
      const opening = innerRect(plan.faceWidth);
      const expected = [
        ...shellMarks(plan),
        ...curtainMarks(rng, opening),
        ...sillMarks(rng, opening),
      ];
      expect(assembled).toEqual(expected);
    }
  });
});
