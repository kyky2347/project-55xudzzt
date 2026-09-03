# Replay system

Every logical action appends a `ReplayFrame` with tick, action, true player and Hunter positions, player belief mean, a bounded sample of particles, the most recent normalized sensor-likelihood field when applicable, Hunter belief grid, both entropies, energy, signature, information gain, Hunter state, and collected-core count.

X-Ray is analysis, not a second simulation. Its timeline reads these immutable frames, so pause, scrubbing, and speed changes cannot alter run truth. The canvas overlays true geometry, true markers, sampled player particles, a blue observation-likelihood field, an amber Hunter posterior, objective markers, and both completed paths. Synchronized Recharts plots show player/Hunter entropy, energy, signature, scan-event markers, and information-versus-emission scan efficiency.

Completed runs persist in a bounded localStorage archive. Corrupted JSON or structurally invalid entries are ignored. Particle clouds are downsampled to approximately 280 samples per frame so replay remains useful without storing every runtime particle.
