// The lamp drawer: one pure emitter per kind — floorLamp, arcLamp,
// tableLamp, bedsideLamp, pendant, bulbPendant — turning a LampPlan and the
// night flip into marks. Each lamp carries three parts: the structure (a
// normal object — furniture paint plus ink line), the emitting part (the
// furniture paint whenever unlit, the emitter's warmth when lit at night),
// and the aura the construction casts, laid — with the room's ambient —
// directly over the interior, ink lines included. The state gate lives
// here: day draws the furniture alone, an unlit night adds the veil, a lit
// night swaps the emitter in and lays ambient and aura. Every mark is
// clipped to the opening before it leaves the drawer — the standing lamps
// reach lines below the sightline, and only what the glass shows is drawn.
// No mark names a colour or a strength — styling resolves the roles. Trace
// names are bare ids unique within a window, prefixed `lamp-`.
import type { Mark } from '@/core/scene';
import type { Pt3 } from '@/motion/projection';
import { WEIGHTS } from '@/styling/weights';
import { line, rectPts, type PaneRect } from '@/core/window-shell/shell';
import {
  ANCHOR_X,
  BEDSIDE_DROP,
  DESK_DROP,
  FLOOR_DROP,
  LIGHT_DEPTH,
  LIGHT_Z,
  type LampKind,
} from './catalogue';
import type { LampPlan } from './light';

const atDepth = () => LIGHT_DEPTH;

function fill(role: Mark['role'], pts: Pt3[]): Mark {
  return { kind: 'fill', pts, role, z: LIGHT_Z };
}

function ink(name: string, x0: number, y0: number, x1: number, y1: number): Mark {
  return inkPts(name, line(x0, y0, x1, y1, atDepth));
}

function inkPts(name: string, pts: Pt3[]): Mark {
  return {
    kind: 'stroke',
    pts,
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

// Clipping, in unit measure. A stroke is cut into the segments the opening
// contains; a fill is intersected with the opening — never clamped, which
// would squash a shape into a sliver along the edge.
function clippedSegment(a: Pt3, b: Pt3, o: PaneRect): [Pt3, Pt3] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const bounds: [number, number][] = [
    [-dx, a.x - o.left],
    [dx, o.right - a.x],
    [-dy, a.y - o.top],
    [dy, o.bottom - a.y],
  ];
  for (const [p, q] of bounds) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return null;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return null;
      if (t < t1) t1 = t;
    }
  }
  const at = (t: number): Pt3 => ({ x: a.x + dx * t, y: a.y + dy * t, z: a.z });
  return [at(t0), at(t1)];
}

function clippedPolyline(pts: Pt3[], o: PaneRect): Pt3[] {
  const out: Pt3[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const seg = clippedSegment(pts[i], pts[i + 1], o);
    if (!seg) continue;
    const head = out[out.length - 1];
    if (head === undefined || Math.abs(head.x - seg[0].x) > 1e-9 || Math.abs(head.y - seg[0].y) > 1e-9) {
      out.push(seg[0]);
    }
    out.push(seg[1]);
  }
  return out;
}

function clippedPoly(poly: Pt3[], o: PaneRect): Pt3[] {
  const planes = [
    { axis: 'x' as const, limit: o.left, keepAbove: true },
    { axis: 'x' as const, limit: o.right, keepAbove: false },
    { axis: 'y' as const, limit: o.top, keepAbove: true },
    { axis: 'y' as const, limit: o.bottom, keepAbove: false },
  ];
  let current = poly;
  for (const plane of planes) {
    const next: Pt3[] = [];
    for (let i = 0; i < current.length; i++) {
      const a = current[i];
      const b = current[(i + 1) % current.length];
      const inside = (p: Pt3) =>
        plane.keepAbove ? p[plane.axis] >= plane.limit : p[plane.axis] <= plane.limit;
      const crossing = (): Pt3 => {
        const t = (plane.limit - a[plane.axis]) / (b[plane.axis] - a[plane.axis]);
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z };
      };
      if (inside(a)) {
        next.push(a);
        if (!inside(b)) next.push(crossing());
      } else if (inside(b)) {
        next.push(crossing());
      }
    }
    current = next;
    if (current.length === 0) return [];
  }
  return current;
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

function aura(pts: Pt3[], o: PaneRect): Mark[] {
  const shape = clippedPoly(pts, o);
  return AURA_PASSES.map((pass) => fill('aura', scaleAbout(shape, pass)));
}

// Which way the arc reaches: the facing mirrors the arm, its head, and the
// pool beneath it. Every other construction is symmetric about its own axis
// and reads the facing not at all.
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
// lampMarks. The standing lamps are built on their furniture's line below
// the sightline and let the clip keep what the glass shows.
function emit(kind: LampKind, f: Frame, lit: boolean): { marks: Mark[]; auras: Pt3[][] } {
  const { o, x, w, h, skew } = f;
  const emitterRole = lit ? 'light' : 'lamp';
  switch (kind) {
    case 'floorLamp': {
      const shadeTop = o.top + 0.16 * h;
      const shadeBottom = shadeTop + 0.14 * h;
      const floorY = o.bottom + FLOOR_DROP;
      return {
        marks: [
          fill('lamp', rect(x - 0.008 * w, shadeBottom, x + 0.008 * w, floorY)),
          ink('lamp-pole', x, shadeBottom, x, floorY),
          fill(emitterRole, trapezoid(x, shadeTop, 0.1 * w, shadeBottom, 0.16 * w)),
          ink('lamp-shade-left', x - 0.05 * w, shadeTop, x - 0.08 * w, shadeBottom),
          ink('lamp-shade-right', x + 0.05 * w, shadeTop, x + 0.08 * w, shadeBottom),
        ],
        auras: [
          trapezoid(x, shadeBottom, 0.16 * w, o.bottom, 0.5 * w),
          rect(x - 0.08 * w, shadeTop - 0.08 * h, x + 0.08 * w, shadeTop),
        ],
      };
    }
    case 'arcLamp': {
      const headX = x + skew * 1.6 * w;
      const headY = o.top + 0.3 * h;
      const floorY = o.bottom + FLOOR_DROP;
      return {
        marks: [
          fill('lamp', rect(x - 0.006 * w, headY, x + 0.006 * w, floorY)),
          ink('lamp-pole', x, headY, x, floorY),
          ink('lamp-arm', x, headY, headX, headY),
          fill(emitterRole, circle(headX, headY, 0.035 * w)),
          inkPts('lamp-dome', circle(headX, headY, 0.035 * w, 18)),
        ],
        auras: [circle(headX, headY + 0.1 * h, 0.16 * w)],
      };
    }
    case 'tableLamp': {
      const shadeTop = o.top + 0.3 * h;
      const shadeBottom = shadeTop + 0.1 * h;
      const deskY = o.bottom + DESK_DROP;
      return {
        marks: [
          fill('lamp', rect(x - 0.006 * w, shadeBottom, x + 0.006 * w, deskY)),
          ink('lamp-stem', x, shadeBottom, x, deskY),
          fill(emitterRole, rect(x - 0.07 * w, shadeTop, x + 0.07 * w, shadeBottom)),
          ink('lamp-drum-top', x - 0.07 * w, shadeTop, x + 0.07 * w, shadeTop),
          ink('lamp-drum-bottom', x - 0.07 * w, shadeBottom, x + 0.07 * w, shadeBottom),
        ],
        auras: [circle(x, (shadeTop + shadeBottom) / 2, 0.2 * w)],
      };
    }
    case 'bedsideLamp': {
      const shadeTop = o.top + 0.42 * h;
      const shadeBottom = shadeTop + 0.08 * h;
      const tableY = o.bottom + BEDSIDE_DROP;
      return {
        marks: [
          fill('lamp', rect(x - 0.005 * w, shadeBottom, x + 0.005 * w, tableY)),
          ink('lamp-stem', x, shadeBottom, x, tableY),
          fill(emitterRole, trapezoid(x, shadeTop, 0.08 * w, shadeBottom, 0.12 * w)),
          ink('lamp-shade-left', x - 0.04 * w, shadeTop, x - 0.06 * w, shadeBottom),
          ink('lamp-shade-right', x + 0.04 * w, shadeTop, x + 0.06 * w, shadeBottom),
        ],
        auras: [circle(x, (shadeTop + shadeBottom) / 2, 0.12 * w)],
      };
    }
    case 'pendant': {
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
          trapezoid(x, shadeBottom, 0.18 * w, o.bottom, 0.5 * w),
          rect(x - 0.06 * w, shadeTop - 0.05 * h, x + 0.06 * w, shadeTop),
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
  const drawn: Mark[] = [];
  for (const mark of marks) {
    const pts =
      mark.kind === 'stroke' ? clippedPolyline(mark.pts, o) : clippedPoly(mark.pts, o);
    if (pts.length >= (mark.kind === 'stroke' ? 2 : 3)) drawn.push({ ...mark, pts });
  }
  if (lit) {
    drawn.push(fill('ambient', rect(o.left, o.top, o.right, o.bottom)));
    for (const shape of auras) drawn.push(...aura(shape, o));
  }
  if (night && !plan.on) drawn.push(fill('veil', rect(o.left, o.top, o.right, o.bottom)));
  return drawn;
}
