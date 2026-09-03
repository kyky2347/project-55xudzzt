import type { Particle, Position } from "./types";

export const EPSILON = 1e-12;

export function gaussianPdf(value: number, mean: number, sigma: number): number {
  const safeSigma = Math.max(sigma, 1e-6);
  const z = (value - mean) / safeSigma;
  return Math.exp(-0.5 * z * z) / (safeSigma * Math.sqrt(2 * Math.PI));
}

export function normalize(values: number[]): number[] {
  const sanitized = values.map((value) => (Number.isFinite(value) && value > 0 ? value : 0));
  const total = sanitized.reduce((sum, value) => sum + value, 0);
  if (total <= EPSILON) return sanitized.map(() => 1 / Math.max(sanitized.length, 1));
  return sanitized.map((value) => value / total);
}

export function normalizeLogWeights(logWeights: number[]): number[] {
  const finite = logWeights.filter(Number.isFinite);
  if (!finite.length) return logWeights.map(() => 1 / Math.max(logWeights.length, 1));
  const max = Math.max(...finite);
  return normalize(logWeights.map((value) => (Number.isFinite(value) ? Math.exp(value - max) : 0)));
}

export function entropy(probabilities: number[]): number {
  return probabilities.reduce((sum, p) => (p > EPSILON ? sum - p * Math.log2(p) : sum), 0);
}

export function particleEntropy(particles: Particle[], width: number, height: number): number {
  const bins = new Array<number>(width * height).fill(0);
  for (const particle of particles) {
    const index = particle.y * width + particle.x;
    bins[index] = (bins[index] ?? 0) + particle.weight;
  }
  return entropy(normalize(bins));
}

export function effectiveSampleSize(particles: Particle[]): number {
  const sumSquares = particles.reduce((sum, particle) => sum + particle.weight * particle.weight, 0);
  return sumSquares <= EPSILON ? 0 : 1 / sumSquares;
}

export function weightedMean(particles: Particle[]): Position {
  if (!particles.length) return { x: 0, y: 0 };
  const total = particles.reduce((sum, p) => sum + p.weight, 0) || 1;
  return {
    x: particles.reduce((sum, p) => sum + p.x * p.weight, 0) / total,
    y: particles.reduce((sum, p) => sum + p.y * p.weight, 0) / total,
  };
}

export function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
