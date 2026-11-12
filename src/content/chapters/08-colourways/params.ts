import type { ParamSpec } from '@/components/DemoCanvasControls';
import type { ColourwayTuning } from '@/styling/colourway';

// The knobs of the feelings round, over the shipped model.
export const PARAMS: (ParamSpec & { key: keyof ColourwayTuning })[] = [
  { key: 'chromaScale', label: 'Family chroma ×', min: 0.4, max: 2.2, step: 0.05 },
  { key: 'lightnessLift', label: 'Painted lightness lift', min: -0.15, max: 0.2, step: 0.01 },
  { key: 'washAlpha', label: 'Cloth wash', min: 0, max: 1, step: 0.05 },
];

export const NIGHT_PARAM: ParamSpec[] = [
  { key: 'nightMix', label: 'Night veil', min: 0, max: 1, step: 0.05 },
];
