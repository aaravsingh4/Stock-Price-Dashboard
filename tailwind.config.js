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
          emerald: '#00b386',
          emeraldLight: '#ebf9f5',
        },
        market: {
          up: '#00b386', // Groww-inspired institutional mint-emerald
          upDark: '#00d09c',
          upBg: '#ebf9f5',
          upDarkBg: 'rgba(0, 208, 156, 0.12)',
          down: '#eb5b3c', // Groww-inspired crisp coral red
          downDark: '#f87171',
          downBg: '#fef2f2',
          downDarkBg: 'rgba(235, 91, 60, 0.12)',
        },
        surface: {
          light: '#f9fafb', // Soft neutral off-white Groww canvas
          card: '#ffffff', // Crisp pure white surfaces
          cardHover: '#f8fafc',
          darkBg: '#0b0f19', // Deep navy charcoal
          darkCard: '#121824', // Elevated dark surface
          darkCardHover: '#182030',
          darkBorder: '#1e293b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'elevated': '0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'dropdown': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
