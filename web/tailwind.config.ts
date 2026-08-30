import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "bg-base": "var(--bg-base)",
        "surface-glass": "var(--surface-glass)",
        "surface-glass-border": "var(--surface-glass-border)",
        brand: {
          start: "#4DA2FF",
          mid: "#7B61FF",
          end: "#2DD4BF",
        },
        ai: {
          DEFAULT: "#8B5CF6",
          dark: "#7C3AED",
          light: "#A78BFA",
          bg: "rgba(139, 92, 246, 0.08)",
          border: "rgba(139, 92, 246, 0.25)",
        },
        trust: {
          DEFAULT: "#2DD4BF",
          emerald: "#10B981",
          bg: "rgba(45, 212, 191, 0.08)",
          border: "rgba(45, 212, 191, 0.25)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          bg: "rgba(245, 158, 11, 0.08)",
          border: "rgba(245, 158, 11, 0.25)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-glow": "0 0 25px -5px rgba(123, 97, 255, 0.25)",
        "ai-glow": "0 0 20px -3px rgba(139, 92, 246, 0.35)",
        "trust-glow": "0 0 20px -3px rgba(45, 212, 191, 0.35)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
