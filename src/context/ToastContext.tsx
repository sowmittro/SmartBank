import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Snackbar, Slide, type SlideProps, Box, Typography, IconButton, alpha } from '@mui/material';
import { CheckCircle2, X, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

const SEVERITY_CONFIG: Record<ToastSeverity, { icon: ReactNode; color: string; bgColor: string; borderColor: string }> = {
  success: { icon: <CheckCircle2 size={28} />, color: '#16A34A', bgColor: '#F0FDF4', borderColor: '#BBF7D0' },
  error: { icon: <AlertOctagon size={28} />, color: '#DC2626', bgColor: '#FEF2F2', borderColor: '#FECACA' },
  warning: { icon: <AlertTriangle size={28} />, color: '#D97706', bgColor: '#FFFBEB', borderColor: '#FDE68A' },
  info: { icon: <Info size={28} />, color: '#2563EB', bgColor: '#EFF6FF', borderColor: '#BFDBFE' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<ToastSeverity>('success');

  const showToast = useCallback((msg: string, sev: ToastSeverity) => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const showSuccess = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const showError = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const showWarning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);
  const showInfo = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  const handleClose = () => setOpen(false);

  const config = SEVERITY_CONFIG[severity];

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={SlideTransition}
        sx={{
          position: 'fixed',
          top: '50% !important',
          left: '50% !important',
          transform: 'translate(-50%, -50%)',
          '& .MuiSnackbarContent-root': {
            minWidth: 320,
            maxWidth: 420,
            p: 0,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2.5,
            py: 2,
            borderRadius: 3,
            bgcolor: config.bgColor,
            border: '2px solid',
            borderColor: config.borderColor,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            animation: open ? 'toastPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
            '@keyframes toastPop': {
              '0%': { transform: 'scale(0.8)', opacity: 0 },
              '50%': { transform: 'scale(1.03)', opacity: 1 },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: alpha(config.color, 0.12),
              color: config.color,
              flexShrink: 0,
              animation: open && severity === 'success' ? 'iconBounce 0.5s ease-out 0.1s both' : 'none',
              '@keyframes iconBounce': {
                '0%': { transform: 'scale(0) rotate(-180deg)' },
                '60%': { transform: 'scale(1.2) rotate(10deg)' },
                '100%': { transform: 'scale(1) rotate(0deg)' },
              },
            }}
          >
            {config.icon}
          </Box>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: '#1E293B',
              flex: 1,
              lineHeight: 1.4,
            }}
          >
            {message}
          </Typography>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ color: '#94A3B8', p: 0.5, '&:hover': { bgcolor: alpha('#000', 0.04) } }}
          >
            <X size={18} />
          </IconButton>
        </Box>
      </Snackbar>
    </ToastContext.Provider>
  );
}
