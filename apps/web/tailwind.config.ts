import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        instrument: "0 16px 42px rgba(0, 0, 0, 0.38)",
      },
      animation: {
        sweep: "sweep 5s cubic-bezier(.16,1,.3,1) infinite",
        breathe: "breathe 3.8s ease-in-out infinite",
      },
      keyframes: {
        sweep: { "0%": { transform: "scale(.12)", opacity: "0.85" }, "100%": { transform: "scale(1)", opacity: "0" } },
        breathe: { "0%, 100%": { opacity: "0.42" }, "50%": { opacity: "0.9" } },
      },
    },
  },
  plugins: [],
};

export default config;
