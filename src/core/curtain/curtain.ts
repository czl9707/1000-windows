// The tenant's first layer: the window covering hung behind the glass. The
// curtain rolls on the DNA stream (fork 'dna'), of which it is the first
// layer — the shell keeps its own fork, so the vocabularies grow without
// re-randomizing each other. Roll order lives in catalogue.ts.
import { fork } from '@/core/randomness/rng';
import {
  COVERAGE_LEVELS,
  DRAPE_SIDES,
  KINDS,
  SLAT_SHARE_RANGE,
  ROD_JITTER,
  WIDTH_JITTER,
  ZONE_CEILING,
  type CurtainKind,
} from './catalogue';
export interface BareCurtain {
  present: false;
}

export interface CoveredCurtain {
  present: true;
  kind: CurtainKind;
  // Clamped by the kind's zone ceiling (catalogue.ts owns the measurement).
  coverage: number;
  rodY: number;
  widthJitter: number;
  drapeSide: 'left' | 'right';
  // The venetian's opaque share per slat row, the 0 roll the closed blind;
  // every other kind leaves it rolled but unread.
  slatShare: number;
}

export type CurtainPlan = BareCurtain | CoveredCurtain;

export function expandCurtain(seed: number): CurtainPlan {
  const rng = fork(seed, 'dna');
  const level = rng.weighted(COVERAGE_LEVELS);
  if (level === 0) return { present: false };
  const kind = rng.weighted(KINDS);
  const coverage = Math.min(level, ZONE_CEILING[kind]);
  const rodY = rng.float(ROD_JITTER.min, ROD_JITTER.max);
  const widthJitter = rng.float(WIDTH_JITTER.min, WIDTH_JITTER.max);
  const drapeSide = rng.weighted(DRAPE_SIDES);
  const slatShare = rng.outliers(SLAT_SHARE_RANGE.min, SLAT_SHARE_RANGE.max, SLAT_SHARE_RANGE.outlierMin, SLAT_SHARE_RANGE.outlierMax);
  return { present: true, kind, coverage, rodY, widthJitter, drapeSide, slatShare };
}

// A hand-pinned plan for the demo plates: the drawers are pure, so a plate
// hands its plan directly, and the clamp matches the roller's so a pinned
// level draws what the street would draw.
export function pinnedCurtain(
  kind: CurtainKind,
  coverage: number,
  overrides: Partial<CoveredCurtain> = {},
): CurtainPlan {
  const base: CoveredCurtain = {
    present: true,
    kind,
    coverage: Math.min(coverage, ZONE_CEILING[kind]),
    rodY: 0,
    widthJitter: 1,
    drapeSide: 'left',
    slatShare: 0,
  };
  return { ...base, ...overrides };
}
