import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, IconButton, InputAdornment,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface PinModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  title?: string;
  description?: string;
  error?: string;
}

export default function PinModal({ open, onClose, onConfirm, title = 'Enter PIN', description, error }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const handleConfirm = () => {
    onConfirm(pin);
    setPin('');
  };

  const handleClose = () => {
    setPin('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box sx={{ bgcolor: 'primary.main', borderRadius: 2, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LockIcon sx={{ color: 'white', fontSize: 26 }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {description && (
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
            {description}
          </Typography>
        )}
        <TextField
          fullWidth
          label="PIN"
          type={showPin ? 'text' : 'password'}
          value={pin}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            setPin(val);
          }}
          error={!!error}
          helperText={error}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPin(!showPin)} edge="end">
                  {showPin ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && pin.length >= 4) handleConfirm(); }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={handleClose} fullWidth>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm} fullWidth disabled={pin.length < 4}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
