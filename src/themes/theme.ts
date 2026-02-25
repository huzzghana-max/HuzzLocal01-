import { alpha, createTheme } from '@mui/material/styles'

const fontFamily = '"Manrope", "Plus Jakarta Sans", "Avenir Next", "Segoe UI", sans-serif'

const lightTokens = {
  primary: '#3E8B20',
  primaryDark: '#1F2D18',
  onPrimary: '#F8F8F8',
  secondary: '#5DD62C',
  onSecondary: '#0F0F0F',
  bg: '#F3F6F4',
  paper: '#FFFFFF',
  surface: '#ECF3EE',
  text: '#101A13',
  textMuted: '#4C5A52',
  border: '#CFD9D3',
  ring: '#5DD62C',
  shadow: '0 14px 36px rgba(16, 26, 19, 0.12)',
  success: '#5DD62C',
  warning: '#B48416',
  error: '#CC4242',
  info: '#2E7FA3',
}

const darkTokens = {
  primary: '#6BE238',
  primaryDark: '#3E8B20',
  onPrimary: '#0F0F0F',
  secondary: '#C8D7CE',
  onSecondary: '#0F0F0F',
  bg: '#0F0F0F',
  paper: '#202020',
  surface: '#171B18',
  text: '#F2F6F3',
  textMuted: '#B2C0B8',
  border: '#314937',
  ring: '#6BE238',
  shadow: '0 14px 36px rgba(0, 0, 0, 0.42)',
  success: '#5DD62C',
  warning: '#E1A93B',
  error: '#F27474',
  info: '#67BCE1',
}

const baseComponents = (tokens: typeof lightTokens) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        fontFamily,
        background:
          `radial-gradient(circle at 14% -8%, ${alpha(tokens.primary, 0.2)} 0%, transparent 40%),` +
          `radial-gradient(circle at 92% 2%, ${alpha(tokens.secondary, 0.14)} 0%, transparent 34%),` +
          `radial-gradient(circle at 45% 120%, ${alpha(tokens.primaryDark, 0.12)} 0%, transparent 46%),` +
          tokens.bg,
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
        background: `linear-gradient(135deg, ${tokens.primary} 0%, ${tokens.primaryDark} 100%)`,
        color: tokens.onPrimary,
        boxShadow: tokens.shadow,
        padding: '10px 20px',
        '&:hover': {
          background: `linear-gradient(135deg, ${tokens.primaryDark} 0%, ${tokens.primary} 100%)`,
          boxShadow: tokens.shadow,
          transform: 'translateY(-1px)',
        },
      },
      containedSecondary: {
        color: tokens.onSecondary,
      },
      outlined: {
        border: `1px solid ${alpha(tokens.primary, 0.35)}`,
        color: tokens.primary,
        padding: '10px 20px',
        '&:hover': {
          backgroundColor: alpha(tokens.primary, 0.08),
          borderColor: tokens.primary,
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
        border: `1px solid ${alpha(tokens.border, 0.8)}`,
        boxShadow: `0 8px 28px ${alpha(tokens.primaryDark, 0.12)}`,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 14,
        border: `1px solid ${alpha(tokens.border, 0.85)}`,
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
        borderBottom: `1px solid ${alpha(tokens.border, 0.9)}`,
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
      },
      notchedOutline: {
        borderColor: alpha(tokens.border, 0.95),
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
        borderBottom: `1px solid ${alpha(tokens.border, 0.65)}`,
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
        border: `1px solid ${alpha(tokens.border, 0.85)}`,
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: alpha(tokens.border, 0.72),
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
