/** @type {import('tailwindcss').Config} */
//
// Slate scale is exposed as CSS variables so a single `data-theme="light"`
// attribute on <html> swaps the entire palette at runtime — no per-component
// dark:/light: variants needed.
//
function slateVar(n) {
  return `rgb(var(--slate-${n}) / <alpha-value>)`
}

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './src/index.html'],
  theme: {
    extend: {
      colors: {
        slate: {
          50:  slateVar(50),
          100: slateVar(100),
          200: slateVar(200),
          300: slateVar(300),
          400: slateVar(400),
          500: slateVar(500),
          600: slateVar(600),
          700: slateVar(700),
          750: slateVar(750),
          800: slateVar(800),
          850: slateVar(850),
          900: slateVar(900),
          950: slateVar(950),
        },
        primary: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      borderRadius: {
        DEFAULT: '0.375rem',
      },
      transitionDuration: {
        fast: '120ms',
        base: '180ms',
        slow: '240ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'fade-in-scale': {
          '0%': { opacity: 0, transform: 'scale(0.96)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        'slide-down': {
          '0%': { opacity: 0, transform: 'translateY(-8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
      },
      animation: {
        'fade-in':       'fade-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-scale': 'fade-in-scale 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down':    'slide-down 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft':    'pulse-soft 1.6s ease-in-out infinite',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
