"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { loadRuns, type StoredRun } from "@/lib/storage";
import { cn, formatTime } from "@/lib/utils";

export default function HistoryPage() {
  const { locale, t } = useI18n();
  const [runs, setRuns] = useState<StoredRun[] | null>(null);
  useEffect(() => setRuns(loadRuns()), []);
  return (
    <main className="mx-auto min-h-screen max-w-[1200px] px-4 pb-20 pt-28 md:px-8">
      <h1 className="font-display text-5xl tracking-[-.035em] md:text-7xl">{t("historyTitle")}</h1>
      <p className="mt-5 max-w-[65ch] text-sm leading-7 text-muted-foreground">{t("historyLead")}</p>
      <section className="mt-12 border-t border-border">
        {runs === null ? (
          <div className="grid min-h-72 place-items-center border-b border-border" role="status"><p className="survey-label animate-pulse">{t("loading")}</p></div>
        ) : runs.length === 0 ? (
          <div className="grid min-h-72 place-items-center border-b border-border"><div className="text-center"><p className="survey-label">{t("emptyHistory")}</p><Link href="/" className={cn(buttonVariants(), "mt-6")}>{t("enter")}</Link></div></div>
        ) : runs.map((run) => (
          <article key={run.id} className="grid gap-5 border-b border-border py-6 sm:grid-cols-[1.2fr_.8fr_.6fr_.6fr_auto] sm:items-center">
            <div><p className="font-display text-lg tracking-[.04em]">{run.seed}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">{new Date(run.savedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}</p></div>
            <Metric label={t("result")} value={run.result === "survived" ? t("survived") : t("lost")} />
            <Metric label={t("score")} value={String(run.score)} />
            <Metric label={t("time")} value={formatTime(run.duration)} />
            <Link href={`/replay/${encodeURIComponent(run.id)}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>{t("replay")}<ArrowUpRight data-icon="inline-end" /></Link>
          </article>
        ))}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div><p className="survey-label">{label}</p><p className="mt-2 font-mono text-xs tabular-nums">{value}</p></div>; }
