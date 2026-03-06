export const techTheme = {
  palette: {
    mode: 'dark' as const,
    primary: {
      main: '#007AFF',
      light: '#5AC8FA',
      dark: '#0062CC',
    },
    secondary: {
      main: '#5856D6',
      light: '#7B79E0',
      dark: '#3634A3',
    },
    success: {
      main: '#34C759',
      light: '#5DD27B',
      dark: '#248A3D',
    },
    warning: {
      main: '#FF9500',
      light: '#FFB340',
      dark: '#C93400',
    },
    error: {
      main: '#FF3B30',
      light: '#FF6961',
      dark: '#C0392B',
    },
    background: {
      default: '#000000',
      paper: '#1C1C1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(235,235,245,0.6)',
    },
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: -0.5 },
    h2: { fontWeight: 700, letterSpacing: -0.5 },
    h3: { fontWeight: 600, letterSpacing: -0.3 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#1C1C1E',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 1px 8px rgba(0,0,0,0.4)',
          borderRadius: 16,
          contain: 'content',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px',
          '&:last-child': { paddingBottom: '20px' },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
        },
        bar: {
          borderRadius: '4px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          background: '#007AFF',
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          '&:hover': { background: '#0062CC' },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { background: 'transparent' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          // Hover disabled: prevents hit-test on every pointermove across all table rows
          pointerEvents: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid rgba(255,255,255,0.06)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
  },
};

export const globalStyles = {
  // Lock body/html so the ONLY scrollable surface is the dashboard's own container.
  // This lets the browser compositor-thread the scroll independently from React renders.
  'html, body, #root': {
    margin: 0,
    padding: 0,
    height: '100%',
    overflow: 'hidden',
    background: '#000000',
  },
};
