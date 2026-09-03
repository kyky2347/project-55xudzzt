# Game design

The decision loop is deliberately slow enough to think: move, receive weak passive evidence, inspect uncertainty, decide whether a stronger scan is worth its energy and signal, then observe the Hunter response.

Moving costs 0.45 energy and produces a small sound signature. Passive listening is free and almost quiet but noisy and prone to dropout. Short ping is a modest correction. Sonar provides accurate four-direction range evidence, creates the most visible contraction, and emits a high signature. Beacon triangulation follows a log-distance RSSI model and sits between ping and sonar.

The three difficulties alter true movement reliability, sensor noise, energy, and Hunter sensitivity. Particle count changes between defaults for resolution but is not the definition of difficulty.

Three Data Cores are always reachable. Their exact locations stay hidden; the HUD emits a deterministically noisy qualitative bearing and strength. Extraction becomes the tracked target only after all three cores are collected. Contact and energy depletion end a run. Signature decays when the player avoids strong scans, giving mistakes a recovery window.

The score is additive and visible: survival/progress, remaining-energy efficiency, information per emitted signature, stealth, and a bounded navigation term. The formula avoids rewarding zero-information idling because meaningful survival/progress dominates and the information term is capped.
