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
          950: "#F7F2E7",
          900: "#FFFCF7",
          850: "#FAF5EB",
          800: "#F2E8D9",
          700: "#E6D7C4",
          600: "#D6C1A8",
        },
        surface: {
          DEFAULT: "#FFFCF7",
          muted: "#FAF5EB",
          elevated: "#F3E9DA",
          border: "#E3D4C2",
          highlight: "#EFE1CF",
        },
        blue: {
          50: "#F8F4E8", 100: "#EFE8CE", 200: "#DFD4A7", 300: "#CFC181",
          400: "#B6A541", 500: "#A39118", 600: "#927F10", 700: "#79690D",
          800: "#5E5015", 900: "#493B19",
        },
        cyan: {
          50: "#FBF2EF", 100: "#F4E1DB", 200: "#EAC8BC", 300: "#DDAE9F",
          400: "#CC927F", 500: "#B87A68", 600: "#9E6354", 700: "#7D4C40",
          800: "#613A32", 900: "#452923",
        },
        emerald: {
          50: "#F6F6EB", 100: "#EBEBD4", 200: "#D8DDB0", 300: "#BEC68A",
          400: "#9EA95D", 500: "#838F3F", 600: "#6E792F", 700: "#596224",
          800: "#464D20", 900: "#33391A",
        },
        rose: {
          50: "#FBF3F0", 100: "#F3E0D9", 200: "#E8C6BA", 300: "#D9AA9B",
          400: "#C68B7B", 500: "#AD6F60", 600: "#91584C", 700: "#74453C",
          800: "#5A352E", 900: "#40251F",
        },
        slate: {
          50: "#FBF8F1", 100: "#F3EBDD", 200: "#E7D8C5", 300: "#D2BCA4",
          400: "#A99078", 500: "#82705F", 600: "#69584A", 700: "#574438",
          800: "#493227", 900: "#38221A", 950: "#271811",
        },
        amber: {
          50: "#FAF7E9", 100: "#F0EACD", 200: "#E1D79D", 300: "#CEBF6E",
          400: "#B8A63E", 500: "#A18D1D", 600: "#887316", 700: "#6F5C17",
          800: "#58471A", 900: "#40331A",
        },
        orange: {
          50: "#FBF3EF", 100: "#F4E3DA", 200: "#EAC9B9", 300: "#DCA992",
          400: "#C78B71", 500: "#AA6D55", 600: "#8E5644", 700: "#714337",
          800: "#56332C", 900: "#3E2520",
        },
        purple: {
          50: "#F9F2F0", 100: "#F0E0DC", 200: "#E2C4BC", 300: "#CFA59B",
          400: "#B47F74", 500: "#97645A", 600: "#795047", 700: "#603F38",
          800: "#4A312C", 900: "#382420",
        },
        red: {
          50: "#FCF2EF", 100: "#F5DFD8", 200: "#E8C2B5", 300: "#D99E8F",
          400: "#C57D6E", 500: "#AB6457", 600: "#8D5147", 700: "#704038",
          800: "#56322D", 900: "#3F2521",
        },
        electric: {
          blue: "#A39118",
          light: "#B6A541",
          cyan: "#CC927F",
          teal: "#838F3F",
        },
        brand: {
          primary: "#A39118",
          secondary: "#D9AA9B",
          accent: "#543127",
          success: "#838F3F",
          warning: "#B18D25",
          danger: "#AD6F60",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(163, 145, 24, 0.22)",
        "glow-cyan": "0 0 25px -5px rgba(204, 146, 127, 0.2)",
        card: "0 12px 36px -10px rgba(79, 48, 35, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
