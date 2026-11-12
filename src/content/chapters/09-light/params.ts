import type { ParamSpec } from '@/components/DemoCanvasControls';
import type { ColourwayTuning } from '@/styling/colourway';

// The kinds bench's knobs: every window in the grid wears the same pinned
// plan, so a slider reads across all six constructions at once. The values
// index the roll's catalogues.
export const KIND_PARAMS: ParamSpec[] = [
  { key: 'night', label: 'Night', min: 0, max: 1, step: 1 },
  { key: 'location', label: 'Location (left/inner left/inner right/right)', min: 0, max: 3, step: 1 },
  { key: 'facing', label: 'Facing (left/right)', min: 0, max: 1, step: 1 },
  { key: 'lit', label: 'Lights on', min: 0, max: 1, step: 1 },
];

// The night street's knobs: the light layer's dials of the colour model,
// over the shipped defaults.
export const STREET_PARAMS: (ParamSpec & { key: keyof ColourwayTuning })[] = [
  { key: 'veilAlpha', label: 'Veil', min: 0, max: 0.9, step: 0.05 },
  { key: 'ambientAlpha', label: 'Ambient', min: 0, max: 0.4, step: 0.02 },
  { key: 'auraAlpha', label: 'Aura', min: 0, max: 0.4, step: 0.02 },
  { key: 'lightChromaCap', label: 'Warmth ceiling', min: 0.04, max: 0.24, step: 0.01 },
  { key: 'lampLightnessShift', label: 'Lamp body dark', min: -0.6, max: 0, step: 0.05 },
];
