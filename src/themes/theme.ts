import { createTheme } from '@mui/material/styles';

// --- Forest Green & Mint Palette ---
// Core Colors
const deepForest = '#0E3B26';    // Primary Buttons, Headers
const emeraldGreen = '#1B5E3C';  // Active States, Success
const softMint = '#B8E3C5';      // Secondary Accents, Progress Bars
const alertOrange = '#F5A623';   // Pending Status, Notifications
const cleanWhite = '#FFFFFF';    // Card Backgrounds
const subtleGray = '#F4F7F6';    // App Background

// Light Mode
const lightBG = '#F4F7F6';
const lightSurface = '#FFFFFF';
const lightTextPrimary = '#1A1C1E';
const lightTextSecondary = '#6B7280';
const lightPrimary = deepForest;
const lightAccent = softMint;

// Dark Mode
const darkBG = '#091A12';
const darkSurface = '#122A1F';
const darkTextPrimary = '#E2E8F0';
const darkTextSecondary = '#94A3B8';
const darkPrimary = softMint;  // Mint for visibility on dark
const darkAccent = emeraldGreen;

const shadowLight = '0 4px 24px 0 rgba(14,59,38,0.10), 0 1.5px 4px 0 rgba(14,59,38,0.04)';
const shadowDark = '0 4px 24px 0 rgba(0,0,0,0.38), 0 1.5px 4px 0 rgba(0,0,0,0.10)';

// --- Light Theme ---
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: lightPrimary,
      contrastText: cleanWhite,
    },
    secondary: {
      main: alertOrange,
      contrastText: cleanWhite,
    },
    background: {
      default: lightBG,
      paper: lightSurface,
    },
    text: {
      primary: lightTextPrimary,
      secondary: lightTextSecondary,
      disabled: lightTextSecondary,
    },
    divider: subtleGray,
  },
  shape: { borderRadius: 18 },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          background: lightPrimary,
          color: cleanWhite,
          fontWeight: 600,
          borderRadius: '24px',
          boxShadow: shadowLight,
          padding: '12px 32px',
          textTransform: 'none',
          letterSpacing: 0.5,
          border: 'none',
          transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
          '&:hover': {
            background: emeraldGreen,
            color: cleanWhite,
            boxShadow: shadowLight,
            filter: 'brightness(0.95)',
          },
          '&:focus-visible': {
            outline: `2px solid ${alertOrange}`,
            outlineOffset: '2px',
          },
        },
        outlined: {
          background: 'transparent',
          color: lightPrimary,
          border: `2px solid ${lightPrimary}`,
          fontWeight: 600,
          borderRadius: '24px',
          boxShadow: 'none',
          padding: '12px 32px',
          textTransform: 'none',
          letterSpacing: 0.5,
          transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
          '&:hover': {
            background: 'rgba(14,59,38,0.08)',
            color: lightPrimary,
            boxShadow: shadowLight,
            borderColor: alertOrange,
          },
          '&:focus-visible': {
            outline: `2px solid ${alertOrange}`,
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: cleanWhite,
          color: lightTextPrimary,
          boxShadow: shadowLight,
          borderBottom: `1px solid ${subtleGray}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '18px',
          boxShadow: shadowLight,
        },
      },
    },
  },
});

// --- Dark Theme ---
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: darkPrimary,  // Mint for visibility on dark background
      contrastText: darkBG,
    },
    secondary: {
      main: alertOrange,
      contrastText: darkBG,
    },
    background: {
      default: darkBG,
      paper: darkSurface,
    },
    text: {
      primary: darkTextPrimary,
      secondary: darkTextSecondary,
      disabled: darkTextSecondary,
    },
    divider: darkAccent,
  },
  shape: { borderRadius: 18 },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          background: darkPrimary,  // Mint primary in dark mode
          color: darkBG,
          fontWeight: 600,
          borderRadius: '24px',
          boxShadow: shadowDark,
          padding: '12px 32px',
          textTransform: 'none',
          letterSpacing: 0.5,
          border: 'none',
          transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
          '&:hover': {
            background: softMint,
            color: darkBG,
            boxShadow: shadowDark,
            filter: 'brightness(0.95)',
          },
          '&:focus-visible': {
            outline: `2px solid ${alertOrange}`,
            outlineOffset: '2px',
          },
        },
        outlined: {
          background: 'transparent',
          color: darkPrimary,
          border: `2px solid ${darkPrimary}`,
          fontWeight: 600,
          borderRadius: '24px',
          boxShadow: 'none',
          padding: '12px 32px',
          textTransform: 'none',
          letterSpacing: 0.5,
          transition: 'all 0.18s cubic-bezier(.4,0,.2,1)',
          '&:hover': {
            background: 'rgba(184,227,197,0.13)',
            color: darkPrimary,
            boxShadow: shadowDark,
            borderColor: alertOrange,
          },
          '&:focus-visible': {
            outline: `2px solid ${alertOrange}`,
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: darkBG,
          color: darkTextPrimary,
          boxShadow: shadowDark,
          borderBottom: `1px solid ${darkAccent}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '18px',
          boxShadow: shadowDark,
        },
      },
    },
  },
});

export default darkTheme;
