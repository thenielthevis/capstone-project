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
  semanticColors: {
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#F44336',
    info: '#2196F3',
    secondary: '#9C27B0',
    accent: '#FF6F00',
  },
  gradients: {
    bmi: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
    activity: ['#E8F5E9', '#C8E6C9', '#81C784'],
    sleep: ['#F3E5F5', '#E1BEE7', '#CE93D8'],
    water: ['#E1F5FE', '#B3E5FC', '#64B5F6'],
    stress: ['#FFF3E0', '#FFE0B2', '#FFB74D'],
    dietary: ['#F1F8E9', '#DCEDC8', '#A5D6A7'],
    health: ['#FFEBEE', '#FFCDD2', '#EF9A9A'],
    environment: ['#E0F2F1', '#B2DFDB', '#80DEEA'],
    addiction: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    risks: ['#FFF3E0', '#FFE0B2', '#FFCC80'],
    prediction: ['#FFEBEE', '#FFCDD2', '#EF9A9A'],
    primary: ['#38b6ff', '#5ec5ff', '#84d4ff'],
  },
  statusBackgrounds: {
    success: '#E8F5E9',
    warning: '#FFF3E0',
    danger: '#FFEBEE',
    info: '#E3F2FD',
    secondary: '#F3E5F5',
    accent: '#FFE0B2',
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
  semanticColors: {
    success: '#66BB6A',
    warning: '#FFA726',
    danger: '#EF5350',
    info: '#42A5F5',
    secondary: '#AB47BC',
    accent: '#FF7043',
  },
  gradients: {
    bmi: ['#1E3A8A', '#2563EB', '#3B82F6'],
    activity: ['#1B4332', '#2D6A4F', '#40916C'],
    sleep: ['#3D2645', '#6A4C93', '#8B5A8E'],
    water: ['#0C1E42', '#0D47A1', '#1565C0'],
    stress: ['#4A2C2A', '#8B5A00', '#C39200'],
    dietary: ['#1B3A14', '#33691E', '#558B2F'],
    health: ['#4A2527', '#C62828', '#E53935'],
    environment: ['#004D40', '#00695C', '#009688'],
    addiction: ['#4A235A', '#6A1B9A', '#8E24AA'],
    risks: ['#4A2C2A', '#8B5A00', '#C39200'],
    prediction: ['#4A2527', '#C62828', '#E53935'],
    primary: ['#1E3A8A', '#2563EB', '#3B82F6'],
  },
  statusBackgrounds: {
    success: '#1B5E20',
    warning: '#E65100',
    danger: '#B71C1C',
    info: '#0D3680',
    secondary: '#4A148C',
    accent: '#BF360C',
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
  semanticColors: {
    success: '#0B7285',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#0369A1',
    secondary: '#0891B2',
    accent: '#06B6D4',
  },
  gradients: {
    bmi: ['#A7F3D0', '#6EE7B7', '#34D399'],
    activity: ['#CCFBF1', '#99F6E4', '#5EE7DF'],
    sleep: ['#BAE6FD', '#7DD3FC', '#38BDF8'],
    water: ['#A5F3FC', '#67E8F9', '#22D3EE'],
    stress: ['#DBEAFE', '#BFDBFE', '#93C5FD'],
    dietary: ['#ECFDF5', '#D1FAE5', '#A7F3D0'],
    health: ['#FECACA', '#FECACA', '#FCA5A5'],
    environment: ['#CFFAFE', '#A5F3FC', '#67E8F9'],
    addiction: ['#DDD6FE', '#C4B5FD', '#A78BFA'],
    risks: ['#DBEAFE', '#BFDBFE', '#93C5FD'],
    prediction: ['#FECACA', '#FECACA', '#FCA5A5'],
    primary: ['#0096c7', '#48cae4', '#90e0ef'],
  },
  statusBackgrounds: {
    success: '#CCFBF1',
    warning: '#FEF3C7',
    danger: '#FEE2E2',
    info: '#E0F2FE',
    secondary: '#F3E8FF',
    accent: '#CFFAFE',
  },
  fonts: fontFamilies,
  fontSizes: fontSizes,
  fontWeights: fontWeights,
};

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark' | 'ocean';
