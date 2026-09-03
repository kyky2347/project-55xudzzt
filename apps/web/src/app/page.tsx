"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, FlaskConical, RadioTower } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRunSeed, dailySeed, type Difficulty } from "@echo/inference-core";
import { SonarField } from "@/components/sonar-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/stores/game-store";

export default function HomePage() {
  const { t } = useI18n();
  const router = useRouter();
  const start = useGameStore((state) => state.start);
  const [difficulty, setDifficulty] = useState<Difficulty>("signal");
  const launch = (seed: string) => {
    start(seed, difficulty);
    router.push("/play");
  };

  return (
    <main className="overflow-hidden pt-16">
      <section className="relative mx-auto min-h-[calc(100svh-4rem)] max-w-[1600px] px-5 md:px-8">
        <div className="absolute inset-y-0 right-[-18%] w-[92%] opacity-90 md:right-[-5%] md:w-[68%]"><SonarField dense /></div>
        <div className="relative z-10 flex min-h-[calc(100svh-4rem)] max-w-2xl flex-col justify-center py-20">
          <motion.h1 initial={{ opacity: 0.35, filter: "blur(12px)", clipPath: "inset(0 70% 0 0)" }} animate={{ opacity: 1, filter: "blur(0px)", clipPath: "inset(0 0 0 0)" }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="font-display text-[clamp(4.6rem,15vw,10rem)] font-medium leading-[0.75] tracking-[-0.035em] text-foreground">
            ECHO
          </motion.h1>
          <p className="mt-5 font-display text-[clamp(1rem,2.4vw,1.65rem)] uppercase tracking-[0.28em] text-primary/90">{t("subtitle")}</p>
          <div className="mt-10 font-display text-[clamp(1.3rem,3vw,2.3rem)] leading-tight tracking-[-0.025em]">
            <p>{t("taglineA")}</p>
            <p className="text-destructive">{t("taglineB")}</p>
          </div>
          <p className="mt-6 max-w-[58ch] text-sm leading-7 text-muted-foreground md:text-base">{t("homeLead")}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => launch(createRunSeed())}>{t("enter")}<ArrowRight data-icon="inline-end" /></Button>
            <Link href="/lab" className={buttonVariants({ size: "lg", variant: "secondary" })}><FlaskConical data-icon="inline-start" />{t("openLab")}</Link>
          </div>
          <div className="mt-10 flex max-w-xl flex-col gap-4 border-t border-border/70 pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="survey-label">{t("difficulty")}</p>
              <div className="mt-3 flex gap-1" role="group" aria-label={t("difficulty")}>
                {(["explorer", "signal", "dark"] as const).map((item) => (
                  <button key={item} type="button" aria-pressed={difficulty === item} onClick={() => setDifficulty(item)} className={cn("border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors", difficulty === item ? "border-primary/70 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>{t(item)}</button>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => launch(dailySeed())} className="group flex items-center gap-3 py-2 text-left">
              <RadioTower className="size-4 text-accent" />
              <span><span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-accent">{t("daily")}</span><span className="font-mono text-xs tabular-nums text-muted-foreground">{dailySeed()}</span></span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
        <ArrowDown className="absolute bottom-7 left-1/2 size-4 animate-breathe text-muted-foreground" />
      </section>

      <section className="mx-auto grid max-w-[1440px] border-y border-border/60 md:grid-cols-[1.15fr_.85fr]">
        <div className="min-h-[520px] border-b border-border/60 p-6 md:border-b-0 md:border-r md:p-12">
          <p className="max-w-[16ch] font-display text-4xl leading-tight tracking-[-0.03em] md:text-6xl">{t("beliefThesisA")}</p>
          <p className="mt-3 max-w-[16ch] font-display text-4xl leading-tight tracking-[-0.03em] text-primary/70 md:text-6xl">{t("beliefThesisB")}</p>
          <div className="mt-16 grid grid-cols-3 gap-px border-y border-border bg-border">
            {[['P(X)', 'PLAYER'], ['P(Y)', 'HUNTER'], ['H', 'BITS']].map(([value, label]) => <div key={label} className="bg-background py-5 text-center"><p className="font-display text-xl text-foreground">{value}</p><p className="mt-1 font-mono text-[9px] tracking-[.18em] text-muted-foreground">{label}</p></div>)}
          </div>
        </div>
        <div className="flex min-h-[520px] flex-col justify-between p-6 md:p-12">
          <div className="relative aspect-square max-h-[330px] w-full"><SonarField /></div>
          <div className="flex items-center justify-between border-t border-border pt-5">
            <p className="max-w-[31ch] text-sm leading-6 text-muted-foreground">{t("sensorProof")}</p>
            <Link href="/about" className="font-mono text-[10px] uppercase tracking-[.15em] text-primary hover:text-foreground">{t("about")} →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
