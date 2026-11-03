// The shell catalogue: pure data. Everything here is decided in the wayfinder
// ticket "Window shell archetypes — frame variants"; the numbers are constants
// of the drawing, the weights of the street.
//
// Roll order in the shell stream (append new rolls at the end, never between):
// archetype → pane layout → open state → slide side (when a slider rolls)
// → measured. The catalogue itself is freely editable between versions; the
// only invariant is that a seed's roll sequence stays a pure function of the
// seed, never of pan position or render order.
//
// The casement never rolls an undivided single leaf: a swung lone leaf over
// an undivided pane reads as a picture window that came open — an undivided
// pane says picture, always. Shutters mount on sliders only: they flank a
// wall of sliding panes the way they flank a door, never a swung casement.

import { WEIGHTS } from '@/styling/weights';

export type Side = 'left' | 'right';

export type SlidingLayout = 'two' | 'three' | 'transom';
export type CasementLayout = 'pair' | 'one-two';
export type PictureLayout = 'single';
export type LayoutId = SlidingLayout | CasementLayout | PictureLayout;
export type OpenState = 'closed' | 'half-open' | 'open';
export type SillId = 'flat' | 'bracketed' | 'flush';
export type AwningId = 'none' | 'slope' | 'canopy';
export type ShuttersId = 'none' | 'louvered' | 'paneled';
export type BoxId = 'none' | 'box' | 'pair';

// The measured rolls and the mounted masses, shared by every archetype.
interface ShellMasses {
  thicknessJitter: number;
  faceWidth: number;
  sill: SillId;
  awning: AwningId;
  shutters: ShuttersId;
  box: BoxId;
}

export interface SlidingPlan extends ShellMasses {
  archetype: 'sliding';
  layout: SlidingLayout;
  open: OpenState;
  // Which side's panel rides the back track and slides.
  slideSide: Side;
}

export interface CasementPlan extends ShellMasses {
  archetype: 'casement';
  layout: CasementLayout;
  open: OpenState;
}

export interface PicturePlan extends ShellMasses {
  archetype: 'picture';
  layout: PictureLayout;
}

export type ShellPlan = SlidingPlan | CasementPlan | PicturePlan;

interface Archetype<L extends LayoutId> {
  weight: number;
  layouts: readonly { value: L; weight: number }[];
  // Frame face thickness in unit measure (outer box 1.6 × 1.0).
  frameThickness: number;
}

export const OPEN_STATES: readonly { value: OpenState; weight: number }[] = [
  { value: 'closed', weight: 4 },
  { value: 'open', weight: 2 },
  { value: 'half-open', weight: 1 },
];

export const SIDES: readonly { value: Side; weight: number }[] = [
  { value: 'left', weight: 1 },
  { value: 'right', weight: 1 },
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

export const ARCHETYPES: {
  sliding: Archetype<SlidingLayout>;
  casement: Archetype<CasementLayout>;
  picture: Archetype<PictureLayout>;
} = {
  sliding: {
    weight: 4,
    layouts: [
      { value: 'two', weight: 4 },
      { value: 'three', weight: 2 },
      { value: 'transom', weight: 2 },
    ],
    frameThickness: WEIGHTS.major,
  },
  casement: {
    weight: 3,
    layouts: [
      { value: 'pair', weight: 4 },
      { value: 'one-two', weight: 2 },
    ],
    frameThickness: WEIGHTS.major,
  },
  picture: {
    weight: 2,
    layouts: [{ value: 'single', weight: 1 }],
    frameThickness: WEIGHTS.major,
  },
};
