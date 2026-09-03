# Architecture

ECHO is a pnpm monorepo with a pure TypeScript probability/simulation package and a Next.js presentation application.

## State boundaries

`GameState` owns deterministic simulation data. Its `truth` member contains the actual player, Hunter, objective, and facility states. `belief` contains the player particle approximation and reconstructed memory. `hunterBelief` is a separate grid posterior. The Play renderer receives `PlayProjection`, which intentionally contains no true positions or true facility cells. Debug and X-Ray explicitly opt into truth.

PixiJS draws probability fields and reconstructed/true geometry. It never mutates simulation data. HTML/CSS owns the HUD and accessible controls. Zustand coordinates user actions and the current in-memory run. Completed runs are validated structurally on load and persisted locally with bounded history.

## Deterministic update

Each user action advances a fixed logical tick:

1. Rehydrate the serializable PRNG state.
2. Apply true noisy movement or take a sensor measurement.
3. Predict/update the player's particle belief.
4. Calculate entropy and actual information gain.
5. Diffuse and update the Hunter belief from the emitted signature.
6. Choose or retain the Hunter posterior target and move one valid path step.
7. Decay/carry signature, update objectives, energy, cooldowns, and terminal state.
8. Persist the new PRNG state and append a downsampled replay frame.

Rendering interpolates visual effects independently; it cannot change the outcome.

## Failure boundaries

Pixi initializes dynamically on the client. If WebGL cannot initialize, Pixi can fall back to Canvas where supported; the HTML HUD remains available. Web Audio failures are ignored without breaking input. localStorage parse and quota failures return an empty archive or keep the completed run in memory. The optional WASM engine reports unavailable and the TypeScript engine remains authoritative.
