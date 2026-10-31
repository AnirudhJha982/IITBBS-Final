import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          950: "#060913",
          900: "#0A0F1D",
          850: "#0D1527",
          800: "#111C35",
          700: "#1A294C",
          600: "#243763",
        },
        surface: {
          DEFAULT: "#0F172A",
          muted: "#131C31",
          elevated: "#18233C",
          border: "#1E293B",
          highlight: "#263554",
        },
        electric: {
          blue: "#2563EB",
          light: "#3B82F6",
          cyan: "#06B6D4",
          teal: "#14B8A6",
        },
        brand: {
          primary: "#3B82F6",
          secondary: "#06B6D4",
          accent: "#8B5CF6",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(59, 130, 246, 0.25)",
        "glow-cyan": "0 0 25px -5px rgba(6, 182, 212, 0.25)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
