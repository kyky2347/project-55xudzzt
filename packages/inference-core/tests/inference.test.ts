import { describe, expect, it } from "vitest";
import {
  DIFFICULTY,
  SeededRng,
  TypeScriptInferenceEngine,
  effectiveSampleSize,
  generateFacility,
  initializeParticles,
  measureSensor,
  particleEntropy,
  updateBelief,
} from "../src";

describe("particle inference", () => {
  it("normalizes weights and keeps entropy finite", () => {
    const world = generateFacility("INFERENCE-1");
    const rng = new SeededRng("INFERENCE-1:filter");
    const particles = initializeParticles(world, 1_000, rng);
    const observation = measureSensor(world, world.start, "sonar", rng);
    const update = updateBelief(particles, observation, world, new TypeScriptInferenceEngine(), rng, 0.5);
    expect(update.particles.reduce((sum, particle) => sum + particle.weight, 0)).toBeCloseTo(1, 8);
    expect(update.entropy).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(update.entropy)).toBe(true);
    expect(effectiveSampleSize(update.particles)).toBeGreaterThan(0);
  });

  it("resampling preserves particle count", () => {
    const world = generateFacility("RESAMPLE");
    const rng = new SeededRng("RESAMPLE:filter");
    const particles = initializeParticles(world, 777, rng).map((particle, index) => ({ ...particle, weight: index === 0 ? 1 : 0 }));
    const resampled = new TypeScriptInferenceEngine().resample(particles, rng);
    expect(resampled).toHaveLength(777);
    expect(resampled.reduce((sum, particle) => sum + particle.weight, 0)).toBeCloseTo(1, 8);
  });

  it("an informative sonar reduces entropy more than a noisy passive sample on average", () => {
    let sonarReduction = 0;
    let passiveReduction = 0;
    for (let run = 0; run < 8; run += 1) {
      const world = generateFacility(`INFO-${run}`);
      const priorRng = new SeededRng(`INFO-${run}:prior`);
      const prior = initializeParticles(world, 1_200, priorRng);
      const before = particleEntropy(prior, world.width, world.height);
      const sonarRng = new SeededRng(`INFO-${run}:sonar`);
      const sonar = measureSensor(world, world.start, "sonar", sonarRng);
      sonarReduction += before - updateBelief(prior, sonar, world, new TypeScriptInferenceEngine(), sonarRng, 0.2).entropy;
      const passiveRng = new SeededRng(`INFO-${run}:passive`);
      const passive = measureSensor(world, world.start, "passive", passiveRng);
      passiveReduction += before - updateBelief(prior, passive, world, new TypeScriptInferenceEngine(), passiveRng, 0.2).entropy;
    }
    expect(sonarReduction).toBeGreaterThan(passiveReduction);
  });

  it("prediction never creates non-floor particles", () => {
    const world = generateFacility("PREDICT");
    const rng = new SeededRng("PREDICT:filter");
    const particles = initializeParticles(world, 500, rng);
    const predicted = new TypeScriptInferenceEngine().predict(particles, "north", world, rng, DIFFICULTY.signal);
    expect(predicted.every((particle) => world.cells[particle.y * world.width + particle.x] === 1)).toBe(true);
  });
});
