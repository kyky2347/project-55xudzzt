import type { GameState } from "@echo/inference-core";
import { scoreRun } from "@echo/inference-core";

export type StoredRun = {
  id: string;
  seed: string;
  result: GameState["result"];
  difficulty: GameState["difficulty"];
  savedAt: number;
  score: number;
  duration: number;
  informationEfficiency: number;
  state: GameState;
};

const KEY = "echo-runs-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPosition(value: unknown) {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

function isStoredRun(value: unknown): value is StoredRun {
  if (!isRecord(value) || !isRecord(value.state)) return false;
  const state = value.state;
  const facility = state.facility;
  const frames = state.frames;
  const metrics = state.metrics;
  const belief = state.belief;
  return typeof value.id === "string"
    && typeof value.seed === "string"
    && isFiniteNumber(value.savedAt)
    && isFiniteNumber(value.score)
    && isFiniteNumber(value.duration)
    && isFiniteNumber(value.informationEfficiency)
    && typeof state.seed === "string"
    && isRecord(facility)
    && isFiniteNumber(facility.width)
    && isFiniteNumber(facility.height)
    && Array.isArray(facility.cells)
    && Array.isArray(facility.cores)
    && isRecord(metrics)
    && Array.isArray(metrics.entropySamples)
    && isRecord(belief)
    && isFiniteNumber(belief.entropy)
    && Array.isArray(frames)
    && frames.length > 0
    && frames.every((frame) => isRecord(frame)
      && typeof frame.action === "string"
      && isFiniteNumber(frame.entropy)
      && isFiniteNumber(frame.signature)
      && isPosition(frame.player)
      && isPosition(frame.hunter)
      && Array.isArray(frame.particles)
      && Array.isArray(frame.hunterBelief));
}

export function loadRuns(): StoredRun[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isStoredRun) : [];
  } catch {
    return [];
  }
}

export function saveRun(state: GameState): StoredRun {
  const run: StoredRun = {
    id: state.id,
    seed: state.seed,
    result: state.result,
    difficulty: state.difficulty,
    savedAt: Date.now(),
    score: scoreRun(state).total,
    duration: Math.max(0, Math.round(((state.metrics.endedAt ?? Date.now()) - state.metrics.startedAt) / 1000)),
    informationEfficiency: state.metrics.informationGain / Math.max(1, state.metrics.signatureGenerated),
    state,
  };
  try {
    const others = loadRuns().filter((item) => item.id !== run.id).slice(0, 11);
    window.localStorage.setItem(KEY, JSON.stringify([run, ...others]));
  } catch {
    // Storage can be disabled; the completed run still remains in session memory.
  }
  return run;
}

export function loadRun(id: string): StoredRun | undefined {
  return loadRuns().find((run) => run.id === id);
}
