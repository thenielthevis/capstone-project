import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'ocean';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    if (savedTheme && ['light', 'dark', 'ocean'].includes(savedTheme)) {
      setThemeModeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme: ThemeMode = prefersDark ? 'dark' : 'light';
      setThemeModeState(defaultTheme);
      applyTheme(defaultTheme);
    }
    setIsLoaded(true);
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('theme', mode);
    applyTheme(mode);
  };

  const applyTheme = (mode: ThemeMode) => {
    const htmlElement = document.documentElement;
    
    htmlElement.classList.remove('light', 'dark', 'ocean');
    htmlElement.classList.add(mode);

    // Apply CSS variables and styles based on theme
    if (mode === 'dark') {
      htmlElement.style.colorScheme = 'dark';
      document.documentElement.style.setProperty('--background', '#0f172a');
      document.documentElement.style.setProperty('--foreground', '#f1f5f9');
    } else if (mode === 'ocean') {
      htmlElement.style.colorScheme = 'dark';
      document.documentElement.style.setProperty('--background', '#0c1929');
      document.documentElement.style.setProperty('--foreground', '#e0f2fe');
    } else {
      htmlElement.style.colorScheme = 'light';
      document.documentElement.style.setProperty('--background', '#ffffff');
      document.documentElement.style.setProperty('--foreground', '#0f172a');
    }
  };

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      {isLoaded && children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
