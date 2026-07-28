import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router';
import {
  Box, Button, TextField, Typography, Paper, Alert, Link,
  InputAdornment, IconButton, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Stack,
  Checkbox, FormControlLabel, CircularProgress, Divider, Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Lock, ArrowRight, Eye, EyeOff, User, BadgeCheck,
  Monitor, MapPin,
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { getUserByEmail, getUserByAccount, updateUser } from '../utils/localStorageDB';

const REMEMBER_KEY = 'sb_remember_email';

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = 'Unknown Device';
  if (/Windows/.test(ua)) device = 'Windows PC';
  else if (/Mac/.test(ua)) device = 'Mac';
  else if (/Linux/.test(ua)) device = 'Linux';
  else if (/Android/.test(ua)) device = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) device = 'iOS Device';
  return device;
}
function getLocationInfo() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown Location';
}


export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) || '');
  const [password, setPassword] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [remember, setRemember] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'reset'>('email');
  const [verifyCode, setVerifyCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('');
  const [locationInfo, setLocationInfo] = useState('');

  const redirectByRole = (role: string) => {
    navigate(role === 'admin' ? '/admin' : role === 'employee' ? '/employee' : '/dashboard');
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = getUserByEmail(email);
      if (!user || user.password !== password) setError('Invalid email or password. Please try again.');
      else if (!user.isActive) setError('Your account has been deactivated. Please contact your administrator.');
      else if (!user.isApproved && user.role === 'user') setError('Your account is pending authority approval. Please wait for activation.');
      else {
        if (remember) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);
        setDeviceInfo(getDeviceInfo());
        setLocationInfo(getLocationInfo());
        login(user);
        redirectByRole(user.role);
      }
      setLoading(false);
    }, 700);
  };

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = getUserByAccount(accountNumber);
      if (!user || user.pin !== pin) setError('Invalid account number or PIN. Please try again.');
      else if (!user.isActive) setError('Your account has been deactivated. Please contact your administrator.');
      else if (!user.isApproved && user.role === 'user') setError('Your account is pending authority approval. Please wait for activation.');
      else {
        setDeviceInfo(getDeviceInfo());
        setLocationInfo(getLocationInfo());
        login(user);
        redirectByRole(user.role);
      }
      setLoading(false);
    }, 700);
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      bgcolor: 'background.default',
    }}>
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          <Box textAlign="center" mb={4} mt={3}>
            <BrandLogo variant="auth" clickable height={110} />
          </Box>

          <Paper elevation={0} sx={{
            p: 4, borderRadius: 4,
            border: '1px solid', borderColor: 'divider',
            bgcolor: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(146,109,19,0.10)',
          }}>
            <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(''); }} variant="fullWidth" sx={{ mb: 3 }}>
              <Tab icon={<User size={16} />} iconPosition="start" label="Email" />
              <Tab icon={<BadgeCheck size={16} />} iconPosition="start" label="Account & PIN" />
            </Tabs>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
            {(deviceInfo || locationInfo) && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }} icon={<Monitor size={18} />}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Typography variant="body2"><strong>Device:</strong> {deviceInfo}</Typography>
                  <Typography variant="body2"><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /><strong>Location:</strong> {locationInfo}</Typography>
                </Stack>
              </Alert>
            )}

            {tab === 0 ? (
              <Box component="form" onSubmit={handleEmailLogin}>
                <TextField fullWidth label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} sx={{ mb: 2 }} required autoFocus />
                <TextField
                  fullWidth label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)} sx={{ mb: 1.5 }} required
                  InputProps={{ endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" aria-label="toggle password visibility">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  )}}
                />
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={<Checkbox checked={remember} onChange={e => setRemember(e.target.checked)} size="small" />}
                    label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
                  />
                  <Link component="button" type="button" onClick={() => { setForgotOpen(true); setForgotStep('email'); setForgotMsg(''); setForgotError(''); }} color="primary" fontWeight={600} variant="body2">
                    Forgot Password?
                  </Link>
                </Stack>
                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
                  endIcon={loading ? undefined : <ArrowRight size={20} />}
                  sx={{ minHeight: 52 }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handlePinLogin}>
                <TextField fullWidth label="Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} sx={{ mb: 2 }} required placeholder="1234567890" inputProps={{ inputMode: 'numeric' }} autoFocus />
                <TextField
                  fullWidth label="PIN"
                  type={showPin ? 'text' : 'password'}
                  value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  sx={{ mb: 1.5 }} required
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                  InputProps={{ endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPin(!showPin)} edge="end" aria-label="toggle pin visibility">
                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  )}}
                />
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={<Checkbox checked={remember} onChange={e => setRemember(e.target.checked)} size="small" />}
                    label={<Typography variant="body2" color="text.secondary">Remember this device</Typography>}
                  />
                  <Link component="button" type="button" onClick={() => { setForgotOpen(true); setForgotStep('email'); setForgotMsg(''); setForgotError(''); }} color="primary" fontWeight={600} variant="body2">
                    Forgot PIN?
                  </Link>
                </Stack>
                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
                  endIcon={loading ? undefined : <ArrowRight size={20} />}
                  sx={{ minHeight: 52 }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In with PIN'}
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 2.5 }}>
              <Chip label="Secure Login" size="small" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500 }} />
            </Divider>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/signup" color="primary" fontWeight={600}>Open Account</Link>
              </Typography>
            </Box>
          </Paper>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 3 }}>
            <Lock size={14} color="#94A3B8" />
            <Typography variant="caption" color="text.secondary">
              Protected by Smart Bank Security · 256-bit encryption
            </Typography>
          </Stack>
        </motion.div>
      </Box>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, mt: 1 }}>
              <BrandLogo variant="navbar" height={40} clickable={false} />
            </Box>
            Reset Password
          </DialogTitle>
          <DialogContent>
            {forgotMsg && <Alert severity="info" sx={{ mb: 2 }}>{forgotMsg}</Alert>}
            {forgotError && <Alert severity="error" sx={{ mb: 2 }}>{forgotError}</Alert>}
            {forgotStep === 'email' && (
              <TextField fullWidth label="Email Address" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} sx={{ mt: 1 }} autoFocus />
            )}
            {forgotStep === 'code' && (
              <TextField fullWidth label="Verification Code" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} sx={{ mt: 1 }} helperText="Check your email for the 6-digit code" inputProps={{ inputMode: 'numeric' }} autoFocus />
            )}
            {forgotStep === 'reset' && (
              <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} sx={{ mt: 1 }} helperText="At least 6 characters" autoFocus />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setForgotOpen(false)}>Cancel</Button>
            {forgotStep === 'email' && (
              <Button variant="contained" onClick={() => {
                const u = getUserByEmail(forgotEmail);
                if (!u) { setForgotError('No account found with this email.'); return; }
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                localStorage.setItem('smart_reset_' + forgotEmail, JSON.stringify({ code, expires: Date.now() + 10 * 60 * 1000 }));
                setForgotError('');
                setForgotMsg('Verification code sent to your email. (Demo: code is ' + code + ')');
                setForgotStep('code');
              }}>Send Code</Button>
            )}
            {forgotStep === 'code' && (
              <Button variant="contained" onClick={() => {
                const stored = localStorage.getItem('smart_reset_' + forgotEmail);
                if (!stored) { setForgotError('No reset request found.'); return; }
                const data = JSON.parse(stored);
                if (Date.now() > data.expires) { setForgotError('Code expired. Please request a new one.'); return; }
                if (verifyCode !== data.code) { setForgotError('Invalid verification code.'); return; }
                setForgotError('');
                setForgotMsg('Code verified. Set your new password.');
                setForgotStep('reset');
              }}>Verify</Button>
            )}
            {forgotStep === 'reset' && (
              <Button variant="contained" onClick={() => {
                if (newPassword.length < 6) { setForgotError('Password must be at least 6 characters.'); return; }
                const u = getUserByEmail(forgotEmail);
                if (u) { updateUser(u.id, { password: newPassword }); }
                localStorage.removeItem('smart_reset_' + forgotEmail);
                setForgotError('');
                setForgotMsg('Password reset successfully! Please log in.');
                setTimeout(() => { setForgotOpen(false); setForgotEmail(''); setVerifyCode(''); setNewPassword(''); }, 1500);
              }}>Reset Password</Button>
            )}
          </DialogActions>
        </Dialog>
    </Box>
  );
}
