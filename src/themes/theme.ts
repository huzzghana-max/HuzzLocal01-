import { alpha, createTheme } from '@mui/material/styles'

const fontFamily = '"Manrope", "Plus Jakarta Sans", "Avenir Next", "Segoe UI", sans-serif'

const lightTokens = {
  primary: '#145A45',
  primaryDark: '#0F4333',
  onPrimary: '#F8FCFA',
  secondary: '#D08A1B',
  onSecondary: '#1E1A12',
  bg: '#F4F7F9',
  paper: '#FFFFFF',
  text: '#142420',
  textMuted: '#5B6A65',
  border: '#D8E2DE',
  shadow: '0 12px 34px rgba(16, 45, 34, 0.12)',
  success: '#1D9D66',
  warning: '#D8891A',
  error: '#CC4242',
  info: '#1E7FA8',
}

const darkTokens = {
  primary: '#7CE2BE',
  primaryDark: '#56C99E',
  onPrimary: '#0C1815',
  secondary: '#F4BD62',
  onSecondary: '#1B150A',
  bg: '#0C1815',
  paper: '#14241E',
  text: '#EAF4F0',
  textMuted: '#A1B6AC',
  border: '#2E463C',
  shadow: '0 14px 36px rgba(0, 0, 0, 0.42)',
  success: '#44CC8A',
  warning: '#F2B64E',
  error: '#F27474',
  info: '#67BCE1',
}

const baseComponents = (tokens: typeof lightTokens) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        fontFamily,
        background:
          `radial-gradient(circle at 14% -8%, ${alpha(tokens.primary, 0.16)} 0%, transparent 40%),` +
          `radial-gradient(circle at 90% 0%, ${alpha(tokens.secondary, 0.12)} 0%, transparent 34%),` +
          `radial-gradient(circle at 45% 120%, ${alpha(tokens.primaryDark, 0.09)} 0%, transparent 46%),` +
          tokens.bg,
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
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderRadius: 14,
        border: `1px solid ${alpha(tokens.border, 0.8)}`,
        boxShadow: tokens.shadow,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 14,
        border: `1px solid ${alpha(tokens.border, 0.85)}`,
        boxShadow: tokens.shadow,
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
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily,
    h1: { fontWeight: 800, letterSpacing: -0.6 },
    h2: { fontWeight: 800, letterSpacing: -0.5 },
    h3: { fontWeight: 800, letterSpacing: -0.4 },
    h4: { fontWeight: 800, letterSpacing: -0.3 },
    h5: { fontWeight: 750, letterSpacing: -0.2 },
    h6: { fontWeight: 750, letterSpacing: -0.1 },
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
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily,
    h1: { fontWeight: 800, letterSpacing: -0.6 },
    h2: { fontWeight: 800, letterSpacing: -0.5 },
    h3: { fontWeight: 800, letterSpacing: -0.4 },
    h4: { fontWeight: 800, letterSpacing: -0.3 },
    h5: { fontWeight: 750, letterSpacing: -0.2 },
    h6: { fontWeight: 750, letterSpacing: -0.1 },
    button: { fontWeight: 700 },
  },
  components: baseComponents(darkTokens),
})

export default darkTheme
