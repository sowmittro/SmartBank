import { createTheme, responsiveFontSizes } from '@mui/material/styles';

export const BANK_COLORS = {
  primary: '#0F4C81',
  primaryDark: '#0A3A64',
  primaryLight: '#1B6CA8',
  secondary: '#2E7D32',
  secondaryDark: '#1B5E20',
  secondaryLight: '#4CAF50',
  accent: '#00C853',
  warning: '#FFB300',
  warningLight: '#FFE082',
  danger: '#D32F2F',
  dangerLight: '#EF5350',
  bg: '#FFF8E1',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF3C4',
  border: '#F0E2B0',
  textPrimary: '#1E293B',
  textSecondary: '#78716C',
  success: '#00C853',
  info: '#0F4C81',
  purple: '#7C3AED',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  navy: '#0F172A',
};

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: BANK_COLORS.primary,
      light: BANK_COLORS.primaryLight,
      dark: BANK_COLORS.primaryDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: BANK_COLORS.secondary,
      light: BANK_COLORS.secondaryLight,
      dark: BANK_COLORS.secondaryDark,
      contrastText: '#FFFFFF',
    },
    background: {
      default: BANK_COLORS.bg,
      paper: BANK_COLORS.surface,
    },
    text: {
      primary: BANK_COLORS.textPrimary,
      secondary: BANK_COLORS.textSecondary,
    },
    divider: BANK_COLORS.border,
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
  shadows: [
    'none',
    '0 1px 2px rgba(15,76,129,0.04)',
    '0 1px 3px rgba(15,76,129,0.06), 0 1px 2px rgba(15,76,129,0.04)',
    '0 4px 6px -1px rgba(15,76,129,0.06), 0 2px 4px -2px rgba(15,76,129,0.04)',
    '0 6px 10px -2px rgba(15,76,129,0.06), 0 2px 6px -2px rgba(15,76,129,0.04)',
    '0 8px 16px -4px rgba(15,76,129,0.08), 0 4px 8px -4px rgba(15,76,129,0.04)',
    '0 12px 20px -6px rgba(15,76,129,0.08), 0 6px 12px -6px rgba(15,76,129,0.04)',
    '0 16px 28px -8px rgba(15,76,129,0.10), 0 8px 16px -8px rgba(15,76,129,0.04)',
    '0 20px 32px -10px rgba(15,76,129,0.10), 0 10px 20px -10px rgba(15,76,129,0.04)',
    '0 24px 40px -12px rgba(15,76,129,0.12), 0 12px 24px -12px rgba(15,76,129,0.04)',
    '0 32px 48px -16px rgba(15,76,129,0.12), 0 16px 32px -16px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
    '0 40px 56px -20px rgba(15,76,129,0.14), 0 20px 40px -20px rgba(15,76,129,0.04)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: BANK_COLORS.bg },
        '*::-webkit-scrollbar': { width: 6, height: 6 },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': { background: '#E8D48A', borderRadius: 4 },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 12, paddingInline: 20, paddingBlock: 10, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' },
        sizeLarge: { paddingInline: 28, paddingBlock: 14, fontSize: '1rem', borderRadius: 14 },
        containedPrimary: {
          background: `linear-gradient(135deg, ${BANK_COLORS.primary} 0%, ${BANK_COLORS.primaryLight} 100%)`,
          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(15,76,129,0.30)' },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${BANK_COLORS.secondary} 0%, ${BANK_COLORS.secondaryLight} 100%)`,
          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(46,125,50,0.30)' },
        },
        outlinedPrimary: {
          borderColor: BANK_COLORS.primary,
          color: BANK_COLORS.primary,
          '&:hover': { borderColor: BANK_COLORS.primaryDark, backgroundColor: 'rgba(15,76,129,0.06)' },
        },
        outlined: {
          borderColor: BANK_COLORS.border,
          color: BANK_COLORS.textPrimary,
          '&:hover': { borderColor: BANK_COLORS.textSecondary, backgroundColor: 'rgba(15,76,129,0.04)' },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 18,
          backgroundColor: BANK_COLORS.surface,
          border: `1px solid ${BANK_COLORS.border}`,
          boxShadow: '0 2px 8px rgba(15,76,129,0.04)',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: BANK_COLORS.surface,
          color: BANK_COLORS.textPrimary,
          borderBottom: `1px solid ${BANK_COLORS.border}`,
          boxShadow: '0 1px 3px rgba(15,76,129,0.04)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: BANK_COLORS.primary,
          borderRight: 'none',
          color: '#CBD5E1',
        },
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
    MuiListItemIcon: {
      styleOverrides: { root: { color: 'inherit', minWidth: 40 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: BANK_COLORS.surface,
          borderRadius: 12,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: BANK_COLORS.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BANK_COLORS.textSecondary },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BANK_COLORS.primary, borderWidth: 1.5 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: BANK_COLORS.textSecondary,
          '&.Mui-focused': { color: BANK_COLORS.primary },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 48 },
        indicator: { backgroundColor: BANK_COLORS.primary, height: 3, borderRadius: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 48,
          color: BANK_COLORS.textSecondary,
          '&.Mui-selected': { color: BANK_COLORS.primary },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': { backgroundColor: BANK_COLORS.surfaceAlt },
          '& .MuiTableCell-root': {
            color: BANK_COLORS.textPrimary,
            fontWeight: 700,
            fontSize: '0.8rem',
            borderBottom: `2px solid ${BANK_COLORS.border}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderBottom: `1px solid ${BANK_COLORS.border}` } },
    },
    MuiTableRow: {
      styleOverrides: { root: { '&:hover': { backgroundColor: 'rgba(15,76,129,0.03)' } } },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: BANK_COLORS.border } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 18, border: `1px solid ${BANK_COLORS.border}` },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiAvatar: {
      styleOverrides: { root: { fontWeight: 700 } },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: `1px solid ${BANK_COLORS.border}`,
          boxShadow: '0 10px 30px rgba(15,76,129,0.12)',
          marginTop: 6,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: BANK_COLORS.navy, fontSize: '0.75rem', borderRadius: 8 },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
