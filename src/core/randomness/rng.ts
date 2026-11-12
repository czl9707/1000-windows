// The deterministic base of every draw in the engine. See the Randomness chapter.

export function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// A window's grid address survives only inside this call: everything downstream
// draws from the returned seed alone, so the renderer never sees coordinates.
export function windowSeed(metaSeed: number, col: number, row: number): number {
  return fnv1a(`${metaSeed}:w:${col},${row}`);
}

// A named independent stream off a seed — for rolls (e.g. motion) that must not
// shift the DNA stream's append-only draw order.
export function fork(seed: number, label: string): Rng {
  return new Rng(fnv1a(`${seed}:${label}`));
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private r: () => number;

  constructor(seed: number) {
    this.r = mulberry32(seed);
    for (let i = 0; i < 8; i++) this.r();
  }

  float(min: number, max: number): number {
    return min + (max - min) * this.r();
  }

  // The reference's mitAusreissern: one draw, 8/10 of the unit interval in
  // the plain range, the outer tenth on each side stretched to the outlier
  // bound — most windows ordinary, a rare few reach further.
  outliers(min: number, max: number, outlierMin: number, outlierMax: number): number {
    const r = this.r();
    if (r < 0.8) return min + (max - min) * (r / 0.8);
    if (r < 0.9) return min - (min - outlierMin) * ((r - 0.8) / 0.1);
    return max + (outlierMax - max) * ((r - 0.9) / 0.1);
  }

  weighted<T>(items: readonly { value: T; weight: number }[]): T {
    let total = 0;
    for (const item of items) total += item.weight;
    let roll = this.r() * total;
    for (const item of items) {
      roll -= item.weight;
      if (roll < 0) return item.value;
    }
    return items[items.length - 1].value;
  }
}
