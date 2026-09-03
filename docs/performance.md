# Performance

Benchmarks were run with `pnpm benchmark` on 2026-09-03 using Apple M4, Darwin arm64, Node v24.18.0, 30 deterministic rounds.

| Operation | Mean | p95 |
| --- | ---: | ---: |
| 48 × 48 facility generation | 1.166 ms | 1.791 ms |
| 10,000-particle sonar likelihood update, normalization, ESS, and conditional resample | 3.097 ms | 4.007 ms |

The benchmark isolates the TypeScript inference package and uses `performance.now()`. It does not claim browser render FPS. Normal difficulties use 900–1,500 live particles and replay frames downsample to roughly 280 particles. PixiJS caps device pixel ratio at 2, reuses its WebGL application across simulation updates, and caps Play rendering at 30 FPS. The Home ambient canvas also caps at 30 FPS, stops outside the viewport or while the page is hidden, and renders a static field when reduced motion is requested. The `?debug=1` HUD separately reports live FPS, average render time, measured turn-update time, particle count, and approximate serialized simulation-state size on the current browser.

Because the measured 10,000-particle core update is well below a 16.7 ms frame on the tested machine and game actions are turn-based, the current implementation does not add Worker messaging overhead. `InferenceEngine`, `TypeScriptInferenceEngine`, and an honest unavailable `WasmInferenceEngine` preserve the performance seam. WASM is not loaded or claimed.
