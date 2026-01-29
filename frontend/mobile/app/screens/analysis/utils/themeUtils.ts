/**
 * Theme utility helpers for the Analysis module
 * Maps the theme context to simpler accessors
 */

import { lightTheme, darkTheme, fontFamilies as designFontFamilies, fontSizes as designFontSizes } from '@/design/tokens';

// Re-export with simpler naming for local use
export const fonts = {
    bold: designFontFamilies.poppinsBold,
    semibold: designFontFamilies.poppinsBold, // Use bold as fallback for semibold
    medium: designFontFamilies.poppinsRegular,
    regular: designFontFamilies.poppinsRegular,
    body: designFontFamilies.body,
    bodyBold: designFontFamilies.bodyBold,
};

export const sizes = {
    xs: designFontSizes.xs,
    sm: designFontSizes.sm,
    md: designFontSizes.m, // Map md to m
    base: designFontSizes.base,
    lg: designFontSizes.lg,
    xl: designFontSizes.xl,
    '2xl': designFontSizes['2xl'],
};

// Helper to extract flat theme properties for easier access
export interface FlatTheme {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    card: string; // maps to surface
    input: string;
    border: string;
    overlay: string;
    error: string;
    success: string;
}

export const flattenTheme = (theme: any): FlatTheme => {
    const colors = theme.colors || theme;
    return {
        primary: colors.primary || '#38b6ff',
        secondary: colors.secondary || '#2e5484',
        accent: colors.accent || '#10B981',
        background: colors.background || '#FFFFFF',
        surface: colors.surface || '#F8FAFC',
        text: colors.text || '#1a1916',
        textSecondary: colors.textSecondary || '#64748B',
        card: colors.surface || '#F8FAFC', // Use surface for card
        input: colors.input || '#F1F5F9',
        border: colors.border || '#E2E8F0',
        overlay: colors.overlay || 'rgba(44, 62, 80, 0.4)',
        error: colors.error || '#E45858',
        success: colors.success || '#10B981',
    };
};

export default { fonts, sizes, flattenTheme };
