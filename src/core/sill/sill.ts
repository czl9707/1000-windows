// The layer between the curtain and the glass: at most one small prop on the
// inside ledge, anchored into its rolled corner. The sill rolls on the walk's
// DNA stream, after the curtain block, unconditionally.
import type { Rng } from '@/core/randomness/rng';
import { BOOK_COUNT_RANGE, KINDS, PLANT_KINDS, SIDES, WIDTH_JITTER, type PlantKind, type SillKind, type SillSide } from './catalogue';

export interface BareSill {
  present: false;
}

export interface AnchoredSill {
  present: true;
  side: SillSide;
  kind: SillKind;
  widthJitter: number;
  // The books' volume count; rolled for every kind, read only by books —
  // the curtain's slatShare pattern.
  bookCount: number;
  // The plant vocabulary; rolled for every kind, read only by plants.
  plantKind: PlantKind;
}

export type SillPlan = BareSill | AnchoredSill;

export function expandSill(rng: Rng): SillPlan {
  const side = rng.weighted(SIDES);
  if (side === 'none') return { present: false };
  const kind = rng.weighted(KINDS);
  const widthJitter = rng.float(WIDTH_JITTER.min, WIDTH_JITTER.max);
  const bookCount = Math.floor(rng.float(BOOK_COUNT_RANGE.min, BOOK_COUNT_RANGE.max + 1));
  const plantKind = rng.weighted(PLANT_KINDS);
  return { present: true, side, kind, widthJitter, bookCount, plantKind };
}
