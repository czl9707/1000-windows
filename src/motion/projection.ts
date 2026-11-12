// Weak perspective from the reference's raum chapter.
import type { Pt } from '@/pen/pen';

// x, y in unit measure; z the depth, 0 = wall plane.
export interface Pt3 {
  x: number;
  y: number;
  z: number;
}

const FOCAL = 30;

// The eye sits at the screen centre, always — never at the pointer, never
// moved by panning. `eye` is where this scene's origin stands in eye
// coordinates, unit measure — the scene origin's offset from the eye, seen
// from that one fixed point. A wall of scenes feeds each window its own:
// its world position minus the camera, plus the canvas's offset from the
// screen centre. A projected point lands at (p + eye)·s on screen; drawn
// back in the canvas's wall-plane frame that is
// p·s + eye·(s − 1) — the wall plane stays pinned, nearer layers drift away
// from the screen centre in proportion to depth.
export interface Eye {
  x: number;
  y: number;
}

export const CENTRE_EYE: Eye = { x: 0, y: 0 };

// The projection, built once per frame the way the palette is: the eye is
// mandatory and fixed at build time, so the scene code never threads raw
// eye or focal numbers through its calls — it asks the built projection to
// place points and scale widths.
export interface Projection {
  project(pts: Pt3[]): Pt[];
  scaleAt(z: number): number;
}

export function makeProjection(eye: Eye, focal: number = FOCAL): Projection {
  const scaleAt = (z: number): number => focal / (focal - z);
  return {
    project: (pts) =>
      pts.map((p) => {
        const s = scaleAt(p.z);
        return { x: p.x * s + eye.x * (s - 1), y: p.y * s + eye.y * (s - 1) };
      }),
    scaleAt,
  };
}
