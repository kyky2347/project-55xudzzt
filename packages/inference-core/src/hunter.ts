import { entropy, manhattan, normalize } from "./probability";
import { SeededRng } from "./rng";
import type { Facility, HunterMode, Position } from "./types";
import { floorPositions, indexOf, neighbors, shortestPath } from "./world";

export function initializeHunterBelief(world: Facility): number[] {
  const result = new Array<number>(world.width * world.height).fill(0);
  const floors = floorPositions(world);
  for (const position of floors) result[indexOf(world, position)] = 1 / floors.length;
  return result;
}

export function diffuseHunterBelief(world: Facility, prior: number[], persistence = 0.46): number[] {
  const next = new Array<number>(prior.length).fill(0);
  for (const position of floorPositions(world)) {
    const index = indexOf(world, position);
    const candidates = neighbors(world, position);
    next[index] = (next[index] ?? 0) + (prior[index] ?? 0) * persistence;
    const share = candidates.length ? ((prior[index] as number) * (1 - persistence)) / candidates.length : 0;
    for (const candidate of candidates) {
      const candidateIndex = indexOf(world, candidate);
      next[candidateIndex] = (next[candidateIndex] ?? 0) + share;
    }
  }
  return normalize(next);
}

export function updateHunterBelief(
  world: Facility,
  prior: number[],
  emissionCenter: Position,
  signature: number,
  sensitivity: number,
): number[] {
  const diffused = diffuseHunterBelief(world, prior);
  if (signature <= 0) return diffused;
  const sigma = Math.max(1.2, 12 / (1 + (signature / 12) * sensitivity));
  const likelihood = floorPositions(world).map((position) => {
    const distance = Math.hypot(position.x - emissionCenter.x, position.y - emissionCenter.y);
    return { index: indexOf(world, position), value: Math.exp(-(distance * distance) / (2 * sigma * sigma)) + 0.008 };
  });
  const posterior = [...diffused];
  for (const item of likelihood) posterior[item.index] = (posterior[item.index] as number) * item.value;
  return normalize(posterior);
}

export function hunterBeliefEntropy(belief: number[]): number {
  return entropy(belief);
}

export function chooseHunterTarget(world: Facility, belief: number[], rng: SeededRng): Position {
  const floors = floorPositions(world);
  if (rng.next() < 0.16) {
    const sorted = [...floors].sort((a, b) => (belief[indexOf(world, b)] as number) - (belief[indexOf(world, a)] as number));
    return rng.pick(sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.08))));
  }
  return floors.reduce((best, position) =>
    (belief[indexOf(world, position)] as number) > (belief[indexOf(world, best)] as number) ? position : best,
  );
}

export function moveHunter(world: Facility, current: Position, target: Position): Position {
  const path = shortestPath(world, current, target);
  return path[1] ?? current;
}

export function hunterModeFromState(signature: number, hunter: Position, player: Position, belief: number[]): HunterMode {
  if (manhattan(hunter, player) === 0) return "contact";
  const certainty = Math.max(...belief);
  const proximity = manhattan(hunter, player);
  if (proximity <= 3 || signature >= 65 || certainty > 0.08) return "hunting";
  if (signature >= 24 || certainty > 0.025) return "searching";
  if (signature >= 6 || proximity <= 9) return "disturbance";
  return "quiet";
}
