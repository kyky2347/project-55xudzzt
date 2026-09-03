import { beforeEach, describe, expect, it } from "vitest";
import { createGame } from "@echo/inference-core";
import { loadRun, loadRuns, saveRun } from "./storage";

describe("run storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips a complete deterministic run state", () => {
    const stored = saveRun(createGame("TEST-ROUNDTRIP", "signal"));

    expect(loadRun(stored.id)?.seed).toBe("TEST-ROUNDTRIP");
    expect(loadRuns()).toHaveLength(1);
  });

  it("ignores malformed or incomplete local data", () => {
    window.localStorage.setItem("echo-runs-v1", JSON.stringify([
      { id: "broken", state: { frames: "not-an-array" } },
      null,
      "corrupt",
    ]));

    expect(loadRuns()).toEqual([]);
    expect(loadRun("broken")).toBeUndefined();
  });

  it("recovers from invalid JSON", () => {
    window.localStorage.setItem("echo-runs-v1", "{not-json");

    expect(loadRuns()).toEqual([]);
  });
});
