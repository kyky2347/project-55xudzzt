import { performance } from "node:perf_hooks";
import { DIFFICULTY } from "./config";
import { TypeScriptInferenceEngine, initializeParticles, updateBelief } from "./particle-filter";
import { SeededRng } from "./rng";
import { measureSensor } from "./sensors";
import { generateFacility } from "./world";

const rounds = 30;
const mapTimes: number[] = [];
const filterTimes: number[] = [];
for (let index = 0; index < rounds; index += 1) {
  const mapStart = performance.now();
  const world = generateFacility(`BENCH-${index}`);
  mapTimes.push(performance.now() - mapStart);
  const rng = new SeededRng(`BENCH-${index}:filter`);
  const particles = initializeParticles(world, 10_000, rng);
  const observation = measureSensor(world, world.start, "sonar", rng);
  const engine = new TypeScriptInferenceEngine();
  const filterStart = performance.now();
  updateBelief(particles, observation, world, engine, rng, DIFFICULTY.signal.resampleThreshold);
  filterTimes.push(performance.now() - filterStart);
}

const summarize = (values: number[]) => ({
  mean: values.reduce((sum, value) => sum + value, 0) / values.length,
  p95: [...values].sort((a, b) => a - b)[Math.floor(values.length * 0.95)] as number,
});

console.log(JSON.stringify({ runtime: `${process.platform} ${process.arch} / Node ${process.version}`, rounds, mapGenerationMs: summarize(mapTimes), particleFilter10kMs: summarize(filterTimes) }, null, 2));
