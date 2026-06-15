import type { Config } from 'tailwindcss';

// "Iron Ledger" theme. The app's components reference Tailwind's `gray` and
// `blue` scales throughout; we re-point those names at the theme palette so
// the whole app reads from one place: warm iron/chalk neutrals and a single
// hot signal-orange accent.
const iron = {
  50: '#f5f3ee', // chalk paper
  100: '#ece9e1',
  200: '#dcd8cc',
  300: '#c3beaf',
  400: '#9b9587',
  500: '#767164',
  600: '#56514a',
  700: '#37342e',
  800: '#232120',
  900: '#151413',
  950: '#0d0c0b',
};

const signal = {
  50: '#fff3ea',
  100: '#ffe4d0',
  200: '#ffc7a0',
  300: '#ffa067',
  400: '#ff7a33',
  500: '#f95f11',
  600: '#e44e06',
  700: '#bd3f06',
  800: '#96340b',
  900: '#7a2d0e',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: iron,
        blue: signal,
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        display: ['Anton', 'Archivo', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      // Hard, industrial edges — the soft-rounded defaults read "generic app".
      borderRadius: {
        DEFAULT: '2px',
        md: '2px',
        lg: '3px',
        xl: '4px',
        '2xl': '6px',
        '3xl': '8px',
      },
      letterSpacing: {
        label: '0.14em',
      },
    },
  },
  plugins: [],
} satisfies Config;
