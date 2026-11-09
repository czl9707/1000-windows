// The lamp drawer: one pure emitter per kind — floorLamp, arcLamp,
// tableLamp, bedsideLamp, pendant, bulbPendant — turning a LampPlan and the
// night flip into marks. Each lamp carries three parts: the structure (a
// normal object — furniture paint plus ink line), the emitting part (the
// furniture paint whenever unlit, the emitter's warmth when lit at night),
// and the aura the construction casts, laid — with the room's ambient —
// directly over the interior, ink lines included. The state gate lives
// here: day draws the furniture alone, an unlit night adds the veil, a lit
// night swaps the emitter in and lays ambient and aura. No mark names a
// colour or a strength — styling resolves the roles. Trace names are bare
// ids unique within a window, prefixed `lamp-`.
import type { Mark } from '@/core/scene';
import type { Pt3 } from '@/motion/projection';
import { WEIGHTS } from '@/styling/weights';
import { line, rectPts, type PaneRect } from '@/core/window-shell/shell';
import { ANCHOR_X, LIGHT_DEPTH, LIGHT_Z, ROOM_FLOOR, type LampKind } from './catalogue';
import type { LampPlan } from './light';

const atDepth = () => LIGHT_DEPTH;

function fill(role: Mark['role'], pts: Pt3[]): Mark {
  return { kind: 'fill', pts, role, z: LIGHT_Z };
}

function ink(name: string, x0: number, y0: number, x1: number, y1: number): Mark {
  return {
    kind: 'stroke',
    pts: line(x0, y0, x1, y1, atDepth),
    name,
    widthUnits: WEIGHTS.detail,
    role: 'ink',
    z: LIGHT_Z,
  };
}

function rect(x0: number, y0: number, x1: number, y1: number): Pt3[] {
  return rectPts(x0, y0, x1, y1, atDepth);
}

function circle(cx: number, cy: number, r: number, n = 14): Pt3[] {
  const pts: Pt3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, z: atDepth() });
  }
  return pts;
}

function trapezoid(cx: number, topY: number, topW: number, bottomY: number, bottomW: number): Pt3[] {
  return [
    { x: cx - topW / 2, y: topY, z: atDepth() },
    { x: cx + topW / 2, y: topY, z: atDepth() },
    { x: cx + bottomW / 2, y: bottomY, z: atDepth() },
    { x: cx - bottomW / 2, y: bottomY, z: atDepth() },
  ];
}

// The aura falls off in nested passes of one shape: the same warmth role
// drawn at shrinking scale about the shape's centre, the overlap compounding
// the alpha the way the cloth's pooling echo does. One alpha per role, a
// graded falloff from nesting.
const AURA_PASSES = [1, 0.62, 0.3];

function scaleAbout(pts: Pt3[], factor: number): Pt3[] {
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return pts.map((p) => ({ x: cx + (p.x - cx) * factor, y: cy + (p.y - cy) * factor, z: p.z }));
}

function clamped(pts: Pt3[], o: PaneRect): Pt3[] {
  return pts.map((p) => ({
    x: Math.min(Math.max(p.x, o.left), o.right),
    y: Math.min(Math.max(p.y, o.top), o.bottom),
    z: p.z,
  }));
}

function aura(pts: Pt3[], o: PaneRect): Mark[] {
  const shape = clamped(pts, o);
  return AURA_PASSES.map((pass) => fill('aura', scaleAbout(shape, pass)));
}

// Which way a cone leans: the facing skews the pool's centre off the lamp's
// anchor, mirrored around it.
const LEAN = 0.06;

interface Frame {
  o: PaneRect;
  x: number;
  w: number;
  h: number;
  skew: number;
}

// The furniture's marks and the aura shapes the construction casts — one
// switch per kind, the drawer's whole vocabulary of shapes. `lit` picks the
// emitter's role; the geometry is the same lamp either way. The auras come
// back unbuilt: they draw only in a lit room, so the state gate stays in
// lampMarks.
function emit(kind: LampKind, f: Frame, lit: boolean): { marks: Mark[]; auras: Pt3[][] } {
  const { o, x, w, h, skew } = f;
  const emitterRole = lit ? 'light' : 'lamp';
  switch (kind) {
    case 'floorLamp': {
      const floor = o.bottom - ROOM_FLOOR * h;
      const shadeTop = o.top + 0.16 * h;
      const shadeBottom = shadeTop + 0.14 * h;
      return {
        marks: [
          fill('lamp', rect(x - 0.04 * w, floor - 0.02 * h, x + 0.04 * w, floor)),
          fill('lamp', rect(x - 0.008 * w, shadeBottom, x + 0.008 * w, floor - 0.02 * h)),
          ink('lamp-base-left', x - 0.04 * w, floor - 0.02 * h, x - 0.04 * w, floor),
          ink('lamp-base-right', x + 0.04 * w, floor - 0.02 * h, x + 0.04 * w, floor),
          ink('lamp-base-bottom', x - 0.04 * w, floor, x + 0.04 * w, floor),
          ink('lamp-pole', x, shadeBottom, x, floor - 0.02 * h),
          fill(emitterRole, trapezoid(x, shadeTop, 0.1 * w, shadeBottom, 0.16 * w)),
          ink('lamp-shade-left', x - 0.05 * w, shadeTop, x - 0.08 * w, shadeBottom),
          ink('lamp-shade-right', x + 0.05 * w, shadeTop, x + 0.08 * w, shadeBottom),
        ],
        auras: [
          trapezoid(x + skew * w, shadeBottom, 0.16 * w, floor, 0.5 * w),
          rect(x - 0.05 * w, shadeTop - 0.08 * h, x + 0.05 * w, shadeTop),
        ],
      };
    }
    case 'arcLamp': {
      const floor = o.bottom - ROOM_FLOOR * h;
      const headX = x + skew * 1.6 * w;
      const headY = o.top + 0.3 * h;
      return {
        marks: [
          fill('lamp', rect(x - 0.04 * w, floor - 0.02 * h, x + 0.04 * w, floor)),
          fill('lamp', rect(x - 0.006 * w, headY, x + 0.006 * w, floor - 0.02 * h)),
          ink('lamp-base-left', x - 0.04 * w, floor - 0.02 * h, x - 0.04 * w, floor),
          ink('lamp-base-right', x + 0.04 * w, floor - 0.02 * h, x + 0.04 * w, floor),
          ink('lamp-base-bottom', x - 0.04 * w, floor, x + 0.04 * w, floor),
          ink('lamp-pole', x, headY, x, floor - 0.02 * h),
          ink('lamp-arm', x, headY, headX, headY),
          fill(emitterRole, circle(headX, headY, 0.035 * w)),
        ],
        auras: [circle(headX, headY, 0.16 * w)],
      };
    }
    case 'tableLamp': {
      const floor = o.bottom - ROOM_FLOOR * h;
      const shadeTop = o.top + 0.3 * h;
      const shadeBottom = shadeTop + 0.1 * h;
      return {
        marks: [
          fill('lamp', rect(x - 0.05 * w, floor - 0.03 * h, x + 0.05 * w, floor)),
          fill('lamp', rect(x - 0.006 * w, shadeBottom, x + 0.006 * w, floor - 0.03 * h)),
          ink('lamp-base-left', x - 0.05 * w, floor - 0.03 * h, x - 0.05 * w, floor),
          ink('lamp-base-right', x + 0.05 * w, floor - 0.03 * h, x + 0.05 * w, floor),
          ink('lamp-base-bottom', x - 0.05 * w, floor, x + 0.05 * w, floor),
          ink('lamp-stem', x, shadeBottom, x, floor - 0.03 * h),
          fill(emitterRole, rect(x - 0.07 * w, shadeTop, x + 0.07 * w, shadeBottom)),
          ink('lamp-drum-top', x - 0.07 * w, shadeTop, x + 0.07 * w, shadeTop),
          ink('lamp-drum-bottom', x - 0.07 * w, shadeBottom, x + 0.07 * w, shadeBottom),
        ],
        auras: [rect(x - 0.22 * w, shadeTop - 0.1 * h, x + 0.22 * w, shadeBottom + 0.1 * h)],
      };
    }
    case 'bedsideLamp': {
      const floor = o.bottom - ROOM_FLOOR * h;
      const shadeTop = o.top + 0.42 * h;
      const shadeBottom = shadeTop + 0.08 * h;
      return {
        marks: [
          fill('lamp', rect(x - 0.04 * w, floor - 0.02 * h, x + 0.04 * w, floor)),
          fill('lamp', rect(x - 0.005 * w, shadeBottom, x + 0.005 * w, floor - 0.02 * h)),
          ink('lamp-base-left', x - 0.04 * w, floor - 0.02 * h, x - 0.04 * w, floor),
          ink('lamp-base-right', x + 0.04 * w, floor - 0.02 * h, x + 0.04 * w, floor),
          ink('lamp-base-bottom', x - 0.04 * w, floor, x + 0.04 * w, floor),
          ink('lamp-stem', x, shadeBottom, x, floor - 0.02 * h),
          fill(emitterRole, trapezoid(x, shadeTop, 0.08 * w, shadeBottom, 0.12 * w)),
          ink('lamp-shade-left', x - 0.04 * w, shadeTop, x - 0.06 * w, shadeBottom),
          ink('lamp-shade-right', x + 0.04 * w, shadeTop, x + 0.06 * w, shadeBottom),
        ],
        auras: [circle(x, shadeBottom, 0.12 * w)],
      };
    }
    case 'pendant': {
      const floor = o.bottom - ROOM_FLOOR * h;
      const shadeTop = o.top + 0.22 * h;
      const shadeBottom = shadeTop + 0.1 * h;
      return {
        marks: [
          ink('lamp-cord', x, o.top, x, shadeTop),
          fill(emitterRole, trapezoid(x, shadeTop, 0.06 * w, shadeBottom, 0.18 * w)),
          ink('lamp-shade-left', x - 0.03 * w, shadeTop, x - 0.09 * w, shadeBottom),
          ink('lamp-shade-right', x + 0.03 * w, shadeTop, x + 0.09 * w, shadeBottom),
        ],
        auras: [
          trapezoid(x + skew * w, shadeBottom, 0.18 * w, floor, 0.5 * w),
          rect(x - 0.03 * w, shadeTop - 0.05 * h, x + 0.03 * w, shadeTop),
        ],
      };
    }
    case 'bulbPendant': {
      const bulbY = o.top + 0.25 * h;
      const r = 0.025 * w;
      return {
        marks: [
          ink('lamp-cord', x, o.top, x, bulbY - r),
          fill(emitterRole, circle(x, bulbY, r)),
        ],
        auras: [circle(x, bulbY, 0.15 * w)],
      };
    }
  }
}

export function lampMarks(plan: LampPlan, o: PaneRect, night: boolean): Mark[] {
  const w = o.right - o.left;
  const h = o.bottom - o.top;
  const x = o.left + ANCHOR_X[plan.location] * w;
  const skew = plan.facing === 'left' ? -LEAN : LEAN;
  const frame: Frame = { o, x, w, h, skew };
  const lit = night && plan.on;
  const { marks, auras } = emit(plan.kind, frame, lit);
  if (lit) {
    marks.push(fill('ambient', rect(o.left, o.top, o.right, o.bottom)));
    for (const shape of auras) marks.push(...aura(shape, o));
  }
  if (night && !plan.on) marks.push(fill('veil', rect(o.left, o.top, o.right, o.bottom)));
  return marks;
}
