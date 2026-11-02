// The pen lifecycle both wall layers share: a pen exists exactly while its
// cell is on screen. Created on viewport entry, dropped on exit — the pen's
// internal trace cache dies with the instance, so nothing outlives the
// pan history and no cache grows unbounded. The painter applies the plan;
// this diff stays pure so the lifecycle is testable without a canvas.
//
// Keys are canonical strings (`"${a},${b}"`): a cell seen across two frames
// is two separate objects, so structural identity must be spelled, not
// referenced. Cells and texture slots share one spelling.

export interface PenPlan {
  create: string[];
  drop: string[];
}

export function pairKey(a: number, b: number): string {
  return `${a},${b}`;
}

export function pairFrom(key: string): [number, number] {
  const [a, b] = key.split(',').map(Number) as [number, number];
  return [a, b];
}

export function planPens(active: ReadonlySet<string>, wanted: readonly string[]): PenPlan {
  const wantedSet = new Set(wanted);
  const create = wanted.filter((key) => !active.has(key));
  const drop: string[] = [];
  for (const key of active) {
    if (!wantedSet.has(key)) drop.push(key);
  }
  return { create, drop };
}
