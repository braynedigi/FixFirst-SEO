'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, themePreference, setThemePreference } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;
    
    const handleClick = () => setShowDropdown(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showDropdown]);

  if (!mounted) {
    return (
      <div className="relative p-2 rounded-lg bg-background-card border border-border w-10 h-10" />
    );
  }

  const getIcon = () => {
    if (themePreference === 'system') {
      return <Monitor className="w-5 h-5" />;
    }
    return theme === 'light' ? (
      <Sun className="w-5 h-5 text-warning" />
    ) : (
      <Moon className="w-5 h-5 text-primary" />
    );
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        className="relative p-2 rounded-lg bg-background-card border border-border hover:border-primary transition-all hover:scale-105 active:scale-95"
        title="Change theme"
        aria-label="Theme selector"
      >
        {getIcon()}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-background-card border border-border shadow-xl z-50 overflow-hidden">
          <div className="p-1">
            <button
              onClick={() => {
                setThemePreference('light');
                setShowDropdown(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-background-secondary transition-colors ${
                themePreference === 'light' ? 'bg-background-secondary' : ''
              }`}
            >
              <Sun className="w-4 h-4 text-warning" />
              <span className="flex-1 text-left text-sm">Light</span>
              {themePreference === 'light' && <Check className="w-4 h-4 text-primary" />}
            </button>

            <button
              onClick={() => {
                setThemePreference('dark');
                setShowDropdown(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-background-secondary transition-colors ${
                themePreference === 'dark' ? 'bg-background-secondary' : ''
              }`}
            >
              <Moon className="w-4 h-4 text-primary" />
              <span className="flex-1 text-left text-sm">Dark</span>
              {themePreference === 'dark' && <Check className="w-4 h-4 text-primary" />}
            </button>

            <button
              onClick={() => {
                setThemePreference('system');
                setShowDropdown(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-background-secondary transition-colors ${
                themePreference === 'system' ? 'bg-background-secondary' : ''
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span className="flex-1 text-left text-sm">System</span>
              {themePreference === 'system' && <Check className="w-4 h-4 text-primary" />}
            </button>
          </div>
          
          {themePreference === 'system' && (
            <div className="px-3 py-2 text-xs text-text-secondary border-t border-border bg-background-secondary/50">
              Currently: {theme === 'dark' ? 'Dark' : 'Light'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

