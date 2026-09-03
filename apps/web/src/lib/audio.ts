let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return null;
  }
}

export function playTone(kind: "move" | "ping" | "sonar" | "beacon" | "warning" | "core" | "extract", muted: boolean): void {
  if (muted) return;
  const ctx = audioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const values = {
    move: [96, 0.025, "sine"], ping: [540, 0.11, "sine"], sonar: [220, 0.7, "sine"], beacon: [760, 0.16, "triangle"],
    warning: [74, 0.28, "sawtooth"], core: [880, 0.42, "triangle"], extract: [330, 0.9, "sine"],
  } as const;
  const [frequency, duration, type] = values[kind];
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (kind === "sonar") oscillator.frequency.exponentialRampToValueAtTime(48, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(kind === "warning" ? 0.04 : 0.075, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}
