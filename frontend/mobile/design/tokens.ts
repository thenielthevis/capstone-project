// design/tokens.ts
import { RFValue } from "react-native-responsive-fontsize";

export const fontFamilies = {
  heading: "Poppins-Bold",
  subheading: "Poppins-Regular",
  body: "Inter",
  bodyBold: "Inter-Bold",
  poppinsBold: "Poppins-Bold",
  poppinsRegular: "Poppins-Regular",
  interRegular: "Inter",
  interBold: "Inter-Bold",
  robotoRegular: "Roboto-Regular",
  robotoBold: "Roboto-Bold",
};

export const fontSizes = {
  xs: RFValue(8),
  sm: RFValue(10),
  m: RFValue(11),
  base: RFValue(12),
  lg: RFValue(14),
  xl: RFValue(16),
  "2xl": RFValue(32),
};

//font weight
export const fontWeights = {
  light: "300",
  regular: "400",
  medium: "500",
  bold: "700",
  extraBold: "800",
  black: "900",
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
    textSecondary: '#64748B',
    input: '#F1F5F9', // light input background
    border: '#E2E8F0',
    overlay: 'rgba(44, 62, 80, 0.4)', // semi-transparent dark overlay
    error: '#E45858',
    success: '#10B981',
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
    activity: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
    sleep: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
    water: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
    stress: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
    dietary: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
    health: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
    environment: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
    addiction: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
    risks: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
    prediction: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
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
    textSecondary: '#9CA3AF',
    input: '#23272e', // dark input background
    border: '#374151',
    overlay: 'rgba(0,0,0,0.8)', // semi-transparent black overlay
    error: '#FF6B6B',
    success: '#10B981',
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
    activity: ['#1E3A8A', '#2563EB', '#3B82F6'],
    sleep: ['#1E3A8A', '#2563EB', '#3B82F6'],
    water: ['#1E3A8A', '#2563EB', '#3B82F6'],
    stress: ['#1E3A8A', '#2563EB', '#3B82F6'],
    dietary: ['#1E3A8A', '#2563EB', '#3B82F6'],
    health: ['#1E3A8A', '#2563EB', '#3B82F6'],
    environment: ['#1E3A8A', '#2563EB', '#3B82F6'],
    addiction: ['#1E3A8A', '#2563EB', '#3B82F6'],
    risks: ['#1E3A8A', '#2563EB', '#3B82F6'],
    prediction: ['#1E3A8A', '#2563EB', '#3B82F6'],
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

// Example: Future "Ocean" theme
export const oceanTheme = {
  mode: 'ocean',
  colors: {
    ...baseColors,
    primary: '#0096c7',
    secondary: '#023e8a',
    accent: '#48cae4',
    background: '#caf0f8',
    input: '#F1F5F9',
    surface: '#ade8f4',
    text: '#03045e',
    textSecondary: '#0077B6',
    border: '#90E0EF',
    overlay: 'rgba(44, 62, 80, 0.4)',
    error: '#E45858',
    success: '#10B981',
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
    activity: ['#A7F3D0', '#6EE7B7', '#34D399'],
    sleep: ['#A7F3D0', '#6EE7B7', '#34D399'],
    water: ['#A7F3D0', '#6EE7B7', '#34D399'],
    stress: ['#A7F3D0', '#6EE7B7', '#34D399'],
    dietary: ['#A7F3D0', '#6EE7B7', '#34D399'],
    health: ['#A7F3D0', '#6EE7B7', '#34D399'],
    environment: ['#A7F3D0', '#6EE7B7', '#34D399'],
    addiction: ['#A7F3D0', '#6EE7B7', '#34D399'],
    risks: ['#A7F3D0', '#6EE7B7', '#34D399'],
    prediction: ['#A7F3D0', '#6EE7B7', '#34D399'],
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

// ─── Accessibility Theme: Protanopia (Red-blind) ───────────────────────────────
// Optimized for users who cannot perceive red light.
// Avoids red-green combinations. Uses blue, yellow/amber, and high-contrast neutrals.
// Status indicators should always pair with icons/patterns: ✓ success, ⚠ warning, ✕ error, ℹ info.
export const protanopiaTheme = {
  mode: 'protanopia',
  colors: {
    primary: '#0077BB',
    secondary: '#33576B',
    accent: '#EE7733',
    background: '#FAFAFA',
    surface: '#F0F4F7',
    text: '#1B1B1B',
    textSecondary: '#4A4A4A',
    input: '#EDF1F5',
    border: '#C8CED3',
    overlay: 'rgba(27, 27, 27, 0.45)',
    error: '#CC3311',
    success: '#009988',
  },
  semanticColors: {
    success: '#009988',
    warning: '#EE7733',
    danger: '#CC3311',
    info: '#0077BB',
    secondary: '#33576B',
    accent: '#EE7733',
  },
  gradients: {
    bmi: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
    activity: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
    sleep: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
    water: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
    stress: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
    dietary: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
    health: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
    environment: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
    addiction: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
    risks: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
    prediction: ['#E1F0FA', '#B3D9F2', '#7ABCE0'],
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

// ─── Accessibility Theme: Deuteranopia (Green-blind) ───────────────────────────
// Optimized for users who cannot perceive green light (most common CVD).
// Avoids red-green combinations. Uses blue, orange/amber, and purple.
// Status indicators should always pair with icons/patterns: ✓ success, ⚠ warning, ✕ error, ℹ info.
export const deuteranopiaTheme = {
  mode: 'deuteranopia',
  colors: {
    primary: '#3366CC',
    secondary: '#44355B',
    accent: '#DDAA33',
    background: '#FAF9F7',
    surface: '#F2F0ED',
    text: '#1A1A2E',
    textSecondary: '#4A4A5A',
    input: '#EFEEE9',
    border: '#CCC9C1',
    overlay: 'rgba(26, 26, 46, 0.45)',
    error: '#D4500A',
    success: '#0077BB',
  },
  semanticColors: {
    success: '#0077BB',
    warning: '#DDAA33',
    danger: '#D4500A',
    info: '#3366CC',
    secondary: '#7755AA',
    accent: '#DDAA33',
  },
  gradients: {
    bmi: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    activity: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    sleep: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    water: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    stress: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    dietary: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    health: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    environment: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    addiction: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    risks: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
    prediction: ['#E2E8F5', '#BCC8E8', '#8FA6D9'],
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

// ─── Accessibility Theme: Tritanopia (Blue-blind) ──────────────────────────────
// Optimized for users who cannot perceive blue light.
// Avoids blue-yellow combinations. Uses red/pink, teal/green, and high-contrast neutrals.
// Status indicators should always pair with icons/patterns: ✓ success, ⚠ warning, ✕ error, ℹ info.
export const tritanopiaTheme = {
  mode: 'tritanopia',
  colors: {
    primary: '#CC3366',
    secondary: '#2E5E4E',
    accent: '#11AA66',
    background: '#FAFAF8',
    surface: '#F3F2EE',
    text: '#1C1C1C',
    textSecondary: '#4B4B4B',
    input: '#EFEEEA',
    border: '#CBC9C3',
    overlay: 'rgba(28, 28, 28, 0.45)',
    error: '#CC2200',
    success: '#118844',
  },
  semanticColors: {
    success: '#118844',
    warning: '#CC7700',
    danger: '#CC2200',
    info: '#CC3366',
    secondary: '#2E5E4E',
    accent: '#11AA66',
  },
  gradients: {
    bmi: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    activity: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    sleep: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    water: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    stress: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    dietary: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    health: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    environment: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    addiction: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    risks: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
    prediction: ['#FCE4EC', '#F8BBD0', '#F48FB1'],
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