'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemePreference = 'light' | 'dark' | 'system';
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme; // Actual applied theme
  themePreference: ThemePreference; // User's preference
  toggleTheme: () => void;
  setThemePreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [mounted, setMounted] = useState(false);

  // Get system theme preference
  const getSystemTheme = (): Theme => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  // Load and apply theme on mount
  useEffect(() => {
    setMounted(true);
    
    // Load preference from localStorage
    const savedPreference = localStorage.getItem('themePreference') as ThemePreference | null;
    const preference = savedPreference || 'system';
    setThemePreferenceState(preference);

    // Apply theme based on preference
    if (preference === 'system') {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(preference);
    }
  }, []);

  // Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (!mounted || themePreference !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(getSystemTheme());
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mounted, themePreference]);

  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    localStorage.setItem('themePreference', preference);

    // Apply theme immediately
    if (preference === 'system') {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(preference);
    }
  };

  const toggleTheme = () => {
    // Simple toggle between light and dark (ignores system)
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemePreference(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, themePreference, toggleTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

