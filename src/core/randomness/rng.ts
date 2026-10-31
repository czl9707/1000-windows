// The deterministic base of every draw in the engine. See the Randomness chapter.

export function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
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

  chance(p: number): boolean {
    return this.r() < p;
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
