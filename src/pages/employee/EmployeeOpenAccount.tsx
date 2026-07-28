import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box, Button, Card, CardContent, Grid, Stack, TextField, Typography, Alert, MenuItem,
  FormControl, InputLabel, Select, Stepper, Step, StepLabel, StepContent, Paper, Chip, Divider,
} from '@mui/material';
import {
  CheckCircle, AccountBalance, Person, Assignment, NavigateNext, NavigateBefore,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import EmployeeLayout from '../../components/EmployeeLayout';
import { getUserByAccount, updateUser, addNotification, generatePin } from '../../utils/localStorageDB';
import { validateRequired } from '../../utils/validators';
import { useToast } from '../../context/ToastContext';

interface FormData {
  accountNumber: string;
  accountType: string;
  initialDeposit: string;
  branch: string;
  nomineeName: string;
  nomineeRelationship: string;
  nomineeMobile: string;
  nomineeAddress: string;
}

export default function EmployeeOpenAccount() {
  const toast = useToast();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ accountNumber: string; name: string; balance: number; pin?: string } | null>(null);
  const [foundUser, setFoundUser] = useState<{ id: string; name: string; email: string; mobile: string; nidNumber: string } | null>(null);
  const [form, setForm] = useState<FormData>({
    accountNumber: '', accountType: 'Savings', initialDeposit: '', branch: 'Smart Bank Main Branch, Dhaka',
    nomineeName: '', nomineeRelationship: '', nomineeMobile: '', nomineeAddress: '',
  });

  const update = (field: keyof FormData, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleLookup = () => {
    setError('');
    const reqErr = validateRequired(form.accountNumber, 'Account number');
    if (reqErr) { setError(reqErr); return false; }
    const existing = getUserByAccount(form.accountNumber.trim());
    if (!existing) { setError('No customer found with that account number'); return false; }
    if (existing.role !== 'user') { setError('This account is not a customer account'); return false; }
    setFoundUser({ id: existing.id, name: existing.name, email: existing.email, mobile: existing.mobile, nidNumber: existing.nidNumber });
    return true;
  };

  const handleNext = () => {
    setError('');
    if (activeStep === 0) {
      if (handleLookup()) setActiveStep(1);
    } else if (activeStep === 1) {
      const deposit = parseFloat(form.initialDeposit);
      if (isNaN(deposit) || deposit < 0) { setError('Enter a valid initial deposit'); return; }
      setActiveStep(2);
    } else if (activeStep === 2) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setError('');
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    const deposit = parseFloat(form.initialDeposit);
    if (!foundUser) { setError('Customer not found'); return; }
    const existing = getUserByAccount(form.accountNumber.trim());
    if (!existing) { setError('Customer not found'); return; }

    const nominee = form.nomineeName ? {
      name: form.nomineeName, relationship: form.nomineeRelationship, mobile: form.nomineeMobile,
      address: form.nomineeAddress, addedAt: new Date().toISOString(),
    } : undefined;

    const autoPin = generatePin();
    updateUser(existing.id, {
      accountType: form.accountType,
      balance: existing.balance + deposit,
      isApproved: true,
      pin: autoPin,
      kycStatus: 'pending',
      branch: form.branch,
      nominee,
    });
    addNotification({
      accountNumber: existing.accountNumber,
      message: `Welcome to Smart Bank! Your ${form.accountType} account is now active with ৳${deposit.toLocaleString()}.`,
      type: 'success',
    });
    setSuccess({ accountNumber: existing.accountNumber, name: existing.name, balance: existing.balance + deposit, pin: autoPin });
    toast.showSuccess(`Account opened successfully for ${existing.name}!`);
    setActiveStep(3);
  };

  const handleReset = () => {
    setSuccess(null);
    setFoundUser(null);
    setForm({ accountNumber: '', accountType: 'Savings', initialDeposit: '', branch: 'Smart Bank Main Branch, Dhaka', nomineeName: '', nomineeRelationship: '', nomineeMobile: '', nomineeAddress: '' });
    setActiveStep(0);
  };

  return (
    <EmployeeLayout title="Open Account">
      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Open Customer Account</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Professional multi-step account opening form for new and existing customers.
        </Typography>

        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 2 }}>
              {/* Step 1: Customer Lookup */}
              <Step>
                <StepLabel icon={<Person fontSize="small" />}>Customer Lookup</StepLabel>
                <StepContent>
                  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Customer Account Number"
                        value={form.accountNumber}
                        onChange={e => update('accountNumber', e.target.value)}
                        placeholder="Enter account number"
                        inputProps={{ inputMode: 'numeric' }}
                        disabled={!!foundUser}
                      />
                    </Grid>
                  </Grid>
                  {foundUser && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <CheckCircle color="success" fontSize="small" />
                          <Typography variant="body2" fontWeight={600} color="success.main">Customer Found</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={700}>{foundUser.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{foundUser.email} | {foundUser.mobile}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>NID: {foundUser.nidNumber || '—'}</Typography>
                      </Box>
                    </motion.div>
                  )}
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button variant="contained" size="small" endIcon={<NavigateNext />} onClick={handleNext} disabled={!!foundUser}>
                      {foundUser ? 'Continue' : 'Look Up'}
                    </Button>
                    {foundUser && <Button variant="outlined" size="small" onClick={() => { setFoundUser(null); update('accountNumber', ''); }}>Reset</Button>}
                  </Stack>
                </StepContent>
              </Step>

              {/* Step 2: Account Details */}
              <Step>
                <StepLabel icon={<AccountBalance fontSize="small" />}>Account Details</StepLabel>
                <StepContent>
                  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Account Type</InputLabel>
                        <Select value={form.accountType} label="Account Type" onChange={e => update('accountType', e.target.value)}>
                          <MenuItem value="Savings">Savings</MenuItem>
                          <MenuItem value="Checking">Checking</MenuItem>
                          <MenuItem value="Current">Current</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Initial Deposit (৳)"
                        type="number"
                        value={form.initialDeposit}
                        onChange={e => update('initialDeposit', e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Branch"
                        value={form.branch}
                        onChange={e => update('branch', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button variant="outlined" size="small" startIcon={<NavigateBefore />} onClick={handleBack}>Back</Button>
                    <Button variant="contained" size="small" endIcon={<NavigateNext />} onClick={handleNext}>Continue</Button>
                  </Stack>
                </StepContent>
              </Step>

              {/* Step 3: Nominee & Review */}
              <Step>
                <StepLabel icon={<Assignment fontSize="small" />}>Nominee & Review</StepLabel>
                <StepContent>
                  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Nominee Information (Optional)</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Nominee Name" value={form.nomineeName} onChange={e => update('nomineeName', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Relationship" value={form.nomineeRelationship} onChange={e => update('nomineeRelationship', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Nominee Phone" value={form.nomineeMobile} onChange={e => update('nomineeMobile', e.target.value)} inputProps={{ inputMode: 'numeric' }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Nominee Address" value={form.nomineeAddress} onChange={e => update('nomineeAddress', e.target.value)} />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Review Details</Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Customer</Typography>
                        <Typography variant="body2" fontWeight={600}>{foundUser?.name ?? '—'}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Account Number</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{form.accountNumber}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Account Type</Typography>
                        <Chip size="small" label={form.accountType} color="primary" variant="outlined" />
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Initial Deposit</Typography>
                        <Typography variant="body2" fontWeight={700} color="success.main">৳{(parseFloat(form.initialDeposit) || 0).toLocaleString()}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Branch</Typography>
                        <Typography variant="body2" fontWeight={600}>{form.branch}</Typography>
                      </Stack>
                      {form.nomineeName && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">Nominee</Typography>
                          <Typography variant="body2" fontWeight={600}>{form.nomineeName} ({form.nomineeRelationship})</Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Paper>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button variant="outlined" size="small" startIcon={<NavigateBefore />} onClick={handleBack}>Back</Button>
                    <Button variant="contained" size="small" startIcon={<CheckCircle />} onClick={handleNext}>Confirm & Open Account</Button>
                  </Stack>
                </StepContent>
              </Step>

              {/* Step 4: Confirmation */}
              <Step>
                <StepLabel icon={<CheckCircle fontSize="small" />}>Confirmation</StepLabel>
                <StepContent>
                  {success && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <CheckCircle sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
                        <Typography variant="h6" fontWeight={700} gutterBottom>Account Opened Successfully</Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>The account is now active and ready for transactions.</Typography>
                        <Box sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.main', borderRadius: 2, p: 2.5, mb: 2, textAlign: 'left' }}>
                          <Typography variant="caption" color="text.secondary">Customer Name</Typography>
                          <Typography variant="h6" fontWeight={700} color="primary.dark" gutterBottom>{success.name}</Typography>
                          <Typography variant="caption" color="text.secondary">Account Number</Typography>
                          <Typography variant="h5" fontWeight={800} color="primary.dark" letterSpacing={2}>{success.accountNumber}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Current Balance</Typography>
                          <Typography variant="h6" fontWeight={700} color="success.dark">৳{success.balance.toLocaleString()}</Typography>
                          {success.pin && (
                            <>
                              <Divider sx={{ my: 1.5 }} />
                              <Typography variant="caption" color="text.secondary">Generated PIN</Typography>
                              <Typography variant="h6" fontWeight={800} color="warning.main" letterSpacing={3}>{success.pin}</Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>Share securely with the customer</Typography>
                            </>
                          )}
                        </Box>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button variant="contained" onClick={handleReset}>Open Another</Button>
                          <Button variant="outlined" onClick={() => navigate(`/employee/customer-detail/${foundUser?.id ?? ''}`)}>View Dashboard</Button>
                        </Stack>
                      </Box>
                    </motion.div>
                  )}
                </StepContent>
              </Step>
            </Stepper>
          </CardContent>
        </Card>
      </Box>
    </EmployeeLayout>
  );
}
