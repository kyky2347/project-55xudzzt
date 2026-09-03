import type { Difficulty, InferenceSettings, SensorKind } from "./types";

export const DIFFICULTY: Record<Difficulty, InferenceSettings & { energy: number }> = {
  explorer: {
    particles: 900,
    motionCorrect: 0.9,
    motionStay: 0.04,
    distanceSigma: 1.4,
    rssiSigma: 2.4,
    resampleThreshold: 0.55,
    hunterSensitivity: 0.72,
    energy: 120,
  },
  signal: {
    particles: 1200,
    motionCorrect: 0.82,
    motionStay: 0.08,
    distanceSigma: 2.1,
    rssiSigma: 3.7,
    resampleThreshold: 0.48,
    hunterSensitivity: 1,
    energy: 100,
  },
  dark: {
    particles: 1500,
    motionCorrect: 0.72,
    motionStay: 0.12,
    distanceSigma: 3.1,
    rssiSigma: 5.2,
    resampleThreshold: 0.42,
    hunterSensitivity: 1.3,
    energy: 86,
  },
};

export const SENSOR_CONFIG: Record<SensorKind, { energy: number; signature: number; sigma: number; cooldown: number }> = {
  passive: { energy: 0, signature: 0.4, sigma: 4.8, cooldown: 0 },
  ping: { energy: 3, signature: 9, sigma: 2.4, cooldown: 1 },
  sonar: { energy: 12, signature: 42, sigma: 0.72, cooldown: 3 },
  beacon: { energy: 5, signature: 15, sigma: 3.6, cooldown: 2 },
};
