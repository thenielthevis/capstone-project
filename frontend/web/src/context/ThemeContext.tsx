import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { lightTheme, darkTheme, oceanTheme, Theme, ThemeMode } from '../design/tokens';

const THEMES = {
  light: lightTheme,
  dark: darkTheme,
  ocean: oceanTheme,
};

type ThemeContextType = {
  themeMode: ThemeMode;
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  theme: lightTheme,
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    // Initialize from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && THEMES[savedTheme]) {
      return savedTheme;
    }
    
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    // Apply theme to document
    const theme = THEMES[themeMode];
    const root = document.documentElement;
    
    // Apply CSS variables
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text-primary', theme.colors.text);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-text-tertiary', theme.colors.textTertiary);
    root.style.setProperty('--color-primary-base', theme.colors.primary);
    root.style.setProperty('--color-secondary-base', theme.colors.secondary);
    root.style.setProperty('--color-accent-base', theme.colors.accent);
    root.style.setProperty('--color-input-bg', theme.colors.input);
    root.style.setProperty('--color-border-base', theme.colors.border);
    root.style.setProperty('--color-border-secondary-base', theme.colors.borderSecondary);
    root.style.setProperty('--color-error-base', theme.colors.error);
    root.style.setProperty('--color-success-base', theme.colors.success);
    root.style.setProperty('--color-card', theme.colors.card);
    root.style.setProperty('--color-card-hover', theme.colors.cardHover);
    root.style.setProperty('--color-overlay', theme.colors.overlay);
    
    // Set data attribute for theme-specific styling
    root.setAttribute('data-theme', themeMode);
    
    // Set background color on body
    document.body.style.backgroundColor = theme.colors.background;
    document.body.style.color = theme.colors.text;
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('theme', mode);
  };

  const theme = THEMES[themeMode];

  return (
    <ThemeContext.Provider value={{ themeMode, theme, setThemeMode }}>
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

export default ThemeProvider;
