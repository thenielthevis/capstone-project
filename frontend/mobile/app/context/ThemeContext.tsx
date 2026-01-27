import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { lightTheme, darkTheme, oceanTheme } from '../../design/tokens';

const THEMES = {
  light: lightTheme,
  dark: darkTheme,
  ocean: oceanTheme,
};

type ThemeKey = keyof typeof THEMES;

// Explicit theme type definition
interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  input: string;
  border: string;
  overlay: string;
  error: string;
  success: string;
}

interface Theme {
  mode: string;
  colors: ThemeColors;
  fonts: any;
  fontSizes: any;
  fontWeights: any;
  semanticColors?: any;
  gradients?: any;
  statusBackgrounds?: any;
}

// Define a type that matches all theme objects
type ThemeType = Theme;

type ThemeContextType = {
  themeKey: ThemeKey;
  theme: ThemeType;
  setThemeKey: (key: ThemeKey) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  themeKey: 'light',
  theme: lightTheme as unknown as ThemeType,
  setThemeKey: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeKey, setThemeKeyState] = useState<ThemeKey>(
    systemColorScheme === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync('theme');
        if (savedTheme && THEMES[savedTheme as ThemeKey]) {
          setThemeKeyState(savedTheme as ThemeKey);
        } else {
          setThemeKeyState(systemColorScheme === 'dark' ? 'dark' : 'light');
        }
      } catch (error) {
        setThemeKeyState(systemColorScheme === 'dark' ? 'dark' : 'light');
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const setThemeKey = async (key: ThemeKey) => {
    setThemeKeyState(key);
    await SecureStore.setItemAsync('theme', key);
  };

  const theme = THEMES[themeKey] as unknown as ThemeType;

  return (
    <ThemeContext.Provider value={{ themeKey, theme, setThemeKey }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeProvider;