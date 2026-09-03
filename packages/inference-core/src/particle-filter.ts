import { effectiveSampleSize, normalizeLogWeights, particleEntropy } from "./probability";
import { SeededRng } from "./rng";
import { observationLikelihood } from "./sensors";
import type { Direction, Facility, InferenceEngine, InferenceSettings, Observation, Particle, Position } from "./types";
import { floorPositions, isFloor } from "./world";

const VECTOR: Record<Direction, Position> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};

const SLIPS: Record<Direction, Direction[]> = {
  north: ["west", "east"],
  east: ["north", "south"],
  south: ["east", "west"],
  west: ["south", "north"],
};

export function initializeParticles(world: Facility, count: number, rng: SeededRng, spread?: { center: Position; radius: number }): Particle[] {
  const allFloors = floorPositions(world);
  const candidates = spread
    ? allFloors.filter((position) => Math.hypot(position.x - spread.center.x, position.y - spread.center.y) <= spread.radius)
    : allFloors;
  const source = candidates.length ? candidates : allFloors;
  return Array.from({ length: count }, () => ({ ...rng.pick(source), weight: 1 / count }));
}

function proposedDirection(action: Direction, draw: number, settings: InferenceSettings): Direction | null {
  if (draw < settings.motionCorrect) return action;
  if (draw < settings.motionCorrect + settings.motionStay) return null;
  const slips = SLIPS[action];
  return draw < settings.motionCorrect + settings.motionStay + (1 - settings.motionCorrect - settings.motionStay) / 2
    ? (slips[0] as Direction)
    : (slips[1] as Direction);
}

export class TypeScriptInferenceEngine implements InferenceEngine {
  predict(particles: Particle[], action: Direction, world: Facility, rng: SeededRng, settings: InferenceSettings): Particle[] {
    return particles.map((particle) => {
      const direction = proposedDirection(action, rng.next(), settings);
      if (!direction) return { ...particle };
      const vector = VECTOR[direction];
      const candidate = { x: particle.x + vector.x, y: particle.y + vector.y };
      return isFloor(world, candidate) ? { ...candidate, weight: particle.weight } : { ...particle };
    });
  }

  observe(particles: Particle[], observation: Observation, world: Facility): Particle[] {
    const logWeights = particles.map((particle) => Math.log(Math.max(particle.weight, 1e-300)) + Math.log(observationLikelihood(world, particle, observation)));
    const normalized = normalizeLogWeights(logWeights);
    return particles.map((particle, index) => ({ ...particle, weight: normalized[index] as number }));
  }

  resample(particles: Particle[], rng: SeededRng): Particle[] {
    if (!particles.length) return [];
    const count = particles.length;
    const cumulative: number[] = [];
    let sum = 0;
    for (const particle of particles) {
      sum += particle.weight;
      cumulative.push(sum);
    }
    const result: Particle[] = [];
    let index = 0;
    const start = rng.next() / count;
    for (let j = 0; j < count; j += 1) {
      const threshold = start + j / count;
      while (index < count - 1 && (cumulative[index] as number) < threshold) index += 1;
      const source = particles[index] as Particle;
      result.push({ x: source.x, y: source.y, weight: 1 / count });
    }
    return result;
  }
}

export class WasmInferenceEngine extends TypeScriptInferenceEngine {
  readonly available = false;
  readonly reason = "Optional WASM package was not bundled; deterministic TypeScript engine is active.";
}

export function updateBelief(
  particles: Particle[],
  observation: Observation,
  world: Facility,
  engine: InferenceEngine,
  rng: SeededRng,
  resampleThreshold: number,
): { particles: Particle[]; entropy: number; ess: number } {
  let updated = engine.observe(particles, observation, world);
  let ess = effectiveSampleSize(updated);
  if (ess < updated.length * resampleThreshold) {
    updated = engine.resample(updated, rng);
    ess = effectiveSampleSize(updated);
  }
  return { particles: updated, entropy: particleEntropy(updated, world.width, world.height), ess };
}
