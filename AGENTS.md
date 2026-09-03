# ECHO Engineering Guide

## Product invariants

- Never expose `TrueWorldState` to normal Play UI components. Rendering receives a projection assembled from belief state and observations.
- Every random draw used by world generation or simulation comes from the seeded run RNG or a deterministically forked stream.
- PixiJS is a renderer, never the simulation source of truth.
- Sensor labels, likelihood fields, entropy, EIG, replay charts, and score terms must reflect computed values.
- English and Simplified Chinese copy must remain feature-equivalent.

## Repository layout

- `apps/web`: Next.js game client and HTML/CSS HUD.
- `packages/inference-core`: deterministic RNG, world generation, inference, sensors, Hunter model, replay types, and tests.
- `docs`: architecture, design, probability, procedural generation, replay, and measured performance notes.

## Verification

Run `pnpm check` for lint, typecheck, unit tests, and production build. Run `pnpm test:e2e` for browser smoke coverage. Never add benchmark claims before running `pnpm benchmark` on the current code.
