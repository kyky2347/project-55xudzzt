import { describe, expect, it } from "vitest";
import { createGame, movePlayer, useSensor } from "../src";

describe("simulation invariants", () => {
  it("is deterministic for equal action sequences", () => {
    const play = () => {
      let state = createGame("ECHO-DETERMINISTIC", "signal");
      state = movePlayer(state, "north");
      state = useSensor(state, "ping");
      state = movePlayer(state, "east");
      state = useSensor(state, "sonar");
      return state;
    };
    const a = play();
    const b = play();
    expect(a.facility).toEqual(b.facility);
    expect(a.truth).toEqual(b.truth);
    expect(a.belief.entropy).toEqual(b.belief.entropy);
    expect(a.hunterBelief).toEqual(b.hunterBelief);
  });

  it("enforces cooldowns and finite non-negative energy", () => {
    let state = createGame("ECHO-ENERGY", "explorer");
    state = useSensor(state, "sonar");
    const once = state.energy;
    state = useSensor(state, "sonar");
    expect(state.energy).toBe(once);
    for (let index = 0; index < 500; index += 1) state = movePlayer(state, "east");
    expect(Number.isFinite(state.energy)).toBe(true);
    expect(state.energy).toBeGreaterThanOrEqual(0);
  });

  it("collects a reached core exactly once", () => {
    let state = createGame("ECHO-CORES", "explorer");
    expect(state.truth.collected).toEqual([false, false, false]);
    expect(new Set(state.facility.cores.map((core) => `${core.x},${core.y}`)).size).toBe(3);
    state = { ...state, truth: { ...state.truth, player: { ...state.facility.cores[0]! } } };
    state = useSensor(state, "passive");
    expect(state.truth.collected).toEqual([true, false, false]);
    state = useSensor(state, "passive");
    expect(state.truth.collected.filter(Boolean)).toHaveLength(1);
  });

  it("moves the Hunter at most one traversable step per turn", () => {
    const state = createGame("ECHO-HUNTER-STEP", "dark");
    const next = useSensor(state, "sonar");
    const distance = Math.abs(next.truth.hunter.x - state.truth.hunter.x) + Math.abs(next.truth.hunter.y - state.truth.hunter.y);
    expect(distance).toBeLessThanOrEqual(1);
    expect(next.facility.cells[next.truth.hunter.y * next.facility.width + next.truth.hunter.x]).toBe(1);
  });
});
