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
export type ThemeMode = 'light' | 'dark' | 'ocean' | 'protanopia' | 'deuteranopia' | 'tritanopia';

// ─── Accessibility Theme: Protanopia (Red-blind) ───────────────────────────
// Optimized for users who cannot perceive red light.
// Avoids red-green combinations. Uses blue, yellow/amber, and high-contrast neutrals.
// Status indicators should always pair with icons/patterns: ✓ success, ⚠ warning, ✕ error, ℹ info.
export const protanopiaTheme: Theme = {
  mode: 'protanopia' as any,
  colors: {
    primary: '#0077BB',      // Strong blue — safe anchor color
    secondary: '#33576B',    // Dark teal-grey
    accent: '#EE7733',       // Vivid orange — clearly distinct from blue
    background: '#FAFAFA',
    surface: '#F0F4F7',
    text: '#1B1B1B',
    textSecondary: '#4A4A4A',
    textTertiary: '#6E6E6E',
    input: '#EDF1F5',
    border: '#C8CED3',
    borderSecondary: '#D6DCE1',
    overlay: 'rgba(27, 27, 27, 0.45)',
    error: '#CC3311',        // Dark red-orange (visible as dark warm tone)
    success: '#009988',      // Teal — clearly distinct from error
    card: '#FFFFFF',
    cardHover: '#F0F4F7',
  },
  semanticColors: {
    success: '#009988',      // Teal
    warning: '#EE7733',      // Orange
    danger: '#CC3311',       // Dark orange-red
    info: '#0077BB',         // Blue
    secondary: '#33576B',
    accent: '#EE7733',
  },
  gradients: {
    bmi: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
    activity: ['#E0F5F3', '#A8E0DA', '#6EC8BF'],
    sleep: ['#FFF3E0', '#FFE0B2', '#FFCC80'],
    water: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
    stress: ['#FFF3E0', '#FFE0B2', '#FFCC80'],
    dietary: ['#E0F5F3', '#A8E0DA', '#6EC8BF'],
    health: ['#FDE8E0', '#F8C4A8', '#F2A07A'],
    environment: ['#E0F5F3', '#A8E0DA', '#6EC8BF'],
    addiction: ['#FDE8E0', '#F8C4A8', '#F2A07A'],
    risks: ['#FFF3E0', '#FFE0B2', '#FFCC80'],
    prediction: ['#FDE8E0', '#F8C4A8', '#F2A07A'],
    primary: ['#0077BB', '#3399CC', '#66BBDD'],
  },
  statusBackgrounds: {
    success: '#E0F5F3',
    warning: '#FFF3E0',
    danger: '#FDE8E0',
    info: '#E1F0FA',
    secondary: '#E8EEF2',
    accent: '#FFF3E0',
  },
  fonts: fontFamilies,
  fontSizes: fontSizes,
  fontWeights: fontWeights,
};

// ─── Accessibility Theme: Deuteranopia (Green-blind) ───────────────────────
// Optimized for users who cannot perceive green light (most common CVD).
// Avoids red-green combinations. Uses blue, orange/amber, and purple.
// Status indicators should always pair with icons/patterns: ✓ success, ⚠ warning, ✕ error, ℹ info.
export const deuteranopiaTheme: Theme = {
  mode: 'deuteranopia' as any,
  colors: {
    primary: '#3366CC',      // Medium blue
    secondary: '#44355B',    // Deep purple-grey
    accent: '#DDAA33',       // Golden amber — clearly distinct from blue
    background: '#FAF9F7',
    surface: '#F2F0ED',
    text: '#1A1A2E',
    textSecondary: '#4A4A5A',
    textTertiary: '#6E6E7E',
    input: '#EFEEE9',
    border: '#CCC9C1',
    borderSecondary: '#D9D6CF',
    overlay: 'rgba(26, 26, 46, 0.45)',
    error: '#D4500A',        // Burnt orange (replaces red)
    success: '#0077BB',      // Blue (replaces green)
    card: '#FFFFFF',
    cardHover: '#F2F0ED',
  },
  semanticColors: {
    success: '#0077BB',      // Blue (replaces problematic green)
    warning: '#DDAA33',      // Golden amber
    danger: '#D4500A',       // Burnt orange
    info: '#3366CC',         // Medium blue
    secondary: '#7755AA',    // Purple
    accent: '#DDAA33',
  },
  gradients: {
    bmi: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    activity: ['#E6E0F0', '#CDB8E4', '#B08FD4'],
    sleep: ['#FFF5DA', '#FFE8A3', '#FFD966'],
    water: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    stress: ['#FFF5DA', '#FFE8A3', '#FFD966'],
    dietary: ['#E6E0F0', '#CDB8E4', '#B08FD4'],
    health: ['#FDE8D8', '#F5C8A0', '#EDA86A'],
    environment: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    addiction: ['#FDE8D8', '#F5C8A0', '#EDA86A'],
    risks: ['#FFF5DA', '#FFE8A3', '#FFD966'],
    prediction: ['#FDE8D8', '#F5C8A0', '#EDA86A'],
    primary: ['#3366CC', '#5588DD', '#77AAEE'],
  },
  statusBackgrounds: {
    success: '#E1F0FA',
    warning: '#FFF5DA',
    danger: '#FDE8D8',
    info: '#E2E8F5',
    secondary: '#EDE6F5',
    accent: '#FFF5DA',
  },
  fonts: fontFamilies,
  fontSizes: fontSizes,
  fontWeights: fontWeights,
};

// ─── Accessibility Theme: Tritanopia (Blue-blind) ──────────────────────────
// Optimized for users who cannot perceive blue light.
// Avoids blue-yellow combinations. Uses red/pink, teal/green, and high-contrast neutrals.
// Status indicators should always pair with icons/patterns: ✓ success, ⚠ warning, ✕ error, ℹ info.
export const tritanopiaTheme: Theme = {
  mode: 'tritanopia' as any,
  colors: {
    primary: '#CC3366',      // Strong magenta-pink
    secondary: '#2E5E4E',    // Dark forest teal
    accent: '#11AA66',       // Vivid green — clearly distinct from pink
    background: '#FAFAF8',
    surface: '#F3F2EE',
    text: '#1C1C1C',
    textSecondary: '#4B4B4B',
    textTertiary: '#707070',
    input: '#EFEEEA',
    border: '#CBC9C3',
    borderSecondary: '#D8D6D1',
    overlay: 'rgba(28, 28, 28, 0.45)',
    error: '#CC2200',        // Deep red (no blue component)
    success: '#118844',      // Forest green
    card: '#FFFFFF',
    cardHover: '#F3F2EE',
  },
  semanticColors: {
    success: '#118844',      // Forest green
    warning: '#CC7700',      // Dark amber (no blue)
    danger: '#CC2200',       // Deep red
    info: '#CC3366',         // Magenta-pink (replaces blue)
    secondary: '#2E5E4E',
    accent: '#11AA66',
  },
  gradients: {
    bmi: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    activity: ['#E0F2E9', '#B2DFCC', '#7ECBA8'],
    sleep: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    water: ['#E0F2E9', '#B2DFCC', '#7ECBA8'],
    stress: ['#FFF0D9', '#FFE0B2', '#FFCC80'],
    dietary: ['#E0F2E9', '#B2DFCC', '#7ECBA8'],
    health: ['#FDEAEA', '#F5C2C2', '#ED9A9A'],
    environment: ['#E0F2E9', '#B2DFCC', '#7ECBA8'],
    addiction: ['#FDEAEA', '#F5C2C2', '#ED9A9A'],
    risks: ['#FFF0D9', '#FFE0B2', '#FFCC80'],
    prediction: ['#FDEAEA', '#F5C2C2', '#ED9A9A'],
    primary: ['#CC3366', '#DD5588', '#EE77AA'],
  },
  statusBackgrounds: {
    success: '#E0F2E9',
    warning: '#FFF0D9',
    danger: '#FDEAEA',
    info: '#FCE4EC',
    secondary: '#E8F0EC',
    accent: '#E0F2E9',
  },
  fonts: fontFamilies,
  fontSizes: fontSizes,
  fontWeights: fontWeights,
};
