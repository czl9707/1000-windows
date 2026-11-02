import type { ParamSpec } from '@/components/DemoCanvasControls';
import type { NumericTuningKey } from '@/pen/tuning';

export const PARAMS: (ParamSpec & { key: NumericTuningKey })[] = [
  { key: 'amplitude', label: 'Warp amplitude', min: 0, max: 0.03, step: 0.001 },
  { key: 'scratchWeight', label: 'Scratch weight', min: 0, max: 1, step: 0.05 },
  { key: 'kochHand', label: 'Hand-only boil below', min: 0, max: 5, step: 0.1 },
  { key: 'kochFrame', label: 'On-beat boil above', min: 0, max: 8, step: 0.1 },
  { key: 'handGain', label: 'Hand gain', min: 0, max: 2, step: 0.05 },
  { key: 'frameGain', label: 'Frame gain', min: 0, max: 2, step: 0.05 },
  { key: 'spitz', label: 'Pressure', min: 0, max: 1, step: 0.05 },
];
