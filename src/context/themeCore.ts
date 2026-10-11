import { createContext, useContext } from 'react';
import { ThemeContextType } from '../types/theme';

export const THEME_STORAGE_KEY = 'tradepulse_theme';

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
