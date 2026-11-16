// Clipping, in unit measure: strokes cut into the segments the rect
// contains, fills intersected with it — never clamped, which would squash
// a shape into a sliver along the edge. The scene's shared Sutherland–
// Hodgman; a layer hands its own rect (the lamp clips to the opening
// pre-projection, the walk's draw stage clips the interior to the aperture
// post-projection). Points may carry a depth; the interpolated points keep
// whatever the segment endpoints held.
type ClipPoint = { x: number; y: number; z?: number };
type Rect = { left: number; top: number; right: number; bottom: number };

export function clipPolyline<T extends ClipPoint>(pts: T[], o: Rect): T[] {
  const out: ClipPoint[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const seg = clipSegment(pts[i], pts[i + 1], o);
    if (!seg) continue;
    const head = out[out.length - 1];
    if (head === undefined || Math.abs(head.x - seg[0].x) > 1e-9 || Math.abs(head.y - seg[0].y) > 1e-9) {
      out.push(seg[0]);
    }
    out.push(seg[1]);
  }
  return out as T[];
}

export function clipPoly<T extends ClipPoint>(poly: T[], o: Rect): T[] {
  const planes = [
    { axis: 'x' as const, limit: o.left, keepAbove: true },
    { axis: 'x' as const, limit: o.right, keepAbove: false },
    { axis: 'y' as const, limit: o.top, keepAbove: true },
    { axis: 'y' as const, limit: o.bottom, keepAbove: false },
  ];
  let current: ClipPoint[] = poly;
  for (const plane of planes) {
    const next: ClipPoint[] = [];
    for (let i = 0; i < current.length; i++) {
      const a = current[i];
      const b = current[(i + 1) % current.length];
      const inside = (p: ClipPoint) =>
        plane.keepAbove ? p[plane.axis] >= plane.limit : p[plane.axis] <= plane.limit;
      const crossing = (): ClipPoint => {
        const t = (plane.limit - a[plane.axis]) / (b[plane.axis] - a[plane.axis]);
        return {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          ...(a.z !== undefined && b.z !== undefined ? { z: a.z + (b.z - a.z) * t } : {}),
        };
      };
      if (inside(a)) {
        next.push(a);
        if (!inside(b)) next.push(crossing());
      } else if (inside(b)) {
        next.push(crossing());
      }
    }
    current = next;
    if (current.length === 0) return [] as T[];
  }
  return current as T[];
}

export function pointInRect(p: ClipPoint, o: Rect): boolean {
  return p.x >= o.left && p.x <= o.right && p.y >= o.top && p.y <= o.bottom;
}

function clipSegment(a: ClipPoint, b: ClipPoint, o: Rect): [ClipPoint, ClipPoint] | null {
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
  const at = (t: number): ClipPoint => ({
    x: a.x + dx * t,
    y: a.y + dy * t,
    ...(a.z !== undefined && b.z !== undefined ? { z: a.z + (b.z - a.z) * t } : {}),
  });
  return [at(t0), at(t1)];
}
