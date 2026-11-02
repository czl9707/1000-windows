// Placement: turning the geometry's 3D points into the 2D path the pen draws.
// Weak perspective from the reference's raum chapter: scale grows as a point
// stands nearer the viewer, s = F/(F−z).
import type { Pt } from "../pen/pen";

// A point in scene space: x, y in unit measure, z the depth (0 = wall plane).
export interface Pt3 {
  x: number;
  y: number;
  z: number;
}

export const FOCAL = 30;

export function scaleAt(z: number): number {
  return FOCAL / (FOCAL - z);
}

// The eye sits at the screen centre, always — never at the pointer, never
// moved by panning. `eye` is where this scene's origin (the canvas centre)
// stands in eye coordinates, unit measure. A projected point lands at
// (p + eye)·s on screen; drawn back in the canvas's wall-plane frame that is
// p·s + eye·(s − 1) — the wall plane stays pinned, nearer layers drift away
// from the screen centre in proportion to depth.
export interface Eye {
  x: number;
  y: number;
}

export const CENTRE_EYE: Eye = { x: 0, y: 0 };

export function project(pts: Pt3[], eye: Eye = CENTRE_EYE): Pt[] {
  return pts.map((p) => {
    const s = scaleAt(p.z);
    return { x: p.x * s + eye.x * (s - 1), y: p.y * s + eye.y * (s - 1) };
  });
}
