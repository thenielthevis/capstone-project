// design/tokens.ts

export const fontFamilies = {
  heading: "'Poppins', sans-serif",
  subheading: "'Poppins', sans-serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
  bodyBold: "'Inter', system-ui, -apple-system, sans-serif",
  poppinsBold: "'Poppins', sans-serif",
  poppinsRegular: "'Poppins', sans-serif",
  interRegular: "'Inter', sans-serif",
  interBold: "'Inter', sans-serif",
  robotoRegular: "'Roboto', sans-serif",
  robotoBold: "'Roboto', sans-serif",
};

export const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  m: '0.9375rem',   // 15px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '2rem',    // 32px
};

export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  bold: '700',
  extraBold: '800',
  black: '900',
};

export const baseColors = {
  primary: '#38b6ff',
  secondary: '#2e5484',
  accent: '#10B981',
  error: '#E45858',
  success: '#10B981',
};

export const lightTheme = {
  mode: 'light',
  colors: {
    ...baseColors,
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1a1916',
    textSecondary: '#4a5568',
    textTertiary: '#718096',
    input: '#F1F5F9',
    border: '#e5e7eb',
    borderSecondary: '#e2e8f0',
    overlay: 'rgba(44, 62, 80, 0.4)',
    error: '#E45858',
    success: '#10B981',
    card: '#FFFFFF',
    cardHover: '#F8FAFC',
  },
  fonts: fontFamilies,
  fontSizes: fontSizes,
  fontWeights: fontWeights,
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    ...baseColors,
    background: '#111827',
    surface: '#1F2937',
    text: '#F3F4F6',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    input: '#23272e',
    border: '#374151',
    borderSecondary: '#4B5563',
    overlay: 'rgba(0,0,0,0.8)',
    error: '#FF6B6B',
    success: '#10B981',
    card: '#1F2937',
    cardHover: '#374151',
  },
  fonts: fontFamilies,
  fontSizes: fontSizes,
  fontWeights: fontWeights,
};

export const oceanTheme = {
  mode: 'ocean',
  colors: {
    ...baseColors,
    primary: '#0096c7',
    secondary: '#023e8a',
    accent: '#48cae4',
    background: '#caf0f8',
    surface: '#ade8f4',
    text: '#03045e',
    textSecondary: '#023e8a',
    textTertiary: '#0077b6',
    input: '#F1F5F9',
    border: '#90e0ef',
    borderSecondary: '#90e0ef',
    overlay: 'rgba(44, 62, 80, 0.4)',
    error: '#E45858',
    success: '#10B981',
    card: '#e0f7fa',
    cardHover: '#b2ebf2',
  },
  fonts: fontFamilies,
  fontSizes: fontSizes,
  fontWeights: fontWeights,
};

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark' | 'ocean';
