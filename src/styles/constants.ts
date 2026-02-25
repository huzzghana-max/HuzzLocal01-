/**
 * Styling Constants
 * Centralized styling values for consistency across the app
 * Replaces mixed inline styles and ensures visual consistency
 */

import type { SxProps, Theme } from '@mui/material/styles'

// Common spacing values (based on MUI spacing unit of 8px)
export const SPACING = {
  xs: 1, // 8px
  sm: 2, // 16px
  md: 3, // 24px
  lg: 4, // 32px
  xl: 5, // 40px
  xxl: 6, // 48px
} as const

// Common border radius values
export const BORDER_RADIUS = {
  small: '4px',
  medium: '8px',
  large: '12px',
  xl: '16px',
  full: '50%',
} as const

// Common shadows
export const SHADOWS = {
  subtle: '0 2px 4px rgba(0, 0, 0, 0.08)',
  light: '0 4px 8px rgba(0, 0, 0, 0.12)',
  medium: '0 8px 16px rgba(0, 0, 0, 0.16)',
  elevated: '0 12px 24px rgba(0, 0, 0, 0.2)',
} as const

// Breakpoints
export const BREAKPOINTS = {
  mobile: 'max-width: 600px',
  tablet: 'max-width: 960px',
  desktop: 'min-width: 960px',
} as const

// Z-index scale for consistent layering
export const Z_INDEX = {
  base: 0,
  navbar: 1100,
  drawer: 1200,
  modal: 1300,
  tooltip: 1400,
  notification: 1500,
} as const

// Common reusable sx styles
export const COMMON_STYLES = {
  // Flex layouts
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  } as SxProps<Theme>,

  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as SxProps<Theme>,

  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
  } as SxProps<Theme>,

  // Full size
  fullSize: {
    width: '100%',
    height: '100%',
  } as SxProps<Theme>,

  fullWidth: {
    width: '100%',
  } as SxProps<Theme>,

  // Responsive container
  container: {
    px: { xs: SPACING.sm, sm: SPACING.md, md: SPACING.lg },
    mx: 'auto',
    maxWidth: '1200px',
  } as SxProps<Theme>,

  // Text truncation
  textTruncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as SxProps<Theme>,

  // Flexible grow
  flexGrow: {
    flex: 1,
  } as SxProps<Theme>,

  // Smooth transitions
  smoothTransition: {
    transition: 'all 0.3s ease-in-out',
  } as SxProps<Theme>,
} as const

// Common input styles
export const INPUT_STYLES = {
  base: {
    '& .MuiOutlinedInput-root': {
      fontSize: '0.95rem',
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.12)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.24)',
      },
    },
  } as SxProps<Theme>,

  dense: {
    '& .MuiOutlinedInput-input': {
      padding: '10px 12px',
    },
  } as SxProps<Theme>,
} as const

// Common button styles
export const BUTTON_STYLES = {
  base: {
    textTransform: 'none',
    fontWeight: 500,
    ...COMMON_STYLES.smoothTransition,
  } as SxProps<Theme>,

  contained: {
    boxShadow: 'none',
    '&:hover': {
      boxShadow: SHADOWS.light,
    },
  } as SxProps<Theme>,

  outlined: {
    '&:hover': {
      backgroundColor: 'action.hover',
    },
  } as SxProps<Theme>,
} as const

// Common card styles
export const CARD_STYLES = {
  base: {
    borderRadius: BORDER_RADIUS.medium,
    boxShadow: SHADOWS.light,
  } as SxProps<Theme>,

  elevation: {
    boxShadow: SHADOWS.medium,
    '&:hover': {
      boxShadow: SHADOWS.elevated,
      ...COMMON_STYLES.smoothTransition,
    },
  } as SxProps<Theme>,
} as const

// Page padding/spacing
export const PAGE_PADDING = {
  horizontal: { xs: SPACING.sm, sm: SPACING.md, md: SPACING.lg },
  vertical: { xs: SPACING.md, sm: SPACING.lg, md: SPACING.xl },
} as const

export default {
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  BREAKPOINTS,
  Z_INDEX,
  COMMON_STYLES,
  INPUT_STYLES,
  BUTTON_STYLES,
  CARD_STYLES,
  PAGE_PADDING,
}
