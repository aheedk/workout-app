import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client';
import { DEFAULT_PALETTE, isPaletteId, type PaletteId } from '../theme/palettes';

type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  palette: PaletteId;
  setPalette: (palette: PaletteId) => void;
  advancedSets: boolean;
  setAdvancedSets: (value: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

const PALETTE_KEY = 'palette';
const ADVANCED_SETS_KEY = 'advancedSets';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

function loadPalette(): PaletteId {
  try {
    const stored = localStorage.getItem(PALETTE_KEY);
    if (isPaletteId(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_PALETTE;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(user?.theme ?? 'system');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);
  const [palette, setPaletteState] = useState<PaletteId>(loadPalette);
  const [advancedSets, setAdvancedSetsState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADVANCED_SETS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    if (user?.theme) {
      setThemeState(user.theme);
    }
  }, [user?.theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette);
  }, [palette]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      if (user) {
        apiClient.put('/users/me', { theme: newTheme }).catch(() => {});
      }
    },
    [user]
  );

  const setPalette = useCallback((newPalette: PaletteId) => {
    setPaletteState(newPalette);
    try {
      localStorage.setItem(PALETTE_KEY, newPalette);
    } catch {
      /* ignore */
    }
  }, []);

  const setAdvancedSets = useCallback((value: boolean) => {
    setAdvancedSetsState(value);
    try {
      localStorage.setItem(ADVANCED_SETS_KEY, String(value));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, palette, setPalette, advancedSets, setAdvancedSets }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
