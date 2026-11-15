// The scene's entry: the draw stage.
export type { Mark, StrokeMark, FillMark, DotMark } from './mark';

import type { Pen } from '@/pen/pen';
import type { Palette } from '@/styling/roles';
import type { Projection } from '@/motion/projection';
import type { Mark } from './mark';
import { clipPoly, clipPolyline, pointInRect } from './clip';

// The aperture, when the caller hands one, is the opening rect in unit
// measure: a wall-plane rectangle projects to itself, so it is the clip
// rect in screen space too. The frame occludes at the wall plane — every
// mark lying behind it clips to the aperture after projection, exactly
// where a real frame cuts the view — while marks on or in front of the
// wall (the frame face, a swung casement leaf) draw unclipped. Clipping
// here, after projection, is what lets a tenant layer emit the whole room
// and never bare a hard cut under the parallax drift: the drift shifts the
// room, the aperture stays.
export function execute(
  marks: Mark[],
  pen: Pen,
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  projection: Projection,
  aperture?: { left: number; top: number; right: number; bottom: number },
): void {
  // Sorts in place; the caller hands over a marks array it does not reuse.
  // Ties keep emission order — the sort is stable, so the caller's
  // append-only draw order survives.
  marks.sort((a, b) => a.z - b.z);
  for (const mark of marks) {
    const meanZ = mark.pts.reduce((sum, p) => sum + p.z, 0) / mark.pts.length;
    let pts: { x: number; y: number }[] = projection.project(mark.pts);
    if (aperture && mark.pts.every((p) => p.z < 0)) {
      const clipped =
        mark.kind === 'stroke' ? clipPolyline(pts, aperture) : clipPoly(pts, aperture);
      if (clipped.length < (mark.kind === 'fill' ? 3 : 2)) continue;
      pts = clipped;
    }
    const resolved = palette(mark.role);
    if (mark.kind === 'fill') {
      pen.fill(ctx, pts, resolved);
    } else if (mark.kind === 'dot') {
      if (aperture && mark.pts.every((p) => p.z < 0) && !pointInRect(pts[0], aperture)) continue;
      pen.dot(ctx, pts[0].x, pts[0].y, mark.r * projection.scaleAt(meanZ), mark.name, resolved.color);
    } else {
      pen.stroke(ctx, pts, { name: mark.name, width: mark.widthUnits * projection.scaleAt(meanZ), color: resolved.color });
    }
  }
}
