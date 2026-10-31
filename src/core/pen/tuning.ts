import type { Tuning } from './pen';

export type NumericTuningKey = {
  [K in keyof Tuning]: Tuning[K] extends number ? K : never;
}[keyof Tuning];

// The transplant verdict: the reference's constants survive onto window lines
// unchanged; the pressure curve is the one deliberate divergence (thick ends).
// See the pen chapter's Pressure section.
export const DEFAULT_TUNING: Tuning = {
  amplitude: 0.008,
  scratchWeight: 0.35,
  kochHand: 0.4,
  kochFrame: 1.2,
  handGain: 0.62,
  frameGain: 0.5,
  spitz: 0.6,
};
