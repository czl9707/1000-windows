// Placement: turning the geometry's 3D points into the 2D path the pen draws.
// Weak perspective from the reference's raum chapter: scale grows as a point
// stands nearer the viewer, s = F/(F−z). The pointer parallax joins here.
import type { Pt } from '../pen/pen';

// A point in scene space: x, y in unit measure, z the depth (0 = wall plane).
export interface Pt3 {
  x: number;
  y: number;
  z: number;
}

export const FOCAL = 4.2;

export function scaleAt(z: number): number {
  return FOCAL / (FOCAL - z);
}

export function project(pts: Pt3[]): Pt[] {
  return pts.map((p) => {
    const s = scaleAt(p.z);
    return { x: p.x * s, y: p.y * s };
  });
}
