import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // EarnQuest Brand Colors
        "quest-purple": {
          DEFAULT: "#6C5CE7",
          light: "#A29BFE",
          dark: "#5849C2",
        },
        "star-gold": {
          DEFAULT: "#FDCB6E",
          light: "#FFEAA7",
          dark: "#F8B500",
        },
        "growth-green": {
          DEFAULT: "#00B894",
          light: "#55EFC4",
          dark: "#00A381",
        },
        "sky-blue": "#74B9FF",
        "coral-pink": "#FF7675",
        mint: "#55EFC4",
        light: "#F5F6FA",
        dark: "#2D3436",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "24px",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0, 0, 0, 0.06)",
        md: "0 4px 14px rgba(0, 0, 0, 0.1)",
        lg: "0 8px 24px rgba(0, 0, 0, 0.12)",
        purple: "0 4px 14px rgba(108, 92, 231, 0.3)",
        gold: "0 4px 14px rgba(253, 203, 110, 0.4)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
