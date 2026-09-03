"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Accessibility, AudioLines, Languages, Menu, VolumeX, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/stores/game-store";

const links = [
  ["/", "home"], ["/play", "play"], ["/lab", "lab"], ["/history", "history"], ["/about", "about"],
] as const;

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const muted = useGameStore((state) => state.muted);
  const reduceParticles = useGameStore((state) => state.reduceParticles);
  const highContrast = useGameStore((state) => state.highContrast);
  const setMuted = useGameStore((state) => state.setMuted);
  const setReduceParticles = useGameStore((state) => state.setReduceParticles);
  const setHighContrast = useGameStore((state) => state.setHighContrast);
  const immersive = pathname === "/play";

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div className={cn("min-h-screen", highContrast && "high-contrast")}>
      {!immersive && <a className="skip-link" href="#main-content">{t("skipContent")}</a>}
      {!immersive && (
        <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border/65 bg-background/92 px-4 backdrop-blur-md md:px-8">
          <Link href="/" className="font-display text-sm tracking-[0.4em] text-foreground">ECHO</Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label={t("primaryNavigation")}>
            {links.map(([href, key]) => (
              <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={cn("px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground", pathname === href && "text-primary")}>
                {t(key)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLocale(locale === "en" ? "zh" : "en")} aria-label={locale === "en" ? "切换到中文" : "Switch to English"}>
              <Languages data-icon="inline-start" /> {t("language")}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="md:hidden" aria-label={open ? t("closeNavigation") : t("openNavigation")} aria-expanded={open} aria-controls="mobile-navigation">
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </header>
      )}
      {open && !immersive && (
        <aside id="mobile-navigation" className="fixed inset-x-3 top-20 z-50 instrument-panel p-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label={t("mobileNavigation")}>
            {links.map(([href, key]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)} className={cn("border-b border-border/50 px-2 py-3 font-mono text-xs uppercase tracking-[0.14em]", pathname === href && "text-primary")}>{t(key)}</Link>)}
          </nav>
          <div className="mt-5 flex flex-col gap-3">
            <SettingRow icon={muted ? VolumeX : AudioLines} label={t("mute")} checked={muted} onCheckedChange={setMuted} />
            <SettingRow icon={Accessibility} label={t("reduceParticles")} checked={reduceParticles} onCheckedChange={setReduceParticles} />
            <SettingRow icon={Accessibility} label={t("highContrast")} checked={highContrast} onCheckedChange={setHighContrast} />
          </div>
        </aside>
      )}
      <div id="main-content" tabIndex={-1}>{children}</div>
      {!immersive && (
        <footer className="mx-auto flex max-w-[1440px] flex-col gap-4 border-t border-border/60 px-5 py-8 text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em]">ECHO / {t("footerTagline")}</p>
          <div className="flex items-center gap-4">
            <button type="button" aria-pressed={muted} onClick={() => setMuted(!muted)} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] hover:text-foreground">{muted ? <VolumeX className="size-3" /> : <AudioLines className="size-3" />}{muted ? t("unmute") : t("mute")}</button>
            <button type="button" aria-pressed={highContrast} onClick={() => setHighContrast(!highContrast)} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] hover:text-foreground"><Accessibility className="size-3" />{t("highContrast")}</button>
          </div>
        </footer>
      )}
    </div>
  );
}

function SettingRow({ icon: Icon, label, checked, onCheckedChange }: { icon: typeof AudioLines; label: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
      <span className="flex items-center gap-2"><Icon className="size-3" />{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
