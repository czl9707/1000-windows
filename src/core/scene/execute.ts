// The draw stage: marks in, pen strokes out. Stable-sorts by each mark's z
// (ties keep emission order), projects the points through weak perspective,
// scales widths by the mark's mean depth, and dresses each mark — its role
// resolved against the frame's palette. The pen never sees depth or roles.
import type { Pen } from '@/pen/pen';
import type { Palette } from '@/styling/roles';
import { CENTRE_EYE, FOCAL, project, scaleAt, type Eye } from '@/motion/projection';
import type { Mark } from './mark';

export function execute(
  marks: Mark[],
  pen: Pen,
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  eye: Eye = CENTRE_EYE,
  focal: number = FOCAL,
): void {
  // Stable sort: ties keep emission order, so the append-only draw order
  // survives; the caller hands over a marks array it does not reuse.
  marks.sort((a, b) => a.z - b.z);
  for (const mark of marks) {
    const meanZ = mark.pts.reduce((sum, p) => sum + p.z, 0) / mark.pts.length;
    const pts = project(mark.pts, eye, focal);
    const { color, alpha } = palette(mark.role);
    if (mark.kind === 'fill') {
      pen.fill(ctx, pts, { color, alpha });
    } else if (mark.kind === 'dot') {
      pen.dot(ctx, pts[0].x, pts[0].y, mark.r * scaleAt(meanZ, focal), mark.name, color);
    } else {
      pen.stroke(ctx, pts, { name: mark.name, width: mark.width * scaleAt(meanZ, focal), color });
    }
  }
}
