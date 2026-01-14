import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Stitch Design System - Main Theme
        'primary': '#2bb800', // Bright green - WCAG AA compliant (4.5:1 contrast)
        'primary-kindness': '#0ea5e9', // Cyan for kindness features - WCAG AA compliant
        'background-light': '#f6f8f6',
        'background-dark': '#132210',
        'card-light': '#ffffff',
        'card-dark': '#1c3018',
        'text-main': '#121811',
        'text-muted': '#688961',

        // Semantic colors for shadcn/ui compatibility
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        display: ['Lexend', 'sans-serif'],
        body: ['Noto Sans', 'sans-serif'],
        kindness: ['Plus Jakarta Sans', 'sans-serif'], // For kindness features
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
        xl: '1.5rem',
        '2xl': '2rem',
        full: '9999px',
      },
      transitionDuration: {
        'fast': '200ms',
        'normal': '300ms',
        'slow': '500ms',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.12)',
        'card-active': '0 2px 10px -1px rgba(0, 0, 0, 0.05)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
