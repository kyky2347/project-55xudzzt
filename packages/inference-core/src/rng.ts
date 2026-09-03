export function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h += h << 13;
  h ^= h >>> 7;
  h += h << 3;
  h ^= h >>> 17;
  return (h + (h << 5)) >>> 0;
}

export class SeededRng {
  private state: number;

  constructor(seed: string | number) {
    this.state = typeof seed === "string" ? hashSeed(seed) : seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: readonly T[]): T {
    if (!items.length) throw new Error("Cannot pick from an empty collection");
    return items[Math.floor(this.next() * items.length)] as T;
  }

  gaussian(mean = 0, sigma = 1): number {
    const u = Math.max(this.next(), Number.EPSILON);
    const v = Math.max(this.next(), Number.EPSILON);
    return mean + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  fork(label: string): SeededRng {
    return new SeededRng(`${this.state}:${label}`);
  }

  getState(): number {
    return this.state >>> 0;
  }
}

export function createRunSeed(now = new Date(), rng = Math.random): string {
  const body = Math.floor(rng() * 1_000_000).toString().padStart(6, "0");
  return `ECHO-${body}`;
}

export function dailySeed(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `DAILY-${y}${m}${d}`;
}
