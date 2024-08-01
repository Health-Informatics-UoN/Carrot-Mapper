import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  safelist: [
    "text-blue-500",
    "text-green-600",
    "text-red-900",
    "text-orange-300",
    "text-orange-400",
    "text-orange-500",
    "text-orange-600",
    "text-blue-800",
    "text-red-500",
    "text-red-900",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      colors: {
        carrot: {
          DEFAULT: "#475da7",
          secondary: {
            DEFAULT: "#3db28c",
            50: "#51c19e",
          },
          vocab: "#BEA9DF",
          reuse: "#3db28c",
          manual: "#3C579E",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#475da7",
          950: "#172554",
        }, // Chose Blue Color Palette (apart from 900 - the last approved color) for now - Will change the color palette to match the branding later
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
