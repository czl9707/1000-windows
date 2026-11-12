// The curtain catalogue: pure data. Everything here is decided in the wayfinder
// ticket "Curtains — fabric on the pane"; the numbers are constants of the
// drawing, the weights of the street.
//
// Roll order in the curtain stream (append new rolls at the end, never
// between): coverage level → kind → rod jitter → width jitter → drape side →
// blind slat share. The zero level is the bare window — a bare window rolls
// nothing further and draws no cloth. The catalogue is freely editable
// between versions; a seed's roll sequence stays a pure function of the seed.

export type CurtainKind = 'panels' | 'drapes' | 'venetian' | 'roman';

// The coverage levels, first roll of the stream: 0 is the bare window — the
// roll decides presence and coverage in one pick. Mostly bare or lightly
// dressed; a rare window covered wall to wall.
export const COVERAGE_LEVELS: readonly { value: number; weight: number }[] = [
  { value: 0, weight: 4 },
  { value: 0.3, weight: 4 },
  { value: 0.6, weight: 1 },
  { value: 1, weight: 1 },
];

export const KINDS: readonly { value: CurtainKind; weight: number }[] = [
  { value: 'panels', weight: 4 },
  { value: 'drapes', weight: 3 },
  { value: 'venetian', weight: 2 },
  { value: 'roman', weight: 2 },
];

// The zone ceiling per kind — the zone is the ceiling, never the measure: the
// drawn coverage is the rolled level clamped to it (panels pulling 0.6 and 1
// both onto their dressing ceiling). Panels measure their reach inward per
// side as a share of half the opening's width; every other kind measures
// down as a share of the opening's height.
export const ZONE_CEILING: Record<CurtainKind, number> = {
  panels: 0.4,
  drapes: 0.95,
  venetian: 0.85,
  roman: 0.9,
};

export const ROD_JITTER = { min: -0.02, max: 0.02 } as const;
export const ROD_CLEARANCE = 0.03;
// The cloth widths (the panels' inward reach) jitter around their rolled
// share, so two windows of the same kind and coverage never match cloth for
// cloth.
export const WIDTH_JITTER = { min: 0.9, max: 1.1 } as const;
export const DRAPE_SIDES: readonly { value: 'left' | 'right'; weight: number }[] = [
  { value: 'left', weight: 1 },
  { value: 'right', weight: 1 },
];

// The venetian's slat share: the share of each slat row that draws opaque,
// transparent below. Mostly light — the glass shows through wide gaps — a
// rare blind heavy. The 0 roll is the closed blind and draws full.
export const SLAT_SHARE_RANGE = { min: 0, max: 0.35, outlierMin: 0, outlierMax: 0.8 } as const;

// The cloth hangs behind the wall plane: its points carry true depth, so the
// projection sits it in the room and the pane wash draws over it. The sort
// bucket slides between the backing and the glass. A bucket value must never
// reach the points, and the depth must never reach a sort key.
export const CURTAIN_DEPTH = -0.06;
export const CURTAIN_Z = -5;
