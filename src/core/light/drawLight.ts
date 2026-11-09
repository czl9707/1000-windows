// The light drawer: one pure emitter per kind — floor, arc, table, bedside,
// pendant, bare — turning a light plan into the marks of one lamp in the
// room. Three parts per lamp: the structure, drawn like any object (fill in
// the lamp role + ink line); the emitter, whose fill lights when the lamp
// burns and dresses in the body role otherwise; the aura, flat washes laid
// over the layers behind, clipped inside the opening, never boiling — fills
// only. The ambient wash covers the room before any of it. The lamp is
// furniture in both themes and both gene states: an off window still stands
// its unlit fixture; only the burning lamp washes the room. Points sit at
// the room's depth behind the curtain cloth; the z rides only as the sort
// bucket. Trace names are bare ids unique within a window.
import type { Mark } from '@/core/scene';
import { WEIGHTS } from '@/styling/weights';
import type { ColorRole } from '@/styling/roles';
import { line, rectPts, type PaneRect } from '@/core/window-shell/shell';
import { LIGHT_DEPTH, LIGHT_Z, type Facing } from './catalogue';
import type { LightPlan } from './light';

// The kind constants of the lamp, in unit measure. Heights stay under half
// the opening's height; widths stay inside the seat margins.
const FLOOR = { baseW: 0.16, baseH: 0.02, shadeBotW: 0.17, shadeTopW: 0.09, shadeH: 0.12, standH: 0.3 };
const ARC = { baseW: 0.14, baseH: 0.02, standH: 0.26, headR: 0.07, headDrop: 0.38, headReach: 0.3 };
const TABLE = { baseW: 0.16, baseH: 0.02, standH: 0.3, drumW: 0.18, drumH: 0.1 };
const BEDSIDE = { baseW: 0.1, baseH: 0.015, standH: 0.1, shadeTopW: 0.09, shadeBotW: 0.13, shadeH: 0.08 };
const PENDANT = { cord: 0.12, shadeTopW: 0.06, shadeBotW: 0.22, shadeH: 0.1 };
const BARE = { cord: 0.16, bulbR: 0.045 };

// The aura spreads, in unit measure — the reach of the light per kind; the
// clip trims every wash against the opening.
const AURA = { cone: 0.42, pool: 0.3, band: 0.16 };

const atDepth = () => LIGHT_DEPTH;

type XY = [number, number];

export function lightMarks(plan: LightPlan, opening: PaneRect, night: boolean): Mark[] {
  const cx = opening.left + plan.seatX * (opening.right - opening.left);
  const clip = clipTo(opening);
  const lit = plan.on && night;
  const marks = CONSTRUCTIONS[plan.kind]({
    cx,
    floor: opening.bottom,
    ceiling: opening.top,
    lit,
    facing: plan.facing,
    clip,
  });
  return lit ? [ambient(opening, clip), ...marks] : marks;
}

// Clip helpers: every point the layer emits stays inside the opening, the
// frame edge the light never passes.
type Clip = ReturnType<typeof clipTo>;

function clipTo(opening: PaneRect) {
  const x = (v: number) => Math.min(Math.max(v, opening.left), opening.right);
  const y = (v: number) => Math.min(Math.max(v, opening.top), opening.bottom);
  return {
    x,
    y,
    poly: (pts: XY[]): XY[] => pts.map(([px, py]) => [x(px), y(py)]),
  };
}

function ambient(opening: PaneRect, clip: Clip): Mark {
  return {
    kind: 'fill',
    pts: clip
      .poly([
        [opening.left, opening.top],
        [opening.right, opening.top],
        [opening.right, opening.bottom],
        [opening.left, opening.bottom],
      ])
      .map(([x, y]) => ({ x, y, z: atDepth() })),
    role: 'ambient',
    z: LIGHT_Z,
  };
}

function fillMark(role: ColorRole, pts: XY[], clip: Clip): Mark {
  return { kind: 'fill', pts: clip.poly(pts).map(([x, y]) => ({ x, y, z: atDepth() })), role, z: LIGHT_Z };
}

function rectFill(role: ColorRole, x0: number, y0: number, x1: number, y1: number): Mark {
  return { kind: 'fill', pts: rectPts(x0, y0, x1, y1, atDepth), role, z: LIGHT_Z };
}

function inkLine(name: string, x0: number, y0: number, x1: number, y1: number): Mark {
  return { kind: 'stroke', pts: line(x0, y0, x1, y1, atDepth), name, widthUnits: WEIGHTS.texture, role: 'ink', z: LIGHT_Z };
}

function outline(name: string, pts: XY[], clip: Clip): Mark {
  return {
    kind: 'stroke',
    pts: clip.poly(pts).map(([x, y]) => ({ x, y, z: atDepth() })),
    name,
    widthUnits: WEIGHTS.texture,
    role: 'ink',
    z: LIGHT_Z,
  };
}

// The shade of a floor or bedside lamp: a trapezoid, opening downward.
function trapezoid(cx: number, topY: number, topW: number, botW: number, h: number): XY[] {
  return [
    [cx - topW / 2, topY],
    [cx + topW / 2, topY],
    [cx + botW / 2, topY + h],
    [cx - botW / 2, topY + h],
  ];
}

// A round pool as an octagon — the fills are polygons, and eight sides read
// round at this scale.
function octagon(cx: number, cy: number, r: number): XY[] {
  const pts: XY[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

// The light washes: nested polygons over one shape, the overlap carrying the
// falloff as layered flat washes — no gradient anywhere.
function rings(role: ColorRole, shapes: XY[][], clip: Clip): Mark[] {
  return shapes.map((pts) => fillMark(role, pts, clip));
}

interface Lamp {
  cx: number;
  floor: number;
  ceiling: number;
  lit: boolean;
  facing: Facing;
  clip: Clip;
}

// The emitting fill takes its role from the state: light fill when the lamp
// burns, the body's ordinary fill otherwise.
function emitterRole(lit: boolean): ColorRole {
  return lit ? 'emitter' : 'lamp';
}

function baseMark(c: Lamp, w: number, h: number): Mark[] {
  return [
    rectFill('lamp', c.cx - w / 2, c.floor - h, c.cx + w / 2, c.floor),
    inkLine('lamp-base', c.cx - w / 2, c.floor - h, c.cx + w / 2, c.floor - h),
  ];
}

// Each construction: the structure marks, the emitting fill, the aura rings.
const CONSTRUCTIONS: Record<LightPlan['kind'], (c: Lamp) => Mark[]> = {
  floor: (c) => {
    const shadeTop = c.floor - FLOOR.baseH - FLOOR.standH - FLOOR.shadeH;
    const shadeBot = shadeTop + FLOOR.shadeH;
    return [
      ...baseMark(c, FLOOR.baseW, FLOOR.baseH),
      inkLine('lamp-floor-pole', c.cx, c.floor - FLOOR.baseH, c.cx, shadeBot),
      fillMark(emitterRole(c.lit), trapezoid(c.cx, shadeTop, FLOOR.shadeTopW, FLOOR.shadeBotW, FLOOR.shadeH), c.clip),
      outline('lamp-floor-shade', trapezoid(c.cx, shadeTop, FLOOR.shadeTopW, FLOOR.shadeBotW, FLOOR.shadeH), c.clip),
      ...(c.lit
        ? rings('aura', [
            [
              [c.cx - FLOOR.shadeBotW / 2, shadeBot],
              [c.cx + FLOOR.shadeBotW / 2, shadeBot],
              [c.cx + AURA.cone, c.floor],
              [c.cx - AURA.cone, c.floor],
            ],
            [
              [c.cx - FLOOR.shadeBotW / 3, shadeBot],
              [c.cx + FLOOR.shadeBotW / 3, shadeBot],
              [c.cx + AURA.pool, c.floor],
              [c.cx - AURA.pool, c.floor],
            ],
            trapezoid(c.cx, shadeTop - 0.05, FLOOR.shadeTopW + 0.06, FLOOR.shadeTopW + 0.1, 0.05),
          ], c.clip)
        : []),
    ];
  },

  arc: (c) => {
    const headX = c.cx + (c.facing === 'left' ? -ARC.headReach : ARC.headReach);
    const headY = c.ceiling + ARC.headDrop;
    const shoulderY = c.floor - ARC.baseH - ARC.standH;
    return [
      ...baseMark(c, ARC.baseW, ARC.baseH),
      inkLine('lamp-arc-rise', c.cx, c.floor - ARC.baseH, c.cx, shoulderY),
      inkLine('lamp-arc-sweep', c.cx, shoulderY, headX, headY),
      fillMark(emitterRole(c.lit), octagon(headX, headY, ARC.headR), c.clip),
      ...(c.lit
        ? rings(
            'aura',
            [octagon(headX, headY + 0.06, AURA.cone), octagon(headX, headY + 0.04, AURA.pool)],
            c.clip,
          )
        : []),
    ];
  },

  table: (c) => {
    const drumTop = c.floor - TABLE.baseH - TABLE.standH - TABLE.drumH;
    const drumBot = drumTop + TABLE.drumH;
    return [
      ...baseMark(c, TABLE.baseW, TABLE.baseH),
      inkLine('lamp-table-stem', c.cx, c.floor - TABLE.baseH, c.cx, drumBot),
      rectFill(emitterRole(c.lit), c.cx - TABLE.drumW / 2, drumTop, c.cx + TABLE.drumW / 2, drumBot),
      inkLine('lamp-table-drum-top', c.cx - TABLE.drumW / 2, drumTop, c.cx + TABLE.drumW / 2, drumTop),
      inkLine('lamp-table-drum-bot', c.cx - TABLE.drumW / 2, drumBot, c.cx + TABLE.drumW / 2, drumBot),
      ...(c.lit
        ? rings('aura', [
            [
              [c.cx - TABLE.drumW / 2 - AURA.band, drumTop],
              [c.cx + TABLE.drumW / 2 + AURA.band, drumTop],
              [c.cx + TABLE.drumW / 2 + AURA.band, drumTop - 0.07],
              [c.cx - TABLE.drumW / 2 - AURA.band, drumTop - 0.07],
            ],
            [
              [c.cx - TABLE.drumW / 2 - AURA.band, drumBot],
              [c.cx + TABLE.drumW / 2 + AURA.band, drumBot],
              [c.cx + TABLE.drumW / 2 + AURA.band, drumBot + 0.07],
              [c.cx - TABLE.drumW / 2 - AURA.band, drumBot + 0.07],
            ],
            [
              [c.cx - AURA.pool, c.floor],
              [c.cx + AURA.pool, c.floor],
              [c.cx + AURA.pool * 0.5, c.floor - 0.08],
              [c.cx - AURA.pool * 0.5, c.floor - 0.08],
            ],
          ], c.clip)
        : []),
    ];
  },

  bedside: (c) => {
    const shadeTop = c.floor - BEDSIDE.baseH - BEDSIDE.standH - BEDSIDE.shadeH;
    const shadeBot = shadeTop + BEDSIDE.shadeH;
    return [
      ...baseMark(c, BEDSIDE.baseW, BEDSIDE.baseH),
      inkLine('lamp-bedside-stem', c.cx, c.floor - BEDSIDE.baseH, c.cx, shadeBot),
      fillMark(emitterRole(c.lit), trapezoid(c.cx, shadeTop, BEDSIDE.shadeTopW, BEDSIDE.shadeBotW, BEDSIDE.shadeH), c.clip),
      outline('lamp-bedside-shade', trapezoid(c.cx, shadeTop, BEDSIDE.shadeTopW, BEDSIDE.shadeBotW, BEDSIDE.shadeH), c.clip),
      ...(c.lit
        ? rings('aura', [
            [
              [c.cx - BEDSIDE.shadeBotW / 2, shadeBot],
              [c.cx + BEDSIDE.shadeBotW / 2, shadeBot],
              [c.cx + AURA.pool, c.floor],
              [c.cx - AURA.pool, c.floor],
            ],
            trapezoid(c.cx, shadeTop - 0.04, BEDSIDE.shadeTopW + 0.05, BEDSIDE.shadeTopW + 0.09, 0.04),
          ], c.clip)
        : []),
    ];
  },

  pendant: (c) => {
    const cordEnd = c.ceiling + PENDANT.cord;
    const shadeBot = cordEnd + PENDANT.shadeH;
    return [
      inkLine('lamp-pendant-cord', c.cx, c.ceiling, c.cx, cordEnd),
      fillMark(emitterRole(c.lit), trapezoid(c.cx, cordEnd, PENDANT.shadeTopW, PENDANT.shadeBotW, PENDANT.shadeH), c.clip),
      outline('lamp-pendant-shade', trapezoid(c.cx, cordEnd, PENDANT.shadeTopW, PENDANT.shadeBotW, PENDANT.shadeH), c.clip),
      ...(c.lit
        ? rings('aura', [
            [
              [c.cx - PENDANT.shadeBotW / 2, shadeBot],
              [c.cx + PENDANT.shadeBotW / 2, shadeBot],
              [c.cx + AURA.cone, c.floor],
              [c.cx - AURA.cone, c.floor],
            ],
            [
              [c.cx - PENDANT.shadeBotW / 3, shadeBot],
              [c.cx + PENDANT.shadeBotW / 3, shadeBot],
              [c.cx + AURA.pool, c.floor],
              [c.cx - AURA.pool, c.floor],
            ],
          ], c.clip)
        : []),
    ];
  },

  bare: (c) => {
    const bulbY = c.ceiling + BARE.cord;
    return [
      inkLine('lamp-bare-cord', c.cx, c.ceiling, c.cx, bulbY - BARE.bulbR),
      fillMark(emitterRole(c.lit), octagon(c.cx, bulbY, BARE.bulbR), c.clip),
      ...(c.lit
        ? rings(
            'aura',
            [octagon(c.cx, bulbY, AURA.cone), octagon(c.cx, bulbY, AURA.pool)],
            c.clip,
          )
        : []),
    ];
  },
};
