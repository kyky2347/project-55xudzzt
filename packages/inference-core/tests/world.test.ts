import { describe, expect, it } from "vitest";
import { distancesFrom, generateFacility, indexOf, isFloor } from "../src";

describe("deterministic facility generation", () => {
  it("recreates a seed exactly and diverges across seeds", () => {
    const first = generateFacility("ECHO-482951");
    const again = generateFacility("ECHO-482951");
    const other = generateFacility("ECHO-482952");
    expect(again).toEqual(first);
    expect(other.cells).not.toEqual(first.cells);
  });

  it.each(["WORLD-A", "WORLD-B", "WORLD-C", "WORLD-D"])("keeps every objective reachable for %s", (seed) => {
    const world = generateFacility(seed);
    const reachable = distancesFrom(world, world.start);
    const objectives = [...world.cores, world.extraction, world.hunterStart, ...world.beacons, ...world.recharge];
    expect(objectives.every((position) => isFloor(world, position))).toBe(true);
    expect(objectives.every((position) => reachable.has(indexOf(world, position)))).toBe(true);
    expect(reachable.size).toBeGreaterThan(world.width * world.height * 0.2);
  });
});
