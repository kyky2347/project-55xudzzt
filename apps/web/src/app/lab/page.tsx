"use client";

import { RotateCcw, Sigma } from "lucide-react";
import { useMemo, useState } from "react";
import {
  SeededRng,
  TypeScriptInferenceEngine,
  effectiveSampleSize,
  generateFacility,
  initializeParticles,
  measureSensor,
  normalize,
  observationLikelihood,
  particleEntropy,
  type Observation,
  type Particle,
} from "@echo/inference-core";
import { LabField } from "@/components/lab-field";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Phase = "prior" | "predict" | "observe" | "normalize" | "resample";

const world = generateFacility("ECHO-LAB", 32);
const truth = world.start;

export default function LabPage() {
  const { t, locale } = useI18n();
  const [particleCount, setParticleCount] = useState(1500);
  const [motionNoise, setMotionNoise] = useState(0.18);
  const [sensorSigma, setSensorSigma] = useState(1.8);
  const [rssiSigma, setRssiSigma] = useState(3.6);
  const [scanStrength, setScanStrength] = useState(1);
  const [priorRadius, setPriorRadius] = useState(16);
  const [falsePositiveRate, setFalsePositiveRate] = useState(0.02);
  const [threshold, setThreshold] = useState(0.5);
  const [sensitivity, setSensitivity] = useState(1);
  const [phase, setPhase] = useState<Phase>("prior");
  const [sequence, setSequence] = useState(0);
  const [particles, setParticles] = useState<Particle[]>(() => initializeParticles(world, 1500, new SeededRng("LAB:initial"), { center: truth, radius: 16 }));
  const [observation, setObservation] = useState<Observation>();
  const [likelihood, setLikelihood] = useState<number[]>();
  const [showMath, setShowMath] = useState(false);

  const reset = (count = particleCount, radius = priorRadius) => {
    setParticles(initializeParticles(world, count, new SeededRng(`LAB:reset:${sequence + 1}`), { center: truth, radius }));
    setSequence((value) => value + 1);
    setPhase("prior");
    setObservation(undefined);
    setLikelihood(undefined);
  };

  const predict = () => {
    const rng = new SeededRng(`LAB:predict:${sequence}`);
    const engine = new TypeScriptInferenceEngine();
    setParticles(engine.predict(particles, "east", world, rng, {
      particles: particleCount, motionCorrect: 1 - motionNoise, motionStay: motionNoise * 0.45, distanceSigma: sensorSigma, rssiSigma, resampleThreshold: threshold, hunterSensitivity: sensitivity,
    }));
    setPhase("predict");
    setSequence((value) => value + 1);
  };

  const observe = () => {
    const rng = new SeededRng(`LAB:observe:${sequence}`);
    const measured = measureSensor(world, truth, "sonar", rng, sensorSigma / (0.72 * scanStrength), falsePositiveRate);
    const raw = particles.map((particle) => particle.weight * observationLikelihood(world, particle, measured));
    const maxRaw = Math.max(...raw, 1e-20);
    setParticles(particles.map((particle, index) => ({ ...particle, weight: (raw[index] as number) / maxRaw })));
    const gridRaw = world.cells.map((cell, index) => {
      if (cell !== 1) return 0;
      return observationLikelihood(world, { x: index % world.width, y: Math.floor(index / world.width) }, measured);
    });
    const max = Math.max(...gridRaw, 1e-20);
    setLikelihood(gridRaw.map((value) => value / max));
    setObservation(measured);
    setPhase("observe");
    setSequence((value) => value + 1);
  };

  const normalizeWeights = () => {
    const weights = normalize(particles.map((particle) => particle.weight));
    setParticles(particles.map((particle, index) => ({ ...particle, weight: weights[index] as number })));
    setPhase("normalize");
  };

  const resample = () => {
    const normalized = normalize(particles.map((particle) => particle.weight));
    const source = particles.map((particle, index) => ({ ...particle, weight: normalized[index] as number }));
    setParticles(new TypeScriptInferenceEngine().resample(source, new SeededRng(`LAB:resample:${sequence}`)));
    setPhase("resample");
    setSequence((value) => value + 1);
  };

  const normalizedParticles = useMemo(() => {
    const weights = normalize(particles.map((particle) => particle.weight));
    return particles.map((particle, index) => ({ ...particle, weight: weights[index] as number }));
  }, [particles]);
  const entropy = particleEntropy(normalizedParticles, world.width, world.height);
  const ess = effectiveSampleSize(normalizedParticles);
  const posteriorPeak = Math.max(...normalizedParticles.map((particle) => particle.weight));

  return (
    <main className="mx-auto min-h-screen max-w-[1540px] px-4 pb-16 pt-28 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <h1 className="max-w-[14ch] font-display text-4xl leading-tight tracking-[-.035em] md:text-6xl">{t("labTitle")}</h1>
          <p className="mt-5 max-w-[65ch] text-sm leading-7 text-muted-foreground">{t("labLead")}</p>

          <div className="mt-8 instrument-panel overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><span className="size-2 rotate-45 bg-primary" /><p className="survey-label">{t("phase")} / {phase}</p></div>
              <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:gap-5"><Data label="H(X)" value={`${entropy.toFixed(3)} bit`} /><Data label={t("ess")} value={ess.toFixed(0)} /><Data label="max p(x)" value={posteriorPeak.toExponential(2)} /></div>
            </div>
            <div className="relative aspect-[16/9] min-h-[380px]"><LabField world={world} particles={normalizedParticles} truth={truth} likelihood={likelihood} /></div>
            <div className="relative z-10 grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-5">
              <PhaseButton active={phase === "predict"} onClick={predict} label={t("predict")} />
              <PhaseButton active={phase === "observe"} onClick={observe} label={t("observe")} />
              <PhaseButton active={phase === "normalize"} onClick={normalizeWeights} label={t("normalize")} disabled={!observation} />
              <PhaseButton active={phase === "resample"} onClick={resample} label={t("resample")} disabled={!observation} />
              <PhaseButton onClick={() => reset()} label={t("reset")} icon={<RotateCcw className="size-3" />} />
            </div>
          </div>

          <div className="mt-6 border-y border-border/70 py-5">
            <label className="flex items-center justify-between gap-5"><span className="flex items-center gap-2 survey-label"><Sigma className="size-3" />{t("math")}</span><Switch checked={showMath} onCheckedChange={setShowMath} /></label>
            {showMath && (
              <div className="mt-5 grid gap-5 font-mono text-sm sm:grid-cols-3">
                <Formula label={t("prior")} formula="P(xₜ | z₁:ₜ₋₁)" body={locale === "zh" ? "预测通过带噪移动模型扩散概率质量。" : "Prediction spreads mass through the noisy motion model."} />
                <Formula label={t("likelihood")} formula="P(zₜ | xₜ)" body={locale === "zh" ? `观测 σ = ${observation?.sigma.toFixed(2) ?? sensorSigma.toFixed(2)} 格` : `Observed σ = ${observation?.sigma.toFixed(2) ?? sensorSigma.toFixed(2)} cells`} />
                <Formula label={t("posterior")} formula="P(x | z) ∝ P(z | x)P(x)" body={locale === "zh" ? "归一化将加权证据转化为概率分布。" : "Normalization turns weighted evidence into a probability distribution."} />
              </div>
            )}
          </div>
        </section>

        <aside className="instrument-panel h-fit p-5 lg:sticky lg:top-24">
          <p className="font-display text-sm uppercase tracking-[.16em]">{t("parameters")}</p>
          <div className="mt-7 flex flex-col gap-7">
            <Control label={t("particles")} value={particleCount.toLocaleString()} min={500} max={5000} step={250} current={particleCount} onChange={(value) => { setParticleCount(value); reset(value); }} />
            <Control label={t("motionNoise")} value={`${Math.round(motionNoise * 100)}%`} min={0} max={0.45} step={0.01} current={motionNoise} onChange={setMotionNoise} />
            <Control label={t("sensorNoise")} value={`${sensorSigma.toFixed(1)} cells`} min={0.3} max={6} step={0.1} current={sensorSigma} onChange={setSensorSigma} />
            <Control label={t("rssiNoise")} value={`${rssiSigma.toFixed(1)} dB`} min={0.5} max={10} step={0.1} current={rssiSigma} onChange={setRssiSigma} />
            <Control label={t("scanStrength")} value={`${scanStrength.toFixed(1)}×`} min={0.5} max={2} step={0.1} current={scanStrength} onChange={setScanStrength} />
            <Control label={t("priorUncertainty")} value={`${priorRadius} cells`} min={4} max={24} step={1} current={priorRadius} onChange={(value) => { setPriorRadius(value); reset(particleCount, value); }} />
            <Control label={t("falsePositiveRate")} value={`${Math.round(falsePositiveRate * 100)}%`} min={0} max={0.2} step={0.01} current={falsePositiveRate} onChange={setFalsePositiveRate} />
            <Control label={t("threshold")} value={threshold.toFixed(2)} min={0.1} max={0.9} step={0.05} current={threshold} onChange={setThreshold} />
            <Control label={t("sensitivity")} value={`${sensitivity.toFixed(1)}×`} min={0.4} max={2} step={0.1} current={sensitivity} onChange={setSensitivity} />
          </div>
          <div className="mt-8 border-t border-border pt-5">
            <p className="survey-label">{t("currentObservation")}</p>
            <p className="mt-3 font-mono text-xs leading-6 text-foreground">{observation ? (observation.kind === "ranges" ? observation.ranges.map((range) => Number.isFinite(range) ? range.toFixed(1) : "—").join(" / ") : `${observation.rssi.toFixed(1)} dBm`) : t("noObservation")}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Data({ label, value }: { label: string; value: string }) { return <div className="text-right"><p className="survey-label">{label}</p><p className="mt-1 font-mono text-xs tabular-nums">{value}</p></div>; }
function PhaseButton({ label, onClick, active, disabled, icon }: { label: string; onClick: () => void; active?: boolean; disabled?: boolean; icon?: React.ReactNode }) { return <button onClick={onClick} disabled={disabled} className={cn("flex min-h-14 items-center justify-center gap-2 bg-background px-3 font-mono text-[10px] uppercase tracking-[.14em] transition-colors hover:bg-primary/5 hover:text-primary disabled:opacity-35", active && "bg-primary/10 text-primary")}>{icon}{label}</button>; }
function Control({ label, value, min, max, step, current, onChange }: { label: string; value: string; min: number; max: number; step: number; current: number; onChange: (value: number) => void }) { return <label className="block"><span className="flex items-center justify-between gap-4"><span className="survey-label">{label}</span><span className="font-mono text-[10px] tabular-nums text-foreground">{value}</span></span><Slider className="mt-4" min={min} max={max} step={step} value={[current]} onValueChange={(values) => onChange(values[0] as number)} /></label>; }
function Formula({ label, formula, body }: { label: string; formula: string; body: string }) { return <div><p className="survey-label">{label}</p><p className="mt-2 text-primary">{formula}</p><p className="mt-3 font-sans text-xs leading-5 text-muted-foreground">{body}</p></div>; }
