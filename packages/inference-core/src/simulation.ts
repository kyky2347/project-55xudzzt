import { DIFFICULTY, SENSOR_CONFIG } from "./config";
import { chooseHunterTarget, hunterBeliefEntropy, hunterModeFromState, initializeHunterBelief, moveHunter, updateHunterBelief } from "./hunter";
import { TypeScriptInferenceEngine, initializeParticles, updateBelief } from "./particle-filter";
import { manhattan, particleEntropy, weightedMean } from "./probability";
import { SeededRng } from "./rng";
import { estimateInformationGain, measureSensor, observationLikelihood } from "./sensors";
import type {
  Difficulty,
  Direction,
  GameState,
  HunterMode,
  Observation,
  Particle,
  Position,
  ReplayFrame,
  SensorKind,
  PlayProjection,
} from "./types";
import { generateFacility, isFloor } from "./world";

const ENGINE = new TypeScriptInferenceEngine();
const VECTOR: Record<Direction, Position> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};
const SIDEWAYS: Record<Direction, [Direction, Direction]> = {
  north: ["west", "east"],
  east: ["north", "south"],
  south: ["east", "west"],
  west: ["south", "north"],
};

function moveWithNoise(state: GameState, action: Direction, rng: SeededRng): Position {
  const config = DIFFICULTY[state.difficulty];
  const draw = rng.next();
  let actual: Direction | null = action;
  if (draw >= config.motionCorrect && draw < config.motionCorrect + config.motionStay) actual = null;
  else if (draw >= config.motionCorrect + config.motionStay) {
    const slips = SIDEWAYS[action];
    actual = rng.next() < 0.5 ? slips[0] : slips[1];
  }
  if (!actual) return state.truth.player;
  const vector = VECTOR[actual];
  const candidate = { x: state.truth.player.x + vector.x, y: state.truth.player.y + vector.y };
  return isFloor(state.facility, candidate) ? candidate : state.truth.player;
}

function updateMemory(state: GameState, observation: Observation, mean: Position): number[] {
  const memory = [...state.belief.memory];
  const width = state.facility.width;
  const mark = (position: Position, value: number) => {
    if (position.x < 0 || position.y < 0 || position.x >= width || position.y >= state.facility.height) return;
    const index = position.y * width + position.x;
    const old = memory[index] as number;
    memory[index] = Math.abs(value) > Math.abs(old) ? value : old * 0.72 + value * 0.28;
  };
  const center = { x: Math.round(mean.x), y: Math.round(mean.y) };
  mark(center, 1);
  if (observation.kind === "beacon") {
    mark(observation.beacon, 0.46);
    return memory;
  }
  const rays = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ] as const;
  observation.ranges.forEach((range, index) => {
    if (!Number.isFinite(range) || observation.dropout[index]) return;
    const [dx, dy] = rays[index] as (typeof rays)[number];
    const confidence = observation.sensor === "sonar" ? 0.94 : observation.sensor === "ping" ? 0.68 : 0.34;
    const steps = Math.max(0, Math.round(range));
    for (let step = 1; step <= steps; step += 1) mark({ x: center.x + dx * step, y: center.y + dy * step }, confidence);
    mark({ x: center.x + dx * (steps + 1), y: center.y + dy * (steps + 1) }, -confidence);
  });
  return memory;
}

function cooldownsAfterTick(cooldowns: GameState["sensorCooldowns"]): GameState["sensorCooldowns"] {
  return {
    passive: Math.max(0, cooldowns.passive - 1),
    ping: Math.max(0, cooldowns.ping - 1),
    sonar: Math.max(0, cooldowns.sonar - 1),
    beacon: Math.max(0, cooldowns.beacon - 1),
  };
}

function frameFor(state: GameState, action: string): ReplayFrame {
  return {
    tick: state.tick,
    action,
    player: { ...state.truth.player },
    hunter: { ...state.truth.hunter },
    beliefMean: weightedMean(state.belief.particles),
    particles: state.belief.particles.filter((_, index) => index % Math.max(1, Math.floor(state.belief.particles.length / 280)) === 0),
    likelihood: state.belief.lastLikelihood,
    hunterBelief: state.hunterBelief,
    entropy: state.belief.entropy,
    hunterEntropy: hunterBeliefEntropy(state.hunterBelief),
    energy: state.energy,
    signature: state.signature,
    informationGain: state.lastInfoGain,
    hunterMode: state.hunterMode,
    cores: state.truth.collected.filter(Boolean).length,
  };
}

function settleObjectives(state: GameState): GameState {
  const collected = [...state.truth.collected];
  state.facility.cores.forEach((core, index) => {
    if (!collected[index] && manhattan(core, state.truth.player) === 0) collected[index] = true;
  });
  const extractionRevealed = collected.every(Boolean);
  let result = state.result;
  if (state.energy <= 0) result = "lost-energy";
  if (state.hunterMode === "contact") result = "lost-contact";
  if (extractionRevealed && manhattan(state.truth.player, state.facility.extraction) === 0) result = "survived";
  return {
    ...state,
    truth: { ...state.truth, collected, extractionRevealed },
    result,
    metrics: result === "active" ? state.metrics : {
      ...state.metrics,
      contactEvents: result === "lost-contact" && state.result === "active" ? state.metrics.contactEvents + 1 : state.metrics.contactEvents,
      endedAt: state.metrics.endedAt ?? Date.now(),
    },
  };
}

function advanceHunter(state: GameState, emission: number, rng: SeededRng): Pick<GameState, "hunterBelief" | "hunterTarget" | "hunterMode" | "truth"> {
  const config = DIFFICULTY[state.difficulty];
  const hunterBelief = updateHunterBelief(state.facility, state.hunterBelief, state.truth.player, emission, config.hunterSensitivity);
  const target = state.tick % 3 === 0 || manhattan(state.truth.hunter, state.hunterTarget) === 0
    ? chooseHunterTarget(state.facility, hunterBelief, rng)
    : state.hunterTarget;
  const hunter = moveHunter(state.facility, state.truth.hunter, target);
  const hunterMode = hunterModeFromState(state.signature, hunter, state.truth.player, hunterBelief);
  return { hunterBelief, hunterTarget: target, hunterMode, truth: { ...state.truth, hunter } };
}

export function createGame(seed: string, difficulty: Difficulty = "signal"): GameState {
  const facility = generateFacility(seed);
  const config = DIFFICULTY[difficulty];
  const rng = new SeededRng(`${seed}:simulation`);
  const particles = initializeParticles(facility, config.particles, rng);
  const hunterBelief = initializeHunterBelief(facility);
  const base: GameState = {
    id: `${seed}-${Date.now().toString(36)}`,
    seed,
    difficulty,
    tick: 0,
    rngState: rng.getState(),
    facility,
    truth: {
      player: { ...facility.start },
      hunter: { ...facility.hunterStart },
      collected: [false, false, false],
      extractionRevealed: false,
    },
    belief: {
      particles,
      entropy: particleEntropy(particles, facility.width, facility.height),
      ess: particles.length,
      memory: new Array<number>(facility.width * facility.height).fill(0),
    },
    hunterBelief,
    hunterMode: "quiet",
    hunterTarget: { ...facility.start },
    energy: config.energy,
    maxEnergy: config.energy,
    signature: 0,
    sensorCooldowns: { passive: 0, ping: 0, sonar: 0, beacon: 0 },
    lastInfoGain: 0,
    result: "active",
    frames: [],
    metrics: {
      moves: 0,
      scans: 0,
      energyUsed: 0,
      informationGain: 0,
      signatureGenerated: 0,
      contactEvents: 0,
      entropySamples: [],
      startedAt: Date.now(),
    },
  };
  return { ...base, frames: [frameFor(base, "wake")] };
}

export function movePlayer(state: GameState, action: Direction): GameState {
  if (state.result !== "active") return state;
  const rng = new SeededRng(state.rngState);
  const config = DIFFICULTY[state.difficulty];
  const actualPlayer = moveWithNoise(state, action, rng);
  let particles = ENGINE.predict(state.belief.particles, action, state.facility, rng, config);
  const passive = measureSensor(state.facility, actualPlayer, "passive", rng, config.distanceSigma / DIFFICULTY.signal.distanceSigma);
  const beforeEntropy = particleEntropy(particles, state.facility.width, state.facility.height);
  const observed = updateBelief(particles, passive, state.facility, ENGINE, rng, config.resampleThreshold);
  particles = observed.particles;
  const informationGain = Math.max(0, beforeEntropy - observed.entropy);
  const energy = Math.max(0, state.energy - 0.45);
  let next: GameState = {
    ...state,
    tick: state.tick + 1,
    rngState: rng.getState(),
    truth: { ...state.truth, player: actualPlayer },
    belief: {
      ...state.belief,
      particles,
      entropy: observed.entropy,
      ess: observed.ess,
      memory: updateMemory(state, passive, weightedMean(particles)),
      lastLikelihood: undefined,
    },
    lastObservation: passive,
    lastInfoGain: informationGain,
    energy,
    signature: Math.max(0, state.signature * 0.77 + 0.55),
    sensorCooldowns: cooldownsAfterTick(state.sensorCooldowns),
    metrics: {
      ...state.metrics,
      moves: state.metrics.moves + 1,
      energyUsed: state.metrics.energyUsed + (state.energy - energy),
      informationGain: state.metrics.informationGain + informationGain,
      signatureGenerated: state.metrics.signatureGenerated + 0.55,
      entropySamples: [...state.metrics.entropySamples, observed.entropy],
    },
  };
  next = { ...next, ...advanceHunter(next, 0.55, rng), rngState: rng.getState() };
  next = settleObjectives(next);
  return { ...next, frames: [...next.frames, frameFor(next, `move:${action}`)] };
}

export function useSensor(state: GameState, sensor: SensorKind): GameState {
  if (state.result !== "active" || state.sensorCooldowns[sensor] > 0) return state;
  const cost = SENSOR_CONFIG[sensor];
  if (state.energy < cost.energy) return state;
  const rng = new SeededRng(state.rngState);
  const config = DIFFICULTY[state.difficulty];
  const observation = measureSensor(state.facility, state.truth.player, sensor, rng, config.distanceSigma / DIFFICULTY.signal.distanceSigma);
  const beforeEntropy = state.belief.entropy;
  const observed = updateBelief(state.belief.particles, observation, state.facility, ENGINE, rng, config.resampleThreshold);
  const informationGain = Math.max(0, beforeEntropy - observed.entropy);
  const energy = Math.max(0, state.energy - cost.energy);
  const signature = Math.min(100, state.signature * 0.84 + cost.signature);
  const likelihoodRaw = state.facility.cells.map((cell, index) => {
    if (cell !== 1) return 0;
    return observationLikelihood(state.facility, { x: index % state.facility.width, y: Math.floor(index / state.facility.width) }, observation);
  });
  const likelihoodMax = Math.max(...likelihoodRaw, 1e-20);
  const sensorCooldowns = cooldownsAfterTick(state.sensorCooldowns);
  sensorCooldowns[sensor] = cost.cooldown;
  let next: GameState = {
    ...state,
    tick: state.tick + 1,
    rngState: rng.getState(),
    belief: {
      ...state.belief,
      particles: observed.particles,
      entropy: observed.entropy,
      ess: observed.ess,
      memory: updateMemory(state, observation, weightedMean(observed.particles)),
      lastLikelihood: likelihoodRaw.map((value) => value / likelihoodMax),
    },
    lastObservation: observation,
    lastInfoGain: informationGain,
    energy,
    signature,
    sensorCooldowns,
    metrics: {
      ...state.metrics,
      scans: state.metrics.scans + 1,
      energyUsed: state.metrics.energyUsed + cost.energy,
      informationGain: state.metrics.informationGain + informationGain,
      signatureGenerated: state.metrics.signatureGenerated + cost.signature,
      entropySamples: [...state.metrics.entropySamples, observed.entropy],
    },
  };
  next = { ...next, ...advanceHunter(next, cost.signature, rng), rngState: rng.getState() };
  next = settleObjectives(next);
  return { ...next, frames: [...next.frames, frameFor(next, `sensor:${sensor}`)] };
}

export function expectedSensorValue(state: GameState, sensor: SensorKind): number {
  const rng = new SeededRng(`${state.seed}:eig:${state.tick}:${sensor}`);
  return estimateInformationGain(state.belief.particles, state.facility, sensor, rng, 4);
}

export function objectiveSignal(state: GameState): { bearing: Direction; strength: "faint" | "unstable" | "clear"; distance: number } {
  const target = state.truth.extractionRevealed
    ? state.facility.extraction
    : state.facility.cores
        .filter((_, index) => !state.truth.collected[index])
        .sort((a, b) => manhattan(state.truth.player, a) - manhattan(state.truth.player, b))[0] ?? state.facility.extraction;
  const rng = new SeededRng(`${state.seed}:objective:${state.tick}`);
  const dx = target.x - state.truth.player.x + Math.round(rng.gaussian(0, 2.2));
  const dy = target.y - state.truth.player.y + Math.round(rng.gaussian(0, 2.2));
  const bearing: Direction = Math.abs(dx) > Math.abs(dy) ? (dx >= 0 ? "east" : "west") : dy >= 0 ? "south" : "north";
  const distance = Math.max(0, manhattan(state.truth.player, target) + rng.gaussian(0, 3));
  return { bearing, distance, strength: distance < 7 ? "clear" : distance < 16 ? "unstable" : "faint" };
}

export function scoreRun(state: GameState): { total: number; survival: number; energy: number; information: number; stealth: number; navigation: number } {
  const survival = state.result === "survived" ? 420 : state.truth.collected.filter(Boolean).length * 70;
  const energy = Math.round((state.energy / state.maxEnergy) * 160);
  const infoRatio = state.metrics.informationGain / Math.max(1, state.metrics.signatureGenerated);
  const information = Math.min(180, Math.round(infoRatio * 260));
  const stealth = Math.max(0, 160 - Math.round(state.metrics.signatureGenerated * 0.7));
  const navigation = Math.max(0, 80 - Math.max(0, state.metrics.moves - 90));
  return { total: survival + energy + information + stealth + navigation, survival, energy, information, stealth, navigation };
}

export function qualitativeHunterMode(mode: HunterMode): number {
  return { quiet: 0, disturbance: 1, searching: 2, hunting: 3, contact: 4 }[mode];
}

export function projectPlayState(state: GameState): PlayProjection {
  return {
    width: state.facility.width,
    height: state.facility.height,
    memory: state.belief.memory,
    particles: state.belief.particles,
    entropy: state.belief.entropy,
    ess: state.belief.ess,
    energy: state.energy,
    maxEnergy: state.maxEnergy,
    signature: state.signature,
    coresCollected: state.truth.collected.filter(Boolean).length,
    extractionRevealed: state.truth.extractionRevealed,
    hunterMode: state.hunterMode,
    lastInfoGain: state.lastInfoGain,
    lastAction: state.frames.at(-1)?.action ?? "wake",
    tick: state.tick,
    seed: state.seed,
    sensorCooldowns: state.sensorCooldowns,
  };
}

export function endRunForDebug(state: GameState): GameState {
  if (state.result !== "active") return state;
  const ended: GameState = {
    ...state,
    tick: state.tick + 1,
    energy: 0,
    result: "lost-energy",
    metrics: { ...state.metrics, endedAt: Date.now() },
  };
  return { ...ended, frames: [...ended.frames, frameFor(ended, "debug:end")] };
}
