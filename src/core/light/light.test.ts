import { describe, expect, it } from 'vitest';
import { fork } from '@/core/randomness/rng';
import { innerRect } from '@/core/window-shell/shell';
import { expandCurtain, curtainMarks } from '@/core/curtain';
import { expandSill, sillMarks } from '@/core/sill';
import { windowSceneMarks } from '@/core/window';
import { expandShell, shellMarks, type ShellPlan } from '@/core/window-shell';
import { ANCHORS, FACINGS, LAMP_KINDS, LIGHT_Z, type LampKind } from './catalogue';
import { expandLight, type LampPlan } from './light';
import { lampMarks } from './drawLamp';

const OPENING = innerRect(0.07);
const FLOOR_SHADE_KINDS: LampKind[] = ['floorLamp', 'arcLamp', 'tableLamp', 'bedsideLamp'];
const HANGING_KINDS: LampKind[] = ['pendant', 'bulbPendant'];
const INTERIOR_ROLES = ['lamp', 'light', 'ambient', 'aura', 'veil'] as const;

// The stream walk the assembly performs: the light block appends after the
// curtain and sill blocks on the one dna fork.
function rollLightAfterWalk(seed: number): LampPlan {
  const rng = fork(seed, 'dna');
  expandCurtain(rng);
  expandSill(rng);
  return expandLight(rng);
}

describe('the light roll', () => {
  it('lights roughly a third of the street', () => {
    let lit = 0;
    const total = 600;
    for (let i = 0; i < total; i++) if (rollLightAfterWalk(20000 + i * 7919).on) lit++;
    expect(lit / total).toBeGreaterThan(0.25);
    expect(lit / total).toBeLessThan(0.42);
  });

  it('reaches every kind, anchor, and facing across a sweep', () => {
    const kinds = new Set<LampKind>();
    const anchors = new Set<string>();
    const facings = new Set<string>();
    for (let i = 0; i < 600; i++) {
      const plan = rollLightAfterWalk(30000 + i * 104729);
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
  const plan: LampPlan = { on: true, kind: 'floorLamp', location: 'centre', facing: 'right' };

  it('draws the furniture in every room at every state', () => {
    for (const night of [false, true]) {
      for (const on of [false, true]) {
        const marks = lampMarks({ ...plan, on }, OPENING, night);
        expect(marks.some((m) => m.role === 'lamp')).toBe(true);
      }
    }
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

  it('lays the ambient beneath the aura, both over the emitter', () => {
    const marks = lampMarks(plan, OPENING, true);
    const ambientAt = marks.findIndex((m) => m.role === 'ambient');
    const firstAuraAt = marks.findIndex((m) => m.role === 'aura');
    const emitterAt = marks.findIndex((m) => m.role === 'light');
    expect(emitterAt).toBeGreaterThanOrEqual(0);
    expect(ambientAt).toBeGreaterThan(emitterAt);
    expect(ambientAt).toBeLessThan(firstAuraAt);
    expect(marks.some((m) => m.role === 'veil')).toBe(false);
  });

  it('keeps every light mark inside the opening', () => {
    for (const kind of LAMP_KINDS) {
      for (const location of ANCHORS) {
        const marks = lampMarks(
          { on: true, kind: kind.value, location: location.value, facing: 'right' },
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

  it('mirrors the aura with the facing', () => {
    const left = lampMarks({ ...plan, facing: 'left' }, OPENING, true);
    const right = lampMarks({ ...plan, facing: 'right' }, OPENING, true);
    const centreX = (marks: ReturnType<typeof lampMarks>) => {
      const aura = marks.filter((m) => m.role === 'aura');
      return aura.reduce((sum, m) => sum + m.pts.reduce((s, p) => s + p.x, 0) / m.pts.length, 0) / aura.length;
    };
    const anchor = OPENING.left + 0.5 * (OPENING.right - OPENING.left);
    expect(centreX(left)).toBeLessThan(anchor);
    expect(centreX(right)).toBeGreaterThan(anchor);
  });

  it('constructs every kind at every state without throwing', () => {
    for (const kind of LAMP_KINDS) {
      for (const night of [false, true]) {
        for (const on of [false, true]) {
          expect(() =>
            lampMarks({ on, kind: kind.value, location: 'left', facing: 'left' }, OPENING, night),
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
      if (plan.on) {
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
