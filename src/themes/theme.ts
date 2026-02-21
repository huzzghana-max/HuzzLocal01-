import { alpha, createTheme } from '@mui/material/styles'

const fontFamily = '"Manrope", "Plus Jakarta Sans", "Avenir Next", "Segoe UI", sans-serif'

const lightTokens = {
  primary: '#0E5A3B',
  primaryDark: '#0A422B',
  secondary: '#C97A19',
  bg: '#F3F7F4',
  paper: '#FFFFFF',
  text: '#16211B',
  textMuted: '#5F6F66',
  border: '#DDE8E1',
  shadow: '0 10px 30px rgba(14, 38, 26, 0.10)',
}

const darkTokens = {
  primary: '#7DE2B8',
  primaryDark: '#59C998',
  secondary: '#F3B35B',
  bg: '#0B1712',
  paper: '#12211A',
  text: '#EAF3EE',
  textMuted: '#9DB2A6',
  border: '#2D4338',
  shadow: '0 12px 32px rgba(0, 0, 0, 0.38)',
}

const baseComponents = (tokens: typeof lightTokens) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        fontFamily,
        background:
          `radial-gradient(circle at 18% -10%, ${alpha(tokens.primary, 0.12)} 0%, transparent 42%),` +
          `radial-gradient(circle at 90% 0%, ${alpha(tokens.secondary, 0.1)} 0%, transparent 35%),` +
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
        color: tokens.bg,
        boxShadow: tokens.shadow,
        padding: '10px 20px',
        '&:hover': {
          background: `linear-gradient(135deg, ${tokens.primaryDark} 0%, ${tokens.primary} 100%)`,
          boxShadow: tokens.shadow,
          transform: 'translateY(-1px)',
        },
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
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: lightTokens.secondary,
      contrastText: '#FFFFFF',
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
      contrastText: darkTokens.bg,
    },
    secondary: {
      main: darkTokens.secondary,
      contrastText: darkTokens.bg,
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
