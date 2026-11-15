// The room behind the glass: a rectangle larger than the opening, with a
// real floor at its base. The opening shows only a portion of the room —
// the rectangle grows a small margin on every side, extra room at the
// bottom — so the focal point's parallax drift never bares a hard cut at
// the sightline. Furniture is drawn even where the wall hides it, standing
// on the floor line; the floor line itself stays undrawn, the pieces' bases
// carry it. Decided in the wayfinder ticket "Furniture — the room behind
// the glass".
import type { PaneRect } from '@/core/window-shell/shell';

// The side and top margins, as shares of the opening's own measures.
const SIDE_MARGIN = 0.14;
const TOP_MARGIN = 0.08;

// The room's floor sits this far below the sightline — the standing line
// the light layer's lamps already stand on (FLOOR_DROP there). One room,
// one floor; a guard test pins the two constants together, and the pieces'
// upper bodies clear the sightline the way the lamp shades do.
export const ROOM_FLOOR_DROP = 0.85;

export function roomOf(o: PaneRect): PaneRect {
  const w = o.right - o.left;
  const h = o.bottom - o.top;
  return {
    left: o.left - SIDE_MARGIN * w,
    right: o.right + SIDE_MARGIN * w,
    top: o.top - TOP_MARGIN * h,
    bottom: o.bottom + ROOM_FLOOR_DROP,
  };
}
