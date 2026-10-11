/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          900: '#1e3a8a',
        },
        market: {
          up: '#16a34a', // institutional emerald green
          upBg: '#f0fdf4',
          upDarkBg: 'rgba(22, 163, 74, 0.15)',
          down: '#dc2626', // institutional crimson red
          downBg: '#fef2f2',
          downDarkBg: 'rgba(220, 38, 38, 0.15)',
        },
        surface: {
          light: '#f8fafc', // slate-50 soft light background
          card: '#ffffff',
          darkBg: '#0b0f19', // deep institutional navy/charcoal
          darkCard: '#111827', // elevated dark surface
          darkBorder: '#1f2937',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.07)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
