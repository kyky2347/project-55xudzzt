import { SENSOR_CONFIG } from "./config";
import { gaussianPdf, particleEntropy } from "./probability";
import { SeededRng } from "./rng";
import type { BeaconObservation, Facility, Observation, Particle, Position, RangeObservation, SensorKind } from "./types";
import { rayDistance } from "./world";

const RAYS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;

export function rssiAt(position: Position, beacon: Position): number {
  const distance = Math.max(1, Math.hypot(position.x - beacon.x, position.y - beacon.y));
  return -34 - 10 * 2.05 * Math.log10(distance);
}

function nearestBeacon(position: Position, world: Facility): Position {
  return [...world.beacons].sort(
    (a, b) => Math.hypot(position.x - a.x, position.y - a.y) - Math.hypot(position.x - b.x, position.y - b.y),
  )[0] as Position;
}

export function measureSensor(world: Facility, position: Position, sensor: SensorKind, rng: SeededRng, sigmaScale = 1, falsePositiveOverride?: number): Observation {
  const config = SENSOR_CONFIG[sensor];
  if (sensor === "beacon") {
    const beacon = nearestBeacon(position, world);
    const sigma = config.sigma * sigmaScale;
    return { kind: "beacon", sensor, beacon, sigma, rssi: rssiAt(position, beacon) + rng.gaussian(0, sigma) };
  }

  const sigma = config.sigma * sigmaScale;
  const dropoutRate = sensor === "passive" ? 0.28 : sensor === "ping" ? 0.12 : 0.025;
  const dropout = RAYS.map(() => rng.next() < dropoutRate);
  const ranges = RAYS.map(([dx, dy], index) => {
    if (dropout[index]) return Number.NaN;
    const actual = rayDistance(world, position, dx, dy, sensor === "sonar" ? 20 : 12);
    const falsePositiveRate = falsePositiveOverride ?? (sensor === "passive" ? 0.09 : sensor === "ping" ? 0.035 : 0.008);
    const falsePositive = rng.next() < falsePositiveRate;
    return Math.max(0, actual + rng.gaussian(0, sigma) + (falsePositive ? rng.gaussian(0, sigma * 2.6) : 0));
  });
  return { kind: "ranges", sensor, ranges, sigma, dropout };
}

export function observationLikelihood(world: Facility, position: Position, observation: Observation): number {
  if (observation.kind === "beacon") {
    return Math.max(1e-12, gaussianPdf(observation.rssi, rssiAt(position, observation.beacon), observation.sigma));
  }
  let likelihood = 1;
  for (let i = 0; i < RAYS.length; i += 1) {
    if (observation.dropout[i] || !Number.isFinite(observation.ranges[i])) continue;
    const [dx, dy] = RAYS[i] as (typeof RAYS)[number];
    likelihood *= Math.max(1e-8, gaussianPdf(observation.ranges[i] as number, rayDistance(world, position, dx, dy), observation.sigma));
  }
  return likelihood;
}

export function estimateInformationGain(
  particles: Particle[],
  world: Facility,
  sensor: SensorKind,
  rng: SeededRng,
  samples = 5,
): number {
  const prior = particleEntropy(particles, world.width, world.height);
  const cumulative: number[] = [];
  let running = 0;
  for (const particle of particles) {
    running += particle.weight;
    cumulative.push(running);
  }
  let posteriorEntropy = 0;
  for (let sample = 0; sample < samples; sample += 1) {
    const draw = rng.next();
    const index = Math.min(cumulative.findIndex((value) => value >= draw), particles.length - 1);
    const source = particles[Math.max(0, index)] as Particle;
    const observation = measureSensor(world, source, sensor, rng);
    const weights = particles.map((particle) => particle.weight * observationLikelihood(world, particle, observation));
    const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
    const candidate = particles.map((particle, i) => ({ ...particle, weight: (weights[i] as number) / total }));
    posteriorEntropy += particleEntropy(candidate, world.width, world.height);
  }
  return Math.max(0, prior - posteriorEntropy / samples);
}

export function observationSummary(observation: Observation): { quality: number; available: number } {
  if (observation.kind === "beacon") return { quality: Math.max(0, 1 - observation.sigma / 8), available: 1 };
  return {
    quality: Math.max(0, 1 - observation.sigma / 7),
    available: observation.dropout.filter((value) => !value).length,
  };
}

export function isRangeObservation(value: Observation): value is RangeObservation {
  return value.kind === "ranges";
}

export function isBeaconObservation(value: Observation): value is BeaconObservation {
  return value.kind === "beacon";
}
