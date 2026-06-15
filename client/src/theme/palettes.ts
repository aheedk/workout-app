export type PaletteId =
  | 'mono'
  | 'iron'
  | 'blueprint'
  | 'crimson'
  | 'emerald'
  | 'olive'
  | 'ultraviolet';

export const DEFAULT_PALETTE: PaletteId = 'mono';

export interface PaletteMeta {
  id: PaletteId;
  label: string;
  desc: string;
  /** Dark-mode background + accent, for the settings swatch. */
  swatchBg: string;
  swatchAccent: string;
}

export const PALETTES: PaletteMeta[] = [
  { id: 'mono', label: 'Blackout', desc: 'Pure mono, white edge', swatchBg: '#111113', swatchAccent: '#fafafa' },
  { id: 'iron', label: 'Iron', desc: 'Charcoal + orange', swatchBg: '#151413', swatchAccent: '#f95f11' },
  { id: 'blueprint', label: 'Blueprint', desc: 'Ink navy + indigo', swatchBg: '#0c1018', swatchAccent: '#4f7cff' },
  { id: 'crimson', label: 'Crimson', desc: 'Graphite + red', swatchBg: '#121212', swatchAccent: '#e11d2a' },
  { id: 'emerald', label: 'Emerald', desc: 'Black + green', swatchBg: '#0d0f0e', swatchAccent: '#10d977' },
  { id: 'olive', label: 'Tactical', desc: 'Olive + brass', swatchBg: '#14150f', swatchAccent: '#c8a23a' },
  { id: 'ultraviolet', label: 'Ultraviolet', desc: 'Plum + violet', swatchBg: '#0f0b16', swatchAccent: '#9d5cff' },
];

export function isPaletteId(v: unknown): v is PaletteId {
  return typeof v === 'string' && PALETTES.some((p) => p.id === v);
}

// --- Chart colors -----------------------------------------------------------
// Recharts takes resolved color strings, so we can't lean on CSS variables for
// fills. Mirror the accent here; the accent is theme-aware only for Mono (white
// in dark, near-black in light). Grid/axis/tooltip are derived from light/dark.

interface AccentSpec {
  light: string;
  dark: string;
  softLight: string;
  softDark: string;
}

const ACCENTS: Record<PaletteId, AccentSpec> = {
  mono: { light: '#18181b', dark: '#fafafa', softLight: '#52525b', softDark: '#d4d4d8' },
  iron: { light: '#f95f11', dark: '#f95f11', softLight: '#ff7a33', softDark: '#ff7a33' },
  blueprint: { light: '#4f7cff', dark: '#4f7cff', softLight: '#8aa8ff', softDark: '#8aa8ff' },
  crimson: { light: '#e11d2a', dark: '#e11d2a', softLight: '#f15b64', softDark: '#f15b64' },
  emerald: { light: '#10d977', dark: '#10d977', softLight: '#58e3a3', softDark: '#58e3a3' },
  olive: { light: '#c8a23a', dark: '#c8a23a', softLight: '#ddc063', softDark: '#ddc063' },
  ultraviolet: { light: '#9d5cff', dark: '#9d5cff', softLight: '#bf98ff', softDark: '#bf98ff' },
};

const PIE: Record<PaletteId, string[]> = {
  mono: ['#a1a1aa', '#71717a', '#52525b', '#d4d4d8', '#3f3f46', '#e4e4e7'],
  iron: ['#f95f11', '#37342e', '#9b9587', '#ff7a33', '#bd3f06', '#c3beaf'],
  blueprint: ['#4f7cff', '#8aa8ff', '#38465f', '#b8cbff', '#273249', '#9fb0c9'],
  crimson: ['#e11d2a', '#f15b64', '#4b4845', '#f79aa0', '#313133', '#b8b4b0'],
  emerald: ['#10d977', '#58e3a3', '#38453e', '#95f1c4', '#2a302c', '#9bb0a5'],
  olive: ['#c8a23a', '#ddc063', '#474733', '#ecd78f', '#3a3d29', '#aaa888'],
  ultraviolet: ['#9d5cff', '#bf98ff', '#483b5f', '#d8c0ff', '#2e2440', '#b0a3c9'],
};

export interface ChartColors {
  accent: string;
  accentSoft: string;
  grid: string;
  axis: string;
  pie: string[];
  tooltipBg: string;
  tooltipBorder: string;
  tooltipFg: string;
}

export function chartColors(palette: PaletteId, theme: 'light' | 'dark'): ChartColors {
  const a = ACCENTS[palette] ?? ACCENTS.mono;
  const dark = theme === 'dark';
  return {
    accent: dark ? a.dark : a.light,
    accentSoft: dark ? a.softDark : a.softLight,
    grid: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    axis: dark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.45)',
    pie: PIE[palette] ?? PIE.mono,
    tooltipBg: 'rgba(10,10,12,0.96)',
    tooltipBorder: 'rgba(255,255,255,0.14)',
    tooltipFg: '#ffffff',
  };
}
