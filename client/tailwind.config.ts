import type { Config } from 'tailwindcss';

// "Iron Ledger" theme. The app references Tailwind's `gray` and `blue` scales
// throughout; we re-point those names at CSS variables (defined per palette in
// index.css under [data-palette]) so the entire palette is swappable at runtime.
const grayScale = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [
    s,
    `rgb(var(--g-${s}) / <alpha-value>)`,
  ])
);
const accentScale = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((s) => [
    s,
    `rgb(var(--a-${s}) / <alpha-value>)`,
  ])
);

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gray: grayScale,
        blue: accentScale,
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
