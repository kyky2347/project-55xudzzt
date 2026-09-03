"use client";

import { ArrowRight, Atom, Binary, RadioTower, Route } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const { t, locale } = useI18n();
  const sections = [
    { icon: Atom, title: t("playerFilter"), formula: "p(xₜ | z₁:ₜ, u₁:ₜ)", body: locale === "zh" ? "顺序蒙特卡洛粒子经过预测、似然加权、归一化与系统重采样。离散位置分布直接计算香农熵。" : "Sequential Monte Carlo particles pass through prediction, likelihood weighting, normalization, and systematic resampling. Shannon entropy is computed from the resulting discrete position mass." },
    { icon: Route, title: t("hunterModel"), formula: "p(player | emissions)", body: locale === "zh" ? "Hunter 维护自己的网格后验。移动声让信念扩散；强信号在玩家附近形成似然峰，然后 A* 只在真实可通行结构中执行搜索路径。" : "The Hunter maintains a separate grid posterior. Movement diffuses it; strong emissions create a likelihood peak near the player, then A* executes the search through true traversable geometry." },
    { icon: RadioTower, title: t("sensorModels"), formula: "RSSI ≈ P₀ − 10n log₁₀(d) + ε", body: locale === "zh" ? "被动聆听、短脉冲、主动声呐和信标三角定位有不同的噪声、丢包、能耗与信号代价。信息增益由模拟后验熵估算。" : "Passive listening, short ping, active sonar, and beacon triangulation use different noise, dropout, energy, and signature costs. Information gain is estimated from simulated posterior entropy." },
    { icon: Binary, title: t("determinism"), formula: "seed → world + noise + replay", body: locale === "zh" ? "设施、目标、传感器噪声和 Hunter 行为都来自带标签的确定性随机流。同一设置和操作序列会重建同一轨迹。" : "Facility, objectives, sensor noise, and Hunter behavior derive from labeled deterministic random streams. Equal settings and actions reconstruct the same trajectory." },
  ];
  return (
    <main className="mx-auto min-h-screen max-w-[1320px] px-4 pb-20 pt-28 md:px-8">
      <section className="grid gap-10 border-b border-border/70 pb-14 lg:grid-cols-[1fr_.8fr] lg:items-end">
        <h1 className="max-w-[12ch] font-display text-5xl leading-[1.04] tracking-[-.04em] md:text-8xl">{t("aboutTitle")}</h1>
        <div><p className="max-w-[65ch] text-sm leading-7 text-muted-foreground md:text-base">{t("aboutLead")}</p><Link href="/lab" className={cn(buttonVariants(), "mt-7")}>{t("openLab")}<ArrowRight data-icon="inline-end" /></Link></div>
      </section>
      <section className="divide-y divide-border/70">
        {sections.map(({ icon: Icon, title, formula, body }) => (
          <article key={title} className="grid gap-5 py-9 md:grid-cols-[60px_240px_1fr] md:items-start">
            <Icon className="size-5 text-primary" />
            <div><h2 className="font-display text-lg uppercase tracking-[.08em]">{title}</h2><p className="mt-2 font-mono text-xs text-primary/80">{formula}</p></div>
            <p className="max-w-[70ch] text-sm leading-7 text-muted-foreground">{body}</p>
          </article>
        ))}
      </section>
      <section className="mt-8 grid gap-6 border-y border-border/70 py-10 md:grid-cols-3">
        <Fact value="48 × 48" label={t("facilityFact")} /><Fact value="4" label={t("sensorsFact")} /><Fact value="P ↔ P" label={t("beliefsFact")} />
      </section>
    </main>
  );
}

function Fact({ value, label }: { value: string; label: string }) { return <div><p className="font-display text-4xl text-primary">{value}</p><p className="mt-2 survey-label">{label}</p></div>; }
