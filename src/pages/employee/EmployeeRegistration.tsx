import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Stack, TextField, Typography, Alert, MenuItem, FormControl, InputLabel, Select,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmployeeLayout from '../../components/EmployeeLayout';
import { createUser, getUsers, generatePin, addNotification } from '../../utils/localStorageDB';
import { validateEmail, validatePassword, validateMobile, validateNID, validateAge, validateRequired } from '../../utils/validators';
import { useToast } from '../../context/ToastContext';

export default function EmployeeRegistration() {
  const toast = useToast();
  const [form, setForm] = useState({
    name: '', fatherName: '', motherName: '', nidNumber: '', dob: '', gender: 'Male',
    mobile: '', email: '', password: '', accountType: 'Savings', address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [success, setSuccess] = useState<{ accountNumber: string; pin: string } | null>(null);
  const [pinCopied, setPinCopied] = useState(false);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    const nameErr = validateRequired(form.name, 'Full name'); if (nameErr) errs.name = nameErr;
    const fatherErr = validateRequired(form.fatherName, "Father's name"); if (fatherErr) errs.fatherName = fatherErr;
    const motherErr = validateRequired(form.motherName, "Mother's name"); if (motherErr) errs.motherName = motherErr;
    const nidErr = validateNID(form.nidNumber); if (nidErr) errs.nidNumber = nidErr;
    const ageErr = validateAge(form.dob); if (ageErr) errs.dob = ageErr;
    const mobileErr = validateMobile(form.mobile); if (mobileErr) errs.mobile = mobileErr;
    const emailErr = validateEmail(form.email); if (emailErr) errs.email = emailErr;
    const pwErr = validatePassword(form.password); if (pwErr) errs.password = pwErr;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === form.email.toLowerCase())) { setGlobalError('Email already registered'); return; }
    if (users.some(u => u.mobile === form.mobile)) { setGlobalError('Mobile number already registered'); return; }
    if (users.some(u => u.nidNumber === form.nidNumber)) { setGlobalError('NID number already registered'); return; }
    setGlobalError('');

    const autoPin = generatePin();
    const newUser = createUser({
      name: form.name, fatherName: form.fatherName, motherName: form.motherName,
      nidNumber: form.nidNumber, dob: form.dob, gender: form.gender, mobile: form.mobile,
      email: form.email, password: form.password, pin: autoPin, accountType: form.accountType,
      balance: 0, role: 'user', address: form.address, kycStatus: 'pending',
      isApproved: true,
    });
    addNotification({ accountNumber: newUser.accountNumber, message: 'Welcome to Smart Bank! Your account is now active and ready for banking.', type: 'success' });
    setSuccess({ accountNumber: newUser.accountNumber, pin: autoPin });
    toast.showSuccess('Customer registered successfully!');
  };

  const handleCopyPin = () => {
    if (success) navigator.clipboard.writeText(success.pin).catch(() => {});
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2000);
  };

  return (
    <EmployeeLayout title="Customer Registration">
      <Box>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Customer Registration</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Register a new customer and generate their account credentials.</Typography>

        {success ? (
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', maxWidth: 560, mx: 'auto' }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>Customer Registered</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>The account is now active and ready for banking. Share these credentials securely with the customer.</Typography>
              <Box sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.main', borderRadius: 2, p: 2.5, mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Account Number</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.dark" letterSpacing={2}>{success.accountNumber}</Typography>
              </Box>
              <Box sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.main', borderRadius: 2, p: 2.5, mb: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
                  <LockIcon color="warning" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={700} color="warning.dark">Auto-Generated PIN</Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900} letterSpacing={8} color="warning.dark" mb={1}>{success.pin}</Typography>
                <Button variant="outlined" color="warning" size="small" startIcon={<ContentCopyIcon />} onClick={handleCopyPin}>{pinCopied ? 'Copied!' : 'Copy PIN'}</Button>
              </Box>
              <Stack direction="row" spacing={1.5} justifyContent="center">
                <Button variant="outlined" onClick={() => { setSuccess(null); setForm({ name: '', fatherName: '', motherName: '', nidNumber: '', dob: '', gender: 'Male', mobile: '', email: '', password: '', accountType: 'Savings', address: '' }); }}>Register Another</Button>
                <Button variant="contained" onClick={() => window.history.back()}>Done</Button>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              {globalError && <Alert severity="error" sx={{ mb: 2 }}>{globalError}</Alert>}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Full Name" value={form.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} required /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Father's Name" value={form.fatherName} onChange={set('fatherName')} error={!!errors.fatherName} helperText={errors.fatherName} required /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Mother's Name" value={form.motherName} onChange={set('motherName')} error={!!errors.motherName} helperText={errors.motherName} required /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="NID Number" value={form.nidNumber} onChange={set('nidNumber')} error={!!errors.nidNumber} helperText={errors.nidNumber} required inputProps={{ inputMode: 'numeric' }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Date of Birth" type="date" value={form.dob} onChange={set('dob')} error={!!errors.dob} helperText={errors.dob} required InputLabelProps={{ shrink: true }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select value={form.gender} label="Gender" onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                      <MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem><MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Mobile Number" value={form.mobile} onChange={set('mobile')} error={!!errors.mobile} helperText={errors.mobile} required placeholder="01XXXXXXXXX" inputProps={{ inputMode: 'numeric' }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Account Type</InputLabel>
                    <Select value={form.accountType} label="Account Type" onChange={e => setForm(p => ({ ...p, accountType: e.target.value }))}>
                      <MenuItem value="Savings">Savings</MenuItem><MenuItem value="Checking">Checking</MenuItem><MenuItem value="Current">Current</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}><TextField fullWidth label="Email Address" type="email" value={form.email} onChange={set('email')} error={!!errors.email} helperText={errors.email} required /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Password" type="password" value={form.password} onChange={set('password')} error={!!errors.password} helperText={errors.password} required /></Grid>
                <Grid size={{ xs: 12 }}><TextField fullWidth label="Address" value={form.address} onChange={set('address')} multiline rows={2} /></Grid>
              </Grid>
              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>A 6-digit PIN will be auto-generated. The account will be activated immediately upon registration.</Alert>
              <Button variant="contained" size="large" onClick={handleSubmit}>Register Customer</Button>
            </CardContent>
          </Card>
        )}
      </Box>
    </EmployeeLayout>
  );
}
