// The hand rule: a run of dense lines on paper is never fully drawn — some
// are omitted outright, and a kept line covers only part of its run, the
// fill carrying the texture instead. Picked by the golden-angle sine,
// deterministic, no stream draw; three phase offsets keep the picks
// decorrelated, and the omit threshold maps the omit rate onto the sine's
// range. Object edges draw full — the rule exists for runs, not for hems,
// bars, rails, or a rod. Each drawer passes its own rates: the dialect is
// the drawer's, the rule is one.
import type { Mark } from '@/core/scene';
import { line } from '@/core/window-shell/shell';

export const GOLDEN_ANGLE = 2.399;

export interface HandRates {
  omit: number;
  minSpan: number;
}

export function omitLine(i: number, omit: number): boolean {
  return Math.sin(i * GOLDEN_ANGLE + 1.3) < 2 * omit - 1;
}

export function lineSpan(i: number, minSpan: number): [number, number] {
  const start = Math.abs(Math.sin(i * GOLDEN_ANGLE + 0.7)) * (1 - minSpan);
  const end = 1 - Math.abs(Math.sin(i * GOLDEN_ANGLE + 2.1)) * (1 - minSpan);
  return [start, end];
}

// One hand-ruled line along any run: omitted outright some of the time,
// otherwise kept over only part of its span.
export function handLine(
  rates: HandRates,
  name: string,
  i: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stroke: { depth: number; z: number; widthUnits: number },
): Mark[] {
  if (omitLine(i, rates.omit)) return [];
  const [f0, f1] = lineSpan(i, rates.minSpan);
  return [
    {
      kind: 'stroke',
      pts: line(
        x0 + (x1 - x0) * f0,
        y0 + (y1 - y0) * f0,
        x0 + (x1 - x0) * f1,
        y0 + (y1 - y0) * f1,
        () => stroke.depth,
      ),
      name,
      widthUnits: stroke.widthUnits,
      role: 'ink',
      z: stroke.z,
    },
  ];
}
