// The shell catalogue: pure data. Everything here is decided in the wayfinder
// ticket "Window shell archetypes — frame variants"; the numbers are constants
// of the drawing, the weights of the street.
//
// Roll order in the shell stream (append new rolls at the end, never between):
// archetype → pane layout → open state → hinge side (when a casement opens)
// → measured. The catalogue itself is freely editable between versions; the
// only invariant is that a seed's roll sequence stays a pure function of the
// seed, never of pan position or render order.

export type ArchetypeId = 'sash' | 'casement' | 'picture';
export type LayoutId = '1-over-1' | '2-over-2' | '6-over-6' | 'single' | 'pair' | 'four-pane';
export type OpenState = 'closed' | 'half-open' | 'open';
export type HingeSide = 'left' | 'right';
export type SillId = 'flat' | 'bracketed' | 'flush';
export type AwningId = 'none' | 'slope' | 'canopy';
export type ShuttersId = 'none' | 'louvered' | 'paneled';
export type BoxId = 'none' | 'box' | 'pair';

export interface ShellPlan {
  archetype: ArchetypeId;
  layout: LayoutId;
  open: OpenState;
  hingeSide: HingeSide | null;
  // The measured rolls: a multiplier on the archetype's frame thickness, then
  // the absolute face width (the run between the frame's outer and inner line).
  thicknessJitter: number;
  faceWidth: number;
  sill: SillId;
  awning: AwningId;
  shutters: ShuttersId;
  box: BoxId;
}

export interface Archetype {
  weight: number;
  layouts: readonly { value: LayoutId; weight: number }[];
  operable: boolean;
  // Frame face thickness in unit measure (outer box 1.6 × 1.0).
  frameThickness: number;
}

export const OPEN_STATES: readonly { value: OpenState; weight: number }[] = [
  { value: 'closed', weight: 4 },
  { value: 'open', weight: 2 },
  { value: 'half-open', weight: 1 },
];

export const SILLS: readonly { value: SillId; weight: number }[] = [
  { value: 'flat', weight: 5 },
  { value: 'bracketed', weight: 2 },
  { value: 'flush', weight: 1 },
];

export const ADDONS: {
  awning: readonly { value: AwningId; weight: number }[];
  shutters: readonly { value: ShuttersId; weight: number }[];
  box: readonly { value: BoxId; weight: number }[];
} = {
  awning: [
    { value: 'none', weight: 4 },
    { value: 'slope', weight: 2 },
    { value: 'canopy', weight: 1 },
  ],
  shutters: [
    { value: 'none', weight: 4 },
    { value: 'louvered', weight: 2 },
    { value: 'paneled', weight: 1 },
  ],
  box: [
    { value: 'none', weight: 8 },
    { value: 'box', weight: 1 },
    { value: 'pair', weight: 1 },
  ],
};

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  sash: {
    weight: 4,
    layouts: [
      { value: '1-over-1', weight: 4 },
      { value: '2-over-2', weight: 3 },
      { value: '6-over-6', weight: 1 },
    ],
    operable: true,
    frameThickness: 0.032,
  },
  casement: {
    weight: 3,
    layouts: [
      { value: 'pair', weight: 4 },
      { value: 'single', weight: 3 },
      { value: 'four-pane', weight: 1 },
    ],
    operable: true,
    frameThickness: 0.03,
  },
  picture: {
    weight: 2,
    layouts: [{ value: 'single', weight: 1 }],
    operable: false,
    frameThickness: 0.028,
  },
};
