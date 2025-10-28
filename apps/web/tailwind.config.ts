import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--bg-primary, #000000)',
          secondary: 'var(--bg-secondary, #0a0f1a)',
          card: 'var(--bg-card, #0f1419)',
        },
        border: {
          DEFAULT: 'var(--border, #1a2332)',
          hover: 'var(--border-hover, #2a3f5f)',
        },
        primary: {
          DEFAULT: '#06b6d4',
          dark: '#0891b2',
          light: '#22d3ee',
        },
        secondary: {
          DEFAULT: '#0ea5e9',
          dark: '#0284c7',
          light: '#38bdf8',
        },
        accent: {
          DEFAULT: '#14b8a6',
          dark: '#0d9488',
          light: '#2dd4bf',
        },
        success: '#10b981',
        warning: '#fbbf24',
        error: '#ef4444',
        text: {
          primary: 'var(--text-primary, #f0f9ff)',
          secondary: 'var(--text-secondary, #94a3b8)',
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
export default config

