// The room behind the glass: a rectangle larger than the opening, with a
// real floor at its base. The opening shows only a portion of the room —
// the rectangle grows a small margin on every side, extra room at the
// bottom — so the focal point's parallax drift never bares a hard cut at
// the sightline. Furniture is drawn even where the wall hides it, standing
// on the floor line; the floor line itself stays undrawn, the pieces' bases
// carry it. Decided in the wayfinder ticket "Furniture — the room behind
// the glass".
import type { PaneRect } from '@/core/window-shell/shell';

// The margins, as shares of the opening's own measures: a small growth on
// every side, the floor a tenth of the opening's height below its bottom
// edge — enough that a desk still clears the sightline into view.
const SIDE_MARGIN = 0.14;
const TOP_MARGIN = 0.08;
const FLOOR_DROP = 0.1;

export function roomOf(o: PaneRect): PaneRect {
  const w = o.right - o.left;
  const h = o.bottom - o.top;
  return {
    left: o.left - SIDE_MARGIN * w,
    right: o.right + SIDE_MARGIN * w,
    top: o.top - TOP_MARGIN * h,
    bottom: o.bottom + FLOOR_DROP * h,
  };
}
