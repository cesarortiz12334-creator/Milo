import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F97316", // naranja — acción principal
          soft: "#FED7AA",
        },
        success: {
          DEFAULT: "#16A34A", // verde — estados exitosos
          soft: "#DCFCE7",
        },
        "warm-white": "#FFFBF5", // fondo
        dark: "#1C1917",
        muted: "#78716C",
      },
      fontFamily: {
        heading: ["var(--font-nunito)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
