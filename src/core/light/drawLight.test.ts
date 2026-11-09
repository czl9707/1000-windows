import { describe, expect, it } from 'vitest';
import { lightMarks } from './drawLight';
import { CURTAIN_Z } from '@/core/curtain/catalogue';
import { SHELL_Z, innerRect, type PaneRect } from '@/core/window-shell/shell';
import { KINDS, LIGHT_Z } from './catalogue';
import type { LampKind } from './catalogue';
import type { LightPlan } from './light';

const OPENING = innerRect(0.05);

const plan = (over: Partial<LightPlan> = {}): LightPlan => ({
  on: true,
  kind: 'floor',
  seatX: 0.5,
  facing: 'right',
  ...over,
});

const rolesOf = (marks: ReturnType<typeof lightMarks>) => new Set(marks.map((m) => m.role));

describe('lightMarks', () => {
  // The lamp is furniture in both gene states: an off window still stands
  // its unlit fixture; only a burning lamp washes the room.
  it("draws the off window's lamp unlit, in either theme, never any wash", () => {
    for (const night of [false, true]) {
      const marks = lightMarks(plan({ on: false }), OPENING, night);
      const roles = rolesOf(marks);
      expect(roles.has('lamp'), `night=${night}`).toBe(true);
      expect(roles.has('ink'), `night=${night}`).toBe(true);
      expect(roles.has('emitter'), `night=${night}`).toBe(false);
      expect(roles.has('ambient'), `night=${night}`).toBe(false);
      expect(roles.has('aura'), `night=${night}`).toBe(false);
    }
  });

  it('draws the unlit lamp by day: body and emitter, no light washes', () => {
    const roles = rolesOf(lightMarks(plan(), OPENING, false));
    expect(roles.has('lamp')).toBe(true);
    expect(roles.has('ink')).toBe(true);
    expect(roles.has('emitter')).toBe(false);
    expect(roles.has('ambient')).toBe(false);
    expect(roles.has('aura')).toBe(false);
  });

  it('lights the room at night: emitter, ambient, and aura join the body', () => {
    const roles = rolesOf(lightMarks(plan(), OPENING, true));
    for (const role of ['lamp', 'ink', 'emitter', 'ambient', 'aura'] as const) {
      expect(roles.has(role), role).toBe(true);
    }
  });

  it('reaches all six constructions in both themes', () => {
    for (const kind of KINDS) {
      for (const night of [false, true]) {
        const marks = lightMarks(plan({ kind: kind.value }), OPENING, night);
        expect(marks.length, `${kind.value} night=${night}`).toBeGreaterThan(0);
      }
    }
  });

  it('sorts the whole layer between the backing and the curtain', () => {
    for (const kind of KINDS) {
      for (const night of [false, true]) {
        const marks = lightMarks(plan({ kind: kind.value }), OPENING, night);
        for (const mark of marks) {
          expect(mark.z, `${kind.value} night=${night}`).toBeGreaterThan(SHELL_Z.backing);
          expect(mark.z, `${kind.value} night=${night}`).toBeLessThan(CURTAIN_Z);
        }
      }
    }
  });

  it('keeps every point inside the opening', () => {
    for (const kind of KINDS) {
      for (const night of [false, true]) {
        const marks = lightMarks(plan({ kind: kind.value, seatX: 0.2 }, ), OPENING, night);
        for (const mark of marks) {
          for (const pt of mark.pts) {
            expect(pt.x, `${kind.value} night=${night}`).toBeGreaterThanOrEqual(OPENING.left - 1e-9);
            expect(pt.x, `${kind.value} night=${night}`).toBeLessThanOrEqual(OPENING.right + 1e-9);
            expect(pt.y, `${kind.value} night=${night}`).toBeGreaterThanOrEqual(OPENING.top - 1e-9);
            expect(pt.y, `${kind.value} night=${night}`).toBeLessThanOrEqual(OPENING.bottom + 1e-9);
          }
        }
      }
    }
  });

  it('draws the light washes as flat fills only — the light never boils', () => {
    const marks = lightMarks(plan(), OPENING, true);
    for (const mark of marks) {
      if (mark.role === 'aura' || mark.role === 'ambient' || mark.role === 'emitter') {
        expect(mark.kind, mark.role).toBe('fill');
      }
    }
  });

  it('layers the aura: more than one wash per lit room', () => {
    const marks = lightMarks(plan(), OPENING, true);
    const aura = marks.filter((m) => m.role === 'aura');
    expect(aura.length).toBeGreaterThan(1);
  });
});
