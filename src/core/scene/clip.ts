// Clipping, in unit measure: strokes cut into the segments the rect
// contains, fills intersected with it — never clamped, which would squash
// a shape into a sliver along the edge. The scene's shared Sutherland–
// Hodgman; a layer hands its own rect (the lamp clips to the opening, the
// furniture to the window box).
import type { Pt3 } from '@/motion/projection';

type Rect = { left: number; top: number; right: number; bottom: number };

export function clipPolyline(pts: Pt3[], o: Rect): Pt3[] {
  const out: Pt3[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const seg = clipSegment(pts[i], pts[i + 1], o);
    if (!seg) continue;
    const head = out[out.length - 1];
    if (head === undefined || Math.abs(head.x - seg[0].x) > 1e-9 || Math.abs(head.y - seg[0].y) > 1e-9) {
      out.push(seg[0]);
    }
    out.push(seg[1]);
  }
  return out;
}

export function clipPoly(poly: Pt3[], o: Rect): Pt3[] {
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

function clipSegment(a: Pt3, b: Pt3, o: Rect): [Pt3, Pt3] | null {
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
