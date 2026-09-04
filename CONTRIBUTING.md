# Contributing to ECHO

Thank you for improving ECHO. Contributions should preserve the project’s central idea: the player navigates a computed belief, not hidden truth.

## Development setup

```bash
git clone https://github.com/kyky2347/echo-blind-cartographer.git
cd echo-blind-cartographer
pnpm install --frozen-lockfile
pnpm dev
```

The application runs at [http://localhost:3000](http://localhost:3000).

## Engineering invariants

- Normal Play components must never receive `TrueWorldState`; render only projections assembled from beliefs and allowed observations.
- All simulation randomness must come from the seeded run RNG or a deterministically forked stream.
- PixiJS renders simulation state but never owns it.
- Sensor labels, likelihoods, entropy, expected information gain, charts, and score terms must come from computed values.
- English and Simplified Chinese must remain feature-equivalent, including loading, error, empty, and accessibility copy.
- New benchmark claims must be produced by `pnpm benchmark` on the current revision and include the runtime environment.

## Before opening a pull request

Run the complete local gate:

```bash
pnpm check
pnpm test:e2e
```

For changes to probability or simulation code, also run:

```bash
pnpm benchmark
```

For user-interface changes, verify at minimum:

- Desktop and mobile layouts.
- English and Simplified Chinese.
- Keyboard focus and touch/pointer operation.
- Reduced motion, reduced particles, mute, and high contrast.
- Normal Play does not reveal true map, actor positions, objectives, or Hunter target.

## Pull request expectations

Keep pull requests focused and explain:

1. What changed and why.
2. Which invariants could be affected.
3. How the change was verified.
4. Any new benchmark result or screenshot, when relevant.

Avoid committing generated build output, local browser traces, dependency folders, or credentials. The repository `.gitignore` excludes the normal generated paths.

## Project documentation

- [Architecture](docs/architecture.md)
- [Game design](docs/game-design.md)
- [Particle filtering](docs/math/particle-filter.md)
- [Sensor models](docs/math/sensors.md)
- [Hunter inference](docs/math/hunter-inference.md)
- [Replay system](docs/replay-system.md)
- [Design system](DESIGN.md)
