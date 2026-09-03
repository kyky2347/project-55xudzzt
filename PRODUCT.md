# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Implemented as a pnpm monorepo with Next.js, React, TypeScript, PixiJS, Tailwind CSS, shadcn/ui foundations, Lucide, Framer Motion, Zustand, Zod, Recharts, Vitest, React Testing Library, and Playwright. The probability engine is a framework-independent TypeScript package with an optional WASM seam; no cloud service is required.

## Users

Primary users are players who enjoy deliberate exploration, survival tension, procedural runs, and systems they can learn rather than twitch combat. A secondary audience is technically curious players and portfolio reviewers who want to inspect the real probabilistic machinery in X-Ray and Lab modes.

## Product Purpose

ECHO: Blind Cartographer is a browser-based probabilistic exploration and survival game. A run succeeds when the player collects three Data Cores and reaches extraction without exhausting energy or making contact with the Hunter. The experience should make uncertainty tactile: the player navigates a belief about a hidden facility, not a conventional visible map.

## Positioning

Information is both the player's survival tool and the signal that teaches a Bayesian belief-driven Hunter where to search. Stronger sensing genuinely contracts the player's posterior while increasing the Hunter's evidence.

## Operating Context

Players can begin a seeded run, use keyboard or touch movement and four noisy sensors, complete a short interactive tutorial, review a debrief, inspect the run in an X-Ray replay, experiment step-by-step in a probability Lab, replay seeds, and review locally persisted history. The core must work locally and offline after dependencies are installed.

## Capabilities and Constraints

- Deterministic 48 × 48 procedural facilities, objective placement, movement noise, Hunter behavior, sensor observations, and replay inputs derive from the run seed.
- True state and belief state remain architecturally separate; normal Play never exposes exact hidden state.
- Player localization uses a real sequential Monte Carlo particle filter with normalized weights, entropy, effective sample size, and systematic resampling.
- The Hunter uses a grid-based Bayesian belief over player location and pathfinding through true geometry without perfect information.
- Active sensors expose the real energy / expected information / detection-signature tradeoff.
- PLAY, X-RAY, and LAB are complete modes; every major screen is bilingual in English and Simplified Chinese.
- Local persistence is the baseline. Authentication, Supabase, Sentry, deployment, Rust/WASM, and other cloud integrations are optional and may not block the game.
- Accessibility includes keyboard controls, visible focus, reduced motion, mute, high contrast, non-color status cues, and reduced particle effects.

## Brand Commitments

- Product name: ECHO
- Subtitle: BLIND CARTOGRAPHER
- Tagline: “Information keeps you alive. Information gives you away.”
- Voice: terse, atmospheric, precise, and technically honest.
- The experience is an independent science-fiction game crossed with a probability visualization and a dark research instrument. It must avoid generic dashboard, CRUD, homework, conventional visible grid-maze, and over-saturated neon-cyberpunk aesthetics.

## Evidence and Documentation

The repository keeps product requirements, design decisions, mathematical implementation notes, deterministic tests, browser journeys, and benchmark methodology alongside the code. Claims about behavior or performance must remain traceable to those inspectable artifacts; commercial claims, production telemetry, and unavailable integrations must never be fabricated.

## Product Principles

1. Every displayed probability, entropy, likelihood, information gain, and score component is computed from the implemented system.
2. Uncertainty is the playable medium, not explanatory decoration.
3. More information must create a legible, consequential cost.
4. The Hunter searches from evidence and uncertainty, never privileged omniscience.
5. Atmosphere supports comprehension; controls and state changes remain readable under pressure.

## Accessibility & Inclusion

All essential actions must be usable without pointer precision and understandable without color alone. Motion and particle density must respect user preferences. English and Simplified Chinese must be switchable without reloading or losing a run.
