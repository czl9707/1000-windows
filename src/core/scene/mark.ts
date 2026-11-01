// Marks: what geometry emits, what the draw stage consumes. A mark carries
// its points in 3D (depth on the points, see motion/projection) plus a plain
// numeric z used only to order marks — ties keep emission order, so the
// append-only draw order survives the sort. Dress is a role name — colour
// and strength together, resolved by styling; a mark carries neither.
import type { ColorRole } from '../../styling/roles';
import type { Pt3 } from '../../motion/projection';

interface MarkBase {
  pts: Pt3[];
  role: ColorRole;
  z: number;
}

export interface StrokeMark extends MarkBase {
  kind: 'stroke';
  // The trace name: the warp hangs on it.
  name: string;
  // Full stroke width in unit measure.
  width: number;
}

export interface FillMark extends MarkBase {
  kind: 'fill';
}

export interface DotMark extends MarkBase {
  kind: 'dot';
  name: string;
  r: number;
}

export type Mark = StrokeMark | FillMark | DotMark;
