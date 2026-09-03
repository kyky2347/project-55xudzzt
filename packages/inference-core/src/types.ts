export type Position = { x: number; y: number };
export type Direction = "north" | "east" | "south" | "west";
export type SensorKind = "passive" | "ping" | "sonar" | "beacon";
export type Difficulty = "explorer" | "signal" | "dark";
export type HunterMode = "quiet" | "disturbance" | "searching" | "hunting" | "contact";
export type RunResult = "active" | "survived" | "lost-contact" | "lost-energy";

export type Facility = {
  width: number;
  height: number;
  cells: number[];
  start: Position;
  hunterStart: Position;
  cores: Position[];
  extraction: Position;
  beacons: Position[];
  recharge: Position[];
};

export type Particle = Position & { weight: number };

export type RangeObservation = {
  kind: "ranges";
  sensor: "passive" | "ping" | "sonar";
  ranges: number[];
  sigma: number;
  dropout: boolean[];
};

export type BeaconObservation = {
  kind: "beacon";
  sensor: "beacon";
  rssi: number;
  sigma: number;
  beacon: Position;
};

export type Observation = RangeObservation | BeaconObservation;

export type BeliefState = {
  particles: Particle[];
  entropy: number;
  ess: number;
  memory: number[];
  lastLikelihood?: number[];
};

export type TrueWorldState = {
  player: Position;
  hunter: Position;
  collected: boolean[];
  extractionRevealed: boolean;
};

export type ReplayFrame = {
  tick: number;
  action: string;
  player: Position;
  hunter: Position;
  beliefMean: Position;
  particles: Particle[];
  likelihood?: number[];
  hunterBelief: number[];
  entropy: number;
  hunterEntropy: number;
  energy: number;
  signature: number;
  informationGain: number;
  hunterMode: HunterMode;
  cores: number;
};

export type RunMetrics = {
  moves: number;
  scans: number;
  energyUsed: number;
  informationGain: number;
  signatureGenerated: number;
  contactEvents: number;
  entropySamples: number[];
  startedAt: number;
  endedAt?: number;
};

export type GameState = {
  id: string;
  seed: string;
  difficulty: Difficulty;
  tick: number;
  rngState: number;
  facility: Facility;
  truth: TrueWorldState;
  belief: BeliefState;
  hunterBelief: number[];
  hunterMode: HunterMode;
  hunterTarget: Position;
  energy: number;
  maxEnergy: number;
  signature: number;
  sensorCooldowns: Record<SensorKind, number>;
  lastObservation?: Observation;
  lastInfoGain: number;
  result: RunResult;
  frames: ReplayFrame[];
  metrics: RunMetrics;
};

export type PlayProjection = {
  width: number;
  height: number;
  memory: number[];
  particles: Particle[];
  entropy: number;
  ess: number;
  energy: number;
  maxEnergy: number;
  signature: number;
  coresCollected: number;
  extractionRevealed: boolean;
  hunterMode: HunterMode;
  lastInfoGain: number;
  lastAction: string;
  tick: number;
  seed: string;
  sensorCooldowns: Record<SensorKind, number>;
};

export type InferenceSettings = {
  particles: number;
  motionCorrect: number;
  motionStay: number;
  distanceSigma: number;
  rssiSigma: number;
  resampleThreshold: number;
  hunterSensitivity: number;
};

export interface InferenceEngine {
  predict(particles: Particle[], action: Direction, world: Facility, rng: import("./rng").SeededRng, settings: InferenceSettings): Particle[];
  observe(particles: Particle[], observation: Observation, world: Facility): Particle[];
  resample(particles: Particle[], rng: import("./rng").SeededRng): Particle[];
}
