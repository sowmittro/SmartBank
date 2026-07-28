import { createContext, useContext, useState, type ReactNode } from 'react';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BANK_COLORS } from '../theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({ mode: 'light', toggleMode: () => {}, setMode: () => {} });

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeMode() {
  return useContext(ThemeContext);
}

function buildTheme(mode: ThemeMode) {
  const isLight = mode === 'light';

  const base = createTheme({
    palette: {
      mode,
      primary: {
        main: isLight ? BANK_COLORS.primary : '#1B6CA8',
        light: isLight ? BANK_COLORS.primaryLight : '#3A8FD0',
        dark: isLight ? BANK_COLORS.primaryDark : '#0F4C81',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: isLight ? BANK_COLORS.secondary : '#4CAF50',
        light: isLight ? BANK_COLORS.secondaryLight : '#81C784',
        dark: isLight ? BANK_COLORS.secondaryDark : '#2E7D32',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isLight ? BANK_COLORS.bg : '#0F172A',
        paper: isLight ? BANK_COLORS.surface : '#1E293B',
      },
      text: {
        primary: isLight ? BANK_COLORS.textPrimary : '#F1F5F9',
        secondary: isLight ? BANK_COLORS.textSecondary : '#94A3B8',
      },
      divider: isLight ? BANK_COLORS.border : '#334155',
      success: { main: BANK_COLORS.success, contrastText: '#FFFFFF' },
      warning: { main: BANK_COLORS.warning, contrastText: '#FFFFFF' },
      error: { main: BANK_COLORS.danger, contrastText: '#FFFFFF' },
      info: { main: BANK_COLORS.info, contrastText: '#FFFFFF' },
    },
    typography: {
      fontFamily: '"Inter", "Poppins", "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: { fontWeight: 700, letterSpacing: -0.5, fontFamily: '"Poppins", "Inter", sans-serif' },
      h2: { fontWeight: 700, letterSpacing: -0.3, fontFamily: '"Poppins", "Inter", sans-serif' },
      h3: { fontWeight: 700, letterSpacing: -0.2, fontFamily: '"Poppins", "Inter", sans-serif' },
      h4: { fontWeight: 700, fontFamily: '"Poppins", "Inter", sans-serif' },
      h5: { fontWeight: 600, fontFamily: '"Poppins", "Inter", sans-serif' },
      h6: { fontWeight: 600, fontFamily: '"Poppins", "Inter", sans-serif' },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 600 },
      body1: { fontWeight: 400 },
      body2: { fontWeight: 400 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: isLight ? BANK_COLORS.bg : '#0F172A' },
          '*::-webkit-scrollbar': { width: 6, height: 6 },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': { background: isLight ? '#E8D48A' : '#475569', borderRadius: 4 },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 12, paddingInline: 20, paddingBlock: 10, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' },
          sizeLarge: { paddingInline: 28, paddingBlock: 14, fontSize: '1rem', borderRadius: 14 },
          containedPrimary: {
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(15,76,129,0.30)' },
          },
          containedSecondary: {
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(46,125,50,0.30)' },
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 18,
            backgroundColor: isLight ? BANK_COLORS.surface : '#1E293B',
            border: `1px solid ${isLight ? BANK_COLORS.border : '#334155'}`,
            boxShadow: isLight ? '0 2px 10px rgba(146,109,19,0.06)' : 'none',
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? BANK_COLORS.surface : '#1E293B',
            color: isLight ? BANK_COLORS.textPrimary : '#F1F5F9',
            borderBottom: `1px solid ${isLight ? BANK_COLORS.border : '#334155'}`,
            boxShadow: isLight ? '0 1px 4px rgba(146,109,19,0.05)' : '0 1px 3px rgba(0,0,0,0.2)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundColor: BANK_COLORS.primary, borderRight: 'none', color: '#CBD5E1' },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: '3px 10px',
            color: '#CBD5E1',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
            '&.Mui-selected': {
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
              '& .MuiListItemIcon-root': { color: '#FFFFFF' },
            },
            '&.Mui-selected:hover': { backgroundColor: 'rgba(255,255,255,0.16)' },
          },
        },
      },
      MuiListItemIcon: { styleOverrides: { root: { color: 'inherit', minWidth: 40 } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? BANK_COLORS.surface : '#0F172A',
            borderRadius: 12,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: isLight ? BANK_COLORS.border : '#334155' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: isLight ? BANK_COLORS.textSecondary : '#475569' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BANK_COLORS.primary, borderWidth: 1.5 },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: isLight ? BANK_COLORS.textSecondary : '#94A3B8',
            '&.Mui-focused': { color: BANK_COLORS.primary },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 10 } } },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 48 },
          indicator: { backgroundColor: BANK_COLORS.primary, height: 3, borderRadius: 2 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none', fontWeight: 600, minHeight: 48,
            color: isLight ? BANK_COLORS.textSecondary : '#94A3B8',
            '&.Mui-selected': { color: BANK_COLORS.primary },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableRow-root': { backgroundColor: isLight ? BANK_COLORS.surfaceAlt : '#0F172A' },
            '& .MuiTableCell-root': {
              color: isLight ? BANK_COLORS.textPrimary : '#F1F5F9',
              fontWeight: 700, fontSize: '0.8rem',
              borderBottom: `2px solid ${isLight ? BANK_COLORS.border : '#334155'}`,
            },
          },
        },
      },
      MuiTableCell: { styleOverrides: { root: { borderBottom: `1px solid ${isLight ? BANK_COLORS.border : '#334155'}` } } },
      MuiTableRow: { styleOverrides: { root: { '&:hover': { backgroundColor: isLight ? 'rgba(180,131,20,0.06)' : 'rgba(255,255,255,0.04)' } } } },
      MuiDivider: { styleOverrides: { root: { borderColor: isLight ? BANK_COLORS.border : '#334155' } } },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 18, border: `1px solid ${isLight ? BANK_COLORS.border : '#334155'}` },
        },
      },
      MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiAvatar: { styleOverrides: { root: { fontWeight: 700 } } },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 14, border: `1px solid ${isLight ? BANK_COLORS.border : '#334155'}`,
            boxShadow: isLight ? '0 10px 30px rgba(146,109,19,0.12)' : '0 10px 30px rgba(0,0,0,0.35)', marginTop: 6,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { backgroundColor: BANK_COLORS.navy, fontSize: '0.75rem', borderRadius: 8 } },
      },
    },
  });

  return responsiveFontSizes(base);
}

export function CustomThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('smart_bank_theme');
    return (stored as ThemeMode) || 'light';
  });

  const theme = buildTheme(mode);
  const toggleMode = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, setMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
