import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router';
import {
  Box, Button, Container, TextField, Typography, Paper, Alert, Link,
  Step, Stepper, StepLabel, Grid, MenuItem, Select, FormControl,
  InputLabel, InputAdornment, IconButton, FormHelperText, Stack, Chip,
  LinearProgress,
} from '@mui/material';
import BrandLogo from '../components/BrandLogo';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  validateEmail, validatePassword, validateMobile,
  validateNID, validateAge, validateRequired,
} from '../utils/validators';
import { createUser, getUsers, generatePin } from '../utils/localStorageDB';

const STEPS = ['Personal Information', 'Account Created'];

interface FormData {
  name: string;
  fatherName: string;
  motherName: string;
  nidNumber: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
}


function getPasswordStrength(password: string): { score: number; label: string; color: 'error' | 'warning' | 'success' } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors: ('error' | 'warning' | 'success')[] = ['error', 'error', 'warning', 'warning', 'success', 'success'];
  return { score, label: labels[score], color: colors[score] };
}
export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [createdAccountNumber, setCreatedAccountNumber] = useState('');
  const [createdPin, setCreatedPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [globalError, setGlobalError] = useState('');
  const [form, setForm] = useState<FormData>({
    name: '', fatherName: '', motherName: '', nidNumber: '', dob: '',
    gender: '', mobile: '', email: '', password: '', confirmPassword: ''
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
    errs.name = validateRequired(form.name, 'Full name') ?? undefined;
    errs.fatherName = validateRequired(form.fatherName, "Father's name") ?? undefined;
    errs.motherName = validateRequired(form.motherName, "Mother's name") ?? undefined;
    errs.nidNumber = validateNID(form.nidNumber) ?? undefined;
    errs.dob = validateAge(form.dob) ?? undefined;
    errs.gender = validateRequired(form.gender, 'Gender') ?? undefined;
    errs.mobile = validateMobile(form.mobile) ?? undefined;
    errs.email = validateEmail(form.email) ?? undefined;
    errs.password = validatePassword(form.password) ?? undefined;
    if (!errs.password && form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';

    const cleaned = Object.fromEntries(Object.entries(errs).filter(([, v]) => v));
    setErrors(cleaned);
    if (Object.keys(cleaned).length > 0) return false;

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === form.email.toLowerCase())) {
      setGlobalError('Email already registered');
      return false;
    }
    if (users.some(u => u.mobile === form.mobile)) {
      setGlobalError('Mobile number already registered');
      return false;
    }
    if (users.some(u => u.nidNumber === form.nidNumber)) {
      setGlobalError('NID number already registered');
      return false;
    }
    setGlobalError('');
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const autoPin = generatePin();
    const user = createUser({
      name: form.name,
      fatherName: form.fatherName,
      motherName: form.motherName,
      nidNumber: form.nidNumber,
      dob: form.dob,
      gender: form.gender,
      mobile: form.mobile,
      email: form.email,
      password: form.password,
      pin: autoPin,
      accountType: 'Savings',
      balance: 0,
      role: 'user',
    });
    setCreatedAccountNumber(user.accountNumber);
    setCreatedPin(autoPin);
    setStep(1);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(createdPin).catch(() => {});
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2000);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="sm">
        <Box textAlign="center" mb={4} mt={3}>
          <BrandLogo variant="auth" clickable height={110} />
        </Box>

        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>

        <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          {globalError && <Alert severity="error" sx={{ mb: 2 }}>{globalError}</Alert>}

          {step === 0 && (
            <Box>
              <Typography variant="h6" fontWeight={600} mb={3}>Personal Information</Typography>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField fullWidth label="Full Name" value={form.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} required />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Father's Name" value={form.fatherName} onChange={set('fatherName')} error={!!errors.fatherName} helperText={errors.fatherName} required />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Mother's Name" value={form.motherName} onChange={set('motherName')} error={!!errors.motherName} helperText={errors.motherName} required />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="NID Number" value={form.nidNumber} onChange={set('nidNumber')} error={!!errors.nidNumber} helperText={errors.nidNumber} required inputProps={{ inputMode: 'numeric' }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Date of Birth" type="date" value={form.dob} onChange={set('dob')} error={!!errors.dob} helperText={errors.dob} required InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={!!errors.gender} required>
                    <InputLabel>Gender</InputLabel>
                    <Select value={form.gender} label="Gender" onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                    {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Mobile Number" value={form.mobile} onChange={set('mobile')} error={!!errors.mobile} helperText={errors.mobile} required placeholder="01XXXXXXXXX" inputProps={{ inputMode: 'numeric' }} />
                </Grid>
                <Grid size={12}>
                  <TextField fullWidth label="Email Address" type="email" value={form.email} onChange={set('email')} error={!!errors.email} helperText={errors.email} required />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={set('password')}
                    error={!!errors.password} helperText={errors.password} required
                    InputProps={{ endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )}}
                  />
                  {form.password && (
                    <Box sx={{ mt: 0.5 }}>
                      <LinearProgress variant="determinate" value={(getPasswordStrength(form.password).score / 5) * 100} color={getPasswordStrength(form.password).color} sx={{ height: 6, borderRadius: 3 }} />
                      <Typography variant="caption" color={getPasswordStrength(form.password).color + '.main'} fontWeight={600}>
                        {getPasswordStrength(form.password).label}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Confirm Password" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword} required />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3, mb: 2 }}>
                A secure 6-digit PIN will be automatically generated for your account upon submission.
              </Alert>

              <Button variant="contained" fullWidth size="large" onClick={handleSubmit}>
                Create Account
              </Button>
              <Box mt={2} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link component={RouterLink} to="/login" color="primary" fontWeight={600}>Sign In</Link>
                </Typography>
              </Box>
            </Box>
          )}

          {step === 1 && (
            <Box textAlign="center" py={2}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>Account Created!</Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                Your account is pending authority approval. You will be notified once activated.
              </Typography>

              {/* Account Number */}
              <Paper sx={{ bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.main', p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" mb={0.5}>Your Account Number</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.dark" letterSpacing={2} mb={1}>
                  {createdAccountNumber}
                </Typography>
                <Chip label="Pending Approval" color="warning" size="small" />
              </Paper>

              {/* Auto-generated PIN */}
              <Paper sx={{ bgcolor: 'warning.50', border: '2px solid', borderColor: 'warning.main', p: 3, mb: 3, borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
                  <LockIcon color="warning" />
                  <Typography variant="subtitle2" fontWeight={700} color="warning.dark">Your Auto-Generated PIN</Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900} letterSpacing={8} color="warning.dark" mb={1}>
                  {createdPin}
                </Typography>
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyPin}
                  sx={{ mb: 1 }}
                >
                  {pinCopied ? 'Copied!' : 'Copy PIN'}
                </Button>
                <Alert severity="warning" sx={{ textAlign: 'left', mt: 1 }}>
                  <strong>Save this PIN now!</strong> It will not be shown again. You can change it after logging in from Profile Settings.
                </Alert>
              </Paper>

              <Button variant="contained" fullWidth size="large" onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
