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
          950: "#F5F7FB",
          900: "#FFFFFF",
          850: "#F8FAFC",
          800: "#F1F5F9",
          700: "#E2E8F0",
          600: "#CBD5E1",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F8FAFC",
          elevated: "#F1F5F9",
          border: "#E2E8F0",
          highlight: "#E8EEF6",
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
