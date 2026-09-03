import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { AppChrome } from "@/components/app-chrome";

export const metadata: Metadata = {
  title: { default: "ECHO — Blind Cartographer", template: "%s — ECHO" },
  description: "A probabilistic exploration game. Information keeps you alive. Information gives you away.",
};

export const viewport: Viewport = { colorScheme: "dark", themeColor: "#050809", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className="echo-noise">
        <template
          data-echo-direction-contract="b588b4c1"
          dangerouslySetInnerHTML={{ __html: "<!-- THESIS: the belief field is the interface. OWN-WORLD: seismic darkroom survey instrument. STORY: certainty preserves and exposes. FIRST VIEWPORT: title and half-submerged belief field. FORM: signal-analysis contact sheet, position 7, seed b588b4c1. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->" }}
        />
        <I18nProvider>
          <AppChrome>{children}</AppChrome>
        </I18nProvider>
      </body>
    </html>
  );
}
