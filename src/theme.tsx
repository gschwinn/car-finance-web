import type { ReactNode } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#38bdf8',        // accent
      light: '#7dd3fc',       // accent-hover
      dark: '#0c4a6e',        // accent-muted
      contrastText: '#0a0f1a',
    },
    secondary: {
      main: '#a78bfa',        // violet-400
      light: '#c4b5fd',       // violet-300
      dark: '#7c3aed',        // violet-600
      contrastText: '#0a0f1a',
    },
    error: {
      main: '#f87171',        // danger
    },
    success: {
      main: '#4ade80',
    },
    warning: {
      main: '#fb923c',
    },
    background: {
      default: '#0a0f1a',     // surface-900
      paper: '#0f172a',       // surface-800
    },
    text: {
      primary: '#f1f5f9',     // slate-100
      secondary: '#94a3b8',   // slate-400
      disabled: '#64748b',    // slate-500
    },
    divider: '#334155',       // surface-600
  },
  typography: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,         // matches rounded-xl (0.75rem)
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        a: {
          textDecoration: 'none',
          '&:hover': { textDecoration: 'none' },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          '&:hover': { textDecoration: 'none' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: '#334155', // surface-600
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b', // surface-700
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#334155',   // surface-600
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#334155',     // surface-600
        },
      },
    },
  },
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => (
  <MUIThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </MUIThemeProvider>
);
