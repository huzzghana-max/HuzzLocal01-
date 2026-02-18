/**
 * Theme Configuration
 * 
 * This file is maintained for backward compatibility.
 * Use ThemeContext.tsx for active theme management instead.
 * 
 * New Theme System:
 * - Light Mode: Deep Teal (#1F4D5C) + Warm Amber (#F4A64A)
 * - Dark Mode: Dark Teal (#153944) + Muted Amber (#F2B261)
 * 
 * Access the active theme using the useTheme() hook from ThemeContext.tsx
 */

export type ThemeVariant = 'light' | 'dark'

export interface ThemeConfig {
  variant: ThemeVariant
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

// Current active theme - DEPRECATED, use ThemeContext instead
export const currentTheme: ThemeConfig = {
  variant: 'light',
  primaryColor: '#1F4D5C',      // Deep Teal
  secondaryColor: '#F4A64A',    // Warm Amber
  accentColor: '#153944',        // Dark Teal
}

// Theme color palette
export const THEME_COLORS = {
  light: {
    primary: '#1F4D5C',        // Deep Teal
    secondary: '#F4A64A',      // Warm Amber
    background: '#F9FAF8',     // Soft Off-White
    surface: '#F6E3CC',        // Light Warm Beige
    textPrimary: '#1F2F35',    // Dark Teal
    textSecondary: '#6F7F86',  // Slate
    textDisabled: '#9BA8AE',   // Lighter Slate
  },
  dark: {
    primary: '#153944',        // Dark Teal
    secondary: '#F2B261',      // Muted Amber
    background: '#0F1F26',     // Deep Charcoal Blue
    surface: '#1C3A44',        // Dark Teal Surface
    textPrimary: '#E6EFF3',    // Light Blue-White
    textSecondary: '#A8BCC4',  // Muted Blue
    textDisabled: '#6F8A94',   // Darker Blue
  },
}

/**
 * Get current theme configuration
 * DEPRECATED - Use useTheme() hook from ThemeContext instead
 */
export const getCurrentTheme = (): ThemeConfig => currentTheme

/**
 * Check if dark mode is enabled
 * DEPRECATED - Use useTheme() hook from ThemeContext instead
 */
export const isDarkMode = (): boolean => currentTheme.variant === 'dark'

export default {
  currentTheme,
  THEME_COLORS,
  getCurrentTheme,
  isDarkMode,
}
