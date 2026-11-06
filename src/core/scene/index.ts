// The scene's entry: the draw stage.
export type { Mark, StrokeMark, FillMark, DotMark } from './mark';

import type { Pen } from '@/pen/pen';
import type { Palette } from '@/styling/roles';
import type { Projection } from '@/motion/projection';
import type { Mark } from './mark';

export function execute(
  marks: Mark[],
  pen: Pen,
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  projection: Projection,
): void {
  // Sorts in place; the caller hands over a marks array it does not reuse.
  // Ties keep emission order — the sort is stable, so the caller's
  // append-only draw order survives.
  marks.sort((a, b) => a.z - b.z);
  for (const mark of marks) {
    const meanZ = mark.pts.reduce((sum, p) => sum + p.z, 0) / mark.pts.length;
    const pts = projection.project(mark.pts);
    const resolved = palette(mark.role);
    if (mark.kind === 'fill') {
      pen.fill(ctx, pts, resolved);
    } else if (mark.kind === 'dot') {
      pen.dot(ctx, pts[0].x, pts[0].y, mark.r * projection.scaleAt(meanZ), mark.name, resolved.color);
    } else {
      pen.stroke(ctx, pts, { name: mark.name, width: mark.widthUnits * projection.scaleAt(meanZ), color: resolved.color });
    }
  }
}
