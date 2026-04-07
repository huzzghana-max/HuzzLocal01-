import { alpha, createTheme } from '@mui/material/styles'

const fontFamily = '"Manrope", "Plus Jakarta Sans", "Avenir Next", "Segoe UI", sans-serif'

const lightTokens = {
  primary: '#4D4D4D',
  primaryDark: '#171717',
  onPrimary: '#DEDEDE',
  secondary: '#F25623',
  secondaryDark: '#171717',
  onSecondary: '#DEDEDE',
  bg: '#FFFFFF',
  paper: '#FFFFFF',
  surface: '#DEDEDE',
  text: '#171717',
  textMuted: '#4D4D4D',
  border: '#4D4D4D',
  ring: '#F25623',
  shadow: '0 14px 36px rgba(23, 23, 23, 0.16)',
  success: '#4D4D4D',
  warning: '#F25623',
  error: '#171717',
  info: '#4D4D4D',
}

const darkTokens = {
  primary: '#DEDEDE',
  primaryDark: '#4D4D4D',
  onPrimary: '#171717',
  secondary: '#F25623',
  secondaryDark: '#4D4D4D',
  onSecondary: '#171717',
  bg: '#171717',
  paper: '#4D4D4D',
  surface: '#4D4D4D',
  text: '#DEDEDE',
  textMuted: '#DEDEDE',
  border: '#4D4D4D',
  ring: '#F25623',
  shadow: '0 14px 36px rgba(0, 0, 0, 0.42)',
  success: '#DEDEDE',
  warning: '#F25623',
  error: '#DEDEDE',
  info: '#DEDEDE',
}

const baseComponents = (tokens: typeof lightTokens) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        fontFamily,
        background: tokens.bg,
        color: tokens.text,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      '::selection': {
        backgroundColor: alpha(tokens.primary, 0.26),
      },
      '#root': {
        minHeight: '100vh',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        fontWeight: 700,
        letterSpacing: 0.2,
        textTransform: 'none' as const,
        borderRadius: 12,
        transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
      },
      contained: {
        background: tokens.secondary,
        color: tokens.onSecondary,
        boxShadow: tokens.shadow,
        padding: '10px 20px',
        '&:hover': {
          background: tokens.secondaryDark,
          boxShadow: tokens.shadow,
          transform: 'translateY(-1px)',
        },
      },
      containedSecondary: {
        color: tokens.onSecondary,
      },
      outlined: {
        border: 'none',
        color: tokens.primary,
        padding: '10px 20px',
        '&:hover': {
          backgroundColor: alpha(tokens.primary, 0.08),
          borderColor: 'transparent',
        },
      },
      sizeSmall: {
        padding: '7px 14px',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderRadius: 14,
        border: 'none',
        boxShadow: `0 8px 28px ${alpha(tokens.primaryDark, 0.12)}`,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 14,
        border: 'none',
        backgroundColor: alpha(tokens.surface, 0.8),
        boxShadow: `0 10px 26px ${alpha(tokens.primaryDark, 0.14)}`,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: alpha(tokens.paper, 0.88),
        color: tokens.text,
        backdropFilter: 'blur(8px)',
        boxShadow: 'none',
        borderBottom: 'none',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 600,
        borderRadius: 10,
        backdropFilter: 'blur(4px)',
      },
      outlined: {
        border: 'none',
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: 3,
        borderRadius: 999,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 700,
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        backgroundColor: alpha(tokens.surface, 0.42),
        transition: 'box-shadow 160ms ease, border-color 160ms ease',
        '&.Mui-focused': {
          boxShadow: `0 0 0 3px ${alpha(tokens.ring, 0.22)}`,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'transparent',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: 'transparent',
        },
      },
      notchedOutline: {
        borderColor: 'transparent',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        fontWeight: 700,
        letterSpacing: 0.15,
        color: tokens.text,
        backgroundColor: alpha(tokens.surface, 0.55),
      },
      body: {
        borderBottom: 'none',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: alpha(tokens.primary, 0.06),
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 18,
        border: 'none',
      },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: {
        border: 'none',
        '&.Mui-selected': {
          border: 'none',
        },
      },
    },
  },
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: {
        border: 'none',
      },
      grouped: {
        border: 'none',
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: 'transparent',
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 10,
        fontSize: 12,
        backgroundColor: alpha(tokens.primaryDark, 0.94),
      },
    },
  },
})

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: lightTokens.primary,
      dark: lightTokens.primaryDark,
      contrastText: lightTokens.onPrimary,
    },
    secondary: {
      main: lightTokens.secondary,
      dark: lightTokens.secondaryDark,
      contrastText: lightTokens.onSecondary,
    },
    success: {
      main: lightTokens.success,
    },
    warning: {
      main: lightTokens.warning,
    },
    error: {
      main: lightTokens.error,
    },
    info: {
      main: lightTokens.info,
    },
    background: {
      default: lightTokens.bg,
      paper: lightTokens.paper,
    },
    text: {
      primary: lightTokens.text,
      secondary: lightTokens.textMuted,
      disabled: alpha(lightTokens.textMuted, 0.7),
    },
    divider: lightTokens.border,
    action: {
      hover: alpha(lightTokens.primary, 0.08),
      selected: alpha(lightTokens.primary, 0.14),
      focus: alpha(lightTokens.primary, 0.2),
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily,
    h1: { fontWeight: 800, letterSpacing: -0.7, lineHeight: 1.08 },
    h2: { fontWeight: 800, letterSpacing: -0.55, lineHeight: 1.12 },
    h3: { fontWeight: 780, letterSpacing: -0.42, lineHeight: 1.14 },
    h4: { fontWeight: 760, letterSpacing: -0.3, lineHeight: 1.18 },
    h5: { fontWeight: 750, letterSpacing: -0.2, lineHeight: 1.2 },
    h6: { fontWeight: 730, letterSpacing: -0.12, lineHeight: 1.24 },
    subtitle1: { fontWeight: 600, letterSpacing: -0.08 },
    body1: { lineHeight: 1.56 },
    body2: { lineHeight: 1.5 },
    button: { fontWeight: 700 },
  },
  components: baseComponents(lightTokens),
})

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: darkTokens.primary,
      dark: darkTokens.primaryDark,
      contrastText: darkTokens.onPrimary,
    },
    secondary: {
      main: darkTokens.secondary,
      dark: darkTokens.secondaryDark,
      contrastText: darkTokens.onSecondary,
    },
    success: {
      main: darkTokens.success,
    },
    warning: {
      main: darkTokens.warning,
    },
    error: {
      main: darkTokens.error,
    },
    info: {
      main: darkTokens.info,
    },
    background: {
      default: darkTokens.bg,
      paper: darkTokens.paper,
    },
    text: {
      primary: darkTokens.text,
      secondary: darkTokens.textMuted,
      disabled: alpha(darkTokens.textMuted, 0.75),
    },
    divider: darkTokens.border,
    action: {
      hover: alpha(darkTokens.primary, 0.1),
      selected: alpha(darkTokens.primary, 0.2),
      focus: alpha(darkTokens.primary, 0.26),
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily,
    h1: { fontWeight: 800, letterSpacing: -0.7, lineHeight: 1.08 },
    h2: { fontWeight: 800, letterSpacing: -0.55, lineHeight: 1.12 },
    h3: { fontWeight: 780, letterSpacing: -0.42, lineHeight: 1.14 },
    h4: { fontWeight: 760, letterSpacing: -0.3, lineHeight: 1.18 },
    h5: { fontWeight: 750, letterSpacing: -0.2, lineHeight: 1.2 },
    h6: { fontWeight: 730, letterSpacing: -0.12, lineHeight: 1.24 },
    subtitle1: { fontWeight: 600, letterSpacing: -0.08 },
    body1: { lineHeight: 1.56 },
    body2: { lineHeight: 1.5 },
    button: { fontWeight: 700 },
  },
  components: baseComponents(darkTokens),
})

export default darkTheme
