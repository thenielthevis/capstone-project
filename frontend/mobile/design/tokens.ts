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
};

export const lightTheme = {
  mode: 'light',
  colors: {
    ...baseColors,
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1a1916',
    input: '#F1F5F9', // light input background
    overlay: 'rgba(44, 62, 80, 0.4)', // semi-transparent dark overlay
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
    input: '#23272e', // dark input background
    overlay: 'rgba(0,0,0,0.6)', // semi-transparent black overlay
  },
  fonts: fontFamilies,
  fontSizes: fontSizes,
  fontWeights: fontWeights,
};

// Example: Future “Ocean” theme
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
  },
  fonts: fontFamilies,
  fontSizes: fontSizes,
  fontWeights: fontWeights,
};