import { defineGlobalStyles } from '@mui/material/styles';

export const techTheme = {
  palette: {
    mode: 'dark' as const,
    primary: {
      main: '#00f0ff',
      light: '#64f4ff',
      dark: '#00a8b3',
    },
    secondary: {
      main: '#ff00ff',
      light: '#ff66ff',
      dark: '#b300b3',
    },
    success: {
      main: '#00ff88',
      light: '#66ffb3',
      dark: '#00b359',
    },
    warning: {
      main: '#ffaa00',
      light: '#ffc84d',
      dark: '#b37700',
    },
    error: {
      main: '#ff3366',
      light: '#ff6688',
      dark: '#b32447',
    },
    background: {
      default: '#0a0a0f',
      paper: '#12121a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#8888aa',
    },
  },
  typography: {
    fontFamily: '"Orbitron", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 600,
    },
    h3: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 500,
    },
    h5: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(0,240,255,0.05) 0%, rgba(255,0,255,0.05) 100%)',
          border: '1px solid rgba(0,240,255,0.2)',
          boxShadow: '0 0 20px rgba(0,240,255,0.1), inset 0 0 20px rgba(0,240,255,0.05)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0,240,255,0.1)',
          borderRadius: '4px',
        },
        bar: {
          backgroundImage: 'linear-gradient(90deg, #00f0ff, #00ff88)',
          borderRadius: '4px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, #00f0ff, #0088ff)',
          border: 'none',
          boxShadow: '0 0 15px rgba(0,240,255,0.4)',
          '&:hover': {
            boxShadow: '0 0 25px rgba(0,240,255,0.6)',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, rgba(0,240,255,0.1), rgba(255,0,255,0.1))',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': {
            backgroundColor: 'rgba(0,240,255,0.02)',
          },
          '&:hover': {
            backgroundColor: 'rgba(0,240,255,0.08)',
          },
        },
      },
    },
  },
};

export const globalStyles = {
  body: {
    margin: 0,
    padding: 0,
    background: 'radial-gradient(ellipse at center, #0a0a0f 0%, #050508 100%)',
    minHeight: '100vh',
  },
  '@keyframes pulse': {
    '0%, 100%': {
      boxShadow: '0 0 20px rgba(0,240,255,0.4)',
    },
    '50%': {
      boxShadow: '0 0 40px rgba(0,240,255,0.8)',
    },
  },
  '@keyframes scanline': {
    '0%': {
      transform: 'translateY(-100%)',
    },
    '100%': {
      transform: 'translateY(100%)',
    },
  },
  '@keyframes glow': {
    '0%, 100%': {
      textShadow: '0 0 10px rgba(0,240,255,0.5), 0 0 20px rgba(0,240,255,0.3)',
    },
    '50%': {
      textShadow: '0 0 20px rgba(0,240,255,0.8), 0 0 30px rgba(0,240,255,0.5)',
    },
  },
};
