// The awning: a roof over the head, mounted on the wall and reaching out.
// The slope is a rigid plane — wall edge at the wall, front edge lower and at
// depth; the canopy is fabric, a shallow arc with a scalloped valance hanging
// from its front edge. Either kind fills opaque: the fabric hides the wall,
// the frame top, and every layer behind it.
import type { ShellPlan } from "./archetypes";
import type { Mark } from '@/core/scene';
import type { Pt3 } from "../../motion/projection";
import { WEIGHTS } from "@/styling/weights";
import { SHELL_Z, line } from "./shell";

// Mount height (above the box top) and reach, in unit measure. The fabric
// runs wider than the window box so it reads as a roof, not a trim.
const ATTACH_Y = -0.62;
const HALF_W = 1.0;
const DROP = 0.17;
const SLOPE_REACH = 0.5;
const CANOPY_REACH = 0.35;

const CANOPY_INSET = 0.05;
const HEM_DROP = 0.02;
const LOBE_DROP = 0.03;
const LOBES = 5;

const RIBS = 5;
const ARC_POINTS = 7;
const ATTACH_W = WEIGHTS.outline;
const EDGE_W = WEIGHTS.structural;

function drawSlope(): Mark[] {
  const marks: Mark[] = [
    {
      kind: "fill",
      pts: [
        { x: -HALF_W, y: ATTACH_Y, z: 0 },
        { x: HALF_W, y: ATTACH_Y, z: 0 },
        { x: HALF_W, y: ATTACH_Y + DROP, z: SLOPE_REACH },
        { x: -HALF_W, y: ATTACH_Y + DROP, z: SLOPE_REACH },
      ],
      role: "awning",
      z: SHELL_Z.awning,
    },
    {
      kind: "stroke",
      pts: line(-HALF_W, ATTACH_Y, HALF_W, ATTACH_Y),
      name: "awning-attach",
      widthUnits: ATTACH_W,
      role: "ink",
      z: SHELL_Z.awning,
    },
    {
      kind: "stroke",
      pts: line(-HALF_W, ATTACH_Y + DROP, HALF_W, ATTACH_Y + DROP, () => SLOPE_REACH),
      name: "awning-front",
      widthUnits: EDGE_W,
      role: "ink",
      z: SHELL_Z.awning,
    },
  ];
  for (let i = 0; i < RIBS; i++) {
    const x = -HALF_W + (i * 2 * HALF_W) / (RIBS - 1);
    marks.push({
      kind: "stroke",
      pts: [
        { x, y: ATTACH_Y, z: 0 },
        { x, y: ATTACH_Y + DROP, z: SLOPE_REACH },
      ],
      name: `awning-rib-${i}`,
      widthUnits: WEIGHTS.hairline,
      role: "ink",
      z: SHELL_Z.awning,
    });
  }
  return marks;
}

function drawCanopy(): Mark[] {
  const halfW = HALF_W - CANOPY_INSET;
  const hemY = ATTACH_Y + DROP + HEM_DROP;
  const marks: Mark[] = [
    {
      kind: "fill",
      pts: [
        { x: -halfW, y: ATTACH_Y, z: 0 },
        { x: halfW, y: ATTACH_Y, z: 0 },
        { x: halfW, y: hemY, z: CANOPY_REACH },
        { x: -halfW, y: hemY, z: CANOPY_REACH },
      ],
      role: "awning",
      z: SHELL_Z.awning,
    },
    {
      kind: "stroke",
      pts: line(-halfW, ATTACH_Y, halfW, ATTACH_Y),
      name: "canopy-attach",
      widthUnits: EDGE_W,
      role: "ink",
      z: SHELL_Z.awning,
    },
  ];
  const arc = (x: number): Pt3[] =>
    Array.from({ length: ARC_POINTS }, (_, i) => {
      const t = i / (ARC_POINTS - 1);
      return {
        x,
        y: ATTACH_Y + DROP * t,
        z: CANOPY_REACH * Math.sin((t * Math.PI) / 2),
      };
    });
  for (const [tag, x] of [
    ["l", -halfW],
    ["r", halfW],
  ] as const) {
    marks.push({
      kind: "stroke",
      pts: arc(x),
      name: `canopy-side-${tag}`,
      widthUnits: WEIGHTS.detail,
      role: "ink",
      z: SHELL_Z.awning,
    });
  }
  const valance: Pt3[] = [];
  for (let i = 0; i <= LOBES * 4; i++) {
    const t = i / (LOBES * 4);
    valance.push({
      x: -halfW + t * 2 * halfW,
      y: hemY + Math.sin(((i % 4) / 4) * Math.PI) * LOBE_DROP,
      z: CANOPY_REACH,
    });
  }
  marks.push({
    kind: "stroke",
    pts: valance,
    name: "canopy-valance",
    widthUnits: WEIGHTS.detail,
    role: "ink",
    z: SHELL_Z.awning,
  });
  return marks;
}

export function drawAwning(plan: ShellPlan): Mark[] {
  if (plan.awning === "none") return [];
  return plan.awning === "slope" ? drawSlope() : drawCanopy();
}
