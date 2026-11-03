// The casement: leaves that swing out of the wall, beside fixed picture
// panes. A swung leaf keeps its true rectangle and narrows by the swing's
// cosine — the hand-drawn "swung open" — while its points stand out of the
// wall at the swing's depth, so projection and parallax place it in front
// of the wall. The leaf carries its glass with it; a closed leaf and every
// fixed pane draw flat on the wall.
import { ARCHETYPES, type CasementPlan, type Side } from './archetypes';
import type { Mark } from '@/core/scene/mark';
import { WEIGHTS } from '@/styling/weights';
import {
  SHELL_Z,
  innerRect,
  paneEdges,
  paneMarks,
  rectPts,
  swingDepthAt,
  swingFreeX,
  type PaneRect,
} from './shell';

// How far a leaf opens, as its angle off the wall plane, per open state.
const SWING = { open: 0.9, 'half-open': 0.45, closed: 0 } as const;

// A leaf: its wall span, its hinge jamb, and whether it swings or holds
// fixed glass like a picture pane.
interface Leaf {
  x0: number;
  x1: number;
  hinge: Side;
  operable: boolean;
}

function leaves(plan: CasementPlan, left: number, right: number): Leaf[] {
  const { layout } = plan;
  if (layout === 'pair') {
    return [
      { x0: left, x1: 0, hinge: 'left', operable: true },
      { x0: 0, x1: right, hinge: 'right', operable: true },
    ];
  }
  // one-two: a narrow operable leaf on the jamb, a wide fixed pane beside it.
  const w = (right - left) / 3;
  return [
    { x0: left, x1: left + w, hinge: 'left', operable: true },
    { x0: left + w, x1: right, hinge: 'right', operable: false },
  ];
}

export function drawCasement(plan: CasementPlan): Mark[] {
  const { open } = plan;
  const opening = innerRect(plan.faceWidth);
  const t = ARCHETYPES.casement.frameThickness * plan.thicknessJitter;

  const fixedMarks: Mark[] = [];
  const swungMarks: Mark[] = [];

  for (const [i, leaf] of leaves(plan, opening.left, opening.right).entries()) {
    const trace = `leaf-${i}`;
    if (!leaf.operable || open === 'closed') {
      const rect: PaneRect = { top: opening.top, bottom: opening.bottom, left: leaf.x0, right: leaf.x1 };
      fixedMarks.push(
        ...paneMarks(rect, trace, t, {
          leftW: leaf.x0 !== opening.left ? WEIGHTS.minor : t,
          rightW: leaf.x1 !== opening.right ? WEIGHTS.minor : t,
        }),
      );
      continue;
    }

    // The swung leaf: its outline draws at the frame weight on every edge —
    // swung out, it stands alone.
    const hingeX = leaf.hinge === 'left' ? leaf.x0 : leaf.x1;
    const farX = leaf.hinge === 'left' ? leaf.x1 : leaf.x0;
    const depthAt = swingDepthAt(hingeX, SWING[open]);
    const freeX = swingFreeX(hingeX, farX, SWING[open]);
    const rect: PaneRect = {
      top: opening.top,
      bottom: opening.bottom,
      left: Math.min(hingeX, freeX),
      right: Math.max(hingeX, freeX),
    };
    swungMarks.push(
      { kind: 'fill', pts: rectPts(hingeX, opening.top, freeX, opening.bottom, depthAt), role: 'glass', z: SHELL_Z.open },
      ...paneEdges(rect, trace, SHELL_Z.open, t, { depthAt }),
    );
  }
  return [...fixedMarks, ...swungMarks];
}
