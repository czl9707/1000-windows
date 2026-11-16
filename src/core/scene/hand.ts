// The hand rule's deterministic picking: a run of dense lines is never
// fully drawn — some are omitted outright, a kept line covers only part of
// its run. The golden-angle sine picks the omissions and the extents; three
// phase offsets keep the picks decorrelated. Deterministic, no stream draw.
export const GOLDEN_ANGLE = 2.399;

// Which dense line the rule omits, given the surface's omit rate (the
// share of lines dropped outright).
export function omitLine(i: number, rate: number): boolean {
  return Math.sin(i * GOLDEN_ANGLE + 1.3) < 2 * rate - 1;
}

// The kept run's extents, given the surface's minimum span share.
export function lineSpan(i: number, minSpan: number): [number, number] {
  const start = Math.abs(Math.sin(i * GOLDEN_ANGLE + 0.7)) * (1 - minSpan);
  const end = 1 - Math.abs(Math.sin(i * GOLDEN_ANGLE + 2.1)) * (1 - minSpan);
  return [start, end];
}
