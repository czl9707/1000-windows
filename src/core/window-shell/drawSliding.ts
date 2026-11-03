// The sliding window: panels on two tracks, one behind the other. A panel
// slides toward its fixed neighbour and hides behind it — never past it: the
// travel stops while a strip of the sliding glass still shows, and the panel
// stays inside the frame, never running into the wall. The front track
// stands a hair off the wall so the tracks separate under the parallax. The
// transom layout pins a fixed picture strip across the head, the sliding
// row beneath it.
import { ARCHETYPES, type Side, type SlidingPlan } from './archetypes';
import type { Mark } from '@/core/scene/mark';
import { WEIGHTS } from '@/styling/weights';
import { SHELL_Z, innerRect, paneMarks, type PaneRect } from './shell';

// How far a sliding panel travels, as a fraction of the run that leaves the
// visible strip, per open state.
const TRAVEL = { open: 0.7, 'half-open': 0.35, closed: 0 } as const;
// The transom's fixed picture strip, as a fraction of the opening height.
const TRANSOM_FRACTION = 0.28;
// True depth of the front track, out of the wall.
const TRACK_STEP = 0.02;
// The strip of sliding glass an opened panel always leaves visible past its
// neighbour's stile — the panels never close up into one.
const EDGE_GAP = 0.12;

// A panel of the sliding row: its index left to right, its track (0 back,
// 1 front), and the direction it slides — toward its fixed neighbour,
// 0 for fixed.
interface PanelConfig {
  i: number;
  track: 0 | 1;
  dir: -1 | 0 | 1;
}

function rowPanels(layout: SlidingPlan['layout'], slideSide: Side): PanelConfig[] {
  if (layout === 'two' || layout === 'transom') {
    return slideSide === 'left'
      ? [
          { i: 0, track: 0, dir: 1 },
          { i: 1, track: 1, dir: 0 },
        ]
      : [
          { i: 0, track: 1, dir: 0 },
          { i: 1, track: 0, dir: -1 },
        ];
  }
  // Three: the centre panel fixed on the front track; the rolled side's outer
  // panel slides behind it, the other holds still. One moving panel, never
  // two: two sliding at once reads as a smear.
  return slideSide === 'left'
    ? [
        { i: 0, track: 0, dir: 1 },
        { i: 1, track: 1, dir: 0 },
        { i: 2, track: 0, dir: 0 },
      ]
    : [
        { i: 0, track: 0, dir: 0 },
        { i: 1, track: 1, dir: 0 },
        { i: 2, track: 0, dir: -1 },
      ];
}

export function drawSliding(plan: SlidingPlan): Mark[] {
  const { layout, open, slideSide } = plan;
  const opening = innerRect(plan.faceWidth);
  const t = ARCHETYPES.sliding.frameThickness * plan.thicknessJitter;

  const marks: Mark[] = [];

  const rowTop =
    layout === 'transom'
      ? opening.top + (opening.bottom - opening.top) * TRANSOM_FRACTION
      : opening.top;
  if (layout === 'transom') {
    const strip: PaneRect = { ...opening, bottom: rowTop };
    marks.push(...paneMarks(strip, 'transom', t));
  }

  const row: PaneRect = { ...opening, top: rowTop };
  const panels = rowPanels(layout, slideSide);
  const pw = (row.right - row.left) / panels.length;
  const travel = TRAVEL[open] * (pw - EDGE_GAP);

  // Back track first, so the front track's lines paint over it.
  const ordered = [...panels].sort((a, b) => a.track - b.track);
  for (const { i, track, dir } of ordered) {
    const depth = () => track * TRACK_STEP;
    const rect: PaneRect = {
      top: row.top,
      bottom: row.bottom,
      left: row.left + i * pw + travel * dir,
      right: row.left + (i + 1) * pw + travel * dir,
    };
    marks.push(
      ...paneMarks(rect, `slide-${i}`, t, {
        leftW: i !== 0 ? WEIGHTS.minor : t,
        rightW: i !== panels.length - 1 ? WEIGHTS.minor : t,
        depthAt: depth,
      }),
    );
  }
  return marks;
}
