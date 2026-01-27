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