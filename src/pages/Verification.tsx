import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box, Button, Card, CardContent, Container, Grid, Stack, TextField, Typography,
  Alert, Stepper, Step, StepLabel, Paper, MenuItem, FormControl, InputLabel,
  Select, FormHelperText, Chip, InputAdornment,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../utils/localStorageDB';
import { useToast } from '../context/ToastContext';

const STEPS = ['KYC Verification', 'Admin Approval', 'Nominee Registration'];

interface KycForm {
  nidPassport: string;
  presentAddress: string;
  permanentAddress: string;
  occupation: string;
  sourceOfIncome: string;
  monthlyIncome: string;
}

const OCCUPATIONS = ['Service Holder', 'Businessman', 'Self-Employed', 'Student', 'Retired', 'Housewife', 'Day Labourer', 'Other'];
const INCOME_SOURCES = ['Salary', 'Business', 'Agriculture', 'Investment', 'Pension', 'Family Support', 'Other'];

export default function Verification() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [errors, setErrors] = useState<Partial<Record<keyof KycForm, string>>>({});
  const [form, setForm] = useState<KycForm>({
    nidPassport: user?.kycData?.nidPassport ?? '',
    presentAddress: user?.kycData?.presentAddress ?? '',
    permanentAddress: user?.kycData?.permanentAddress ?? '',
    occupation: user?.kycData?.occupation ?? '',
    sourceOfIncome: user?.kycData?.sourceOfIncome ?? '',
    monthlyIncome: user?.kycData?.monthlyIncome ? String(user.kycData.monthlyIncome) : '',
  });

  // Nominee form
  const [nomErrors, setNomErrors] = useState<Record<string, string>>({});
  const [nominee, setNominee] = useState({
    name: user?.nominee?.name ?? '',
    relationship: user?.nominee?.relationship ?? '',
    mobile: user?.nominee?.mobile ?? '',
    address: user?.nominee?.address ?? '',
  });

  if (!user) return null;

  const kycSubmitted = !!user.kycData;
  const kycApproved = user.kycStatus === 'verified';
  const kycRejected = user.kycStatus === 'rejected';
  const nomineeAdded = !!user.nominee;
  const allDone = kycApproved && nomineeAdded;

  const activeStep = allDone ? 3 : kycApproved ? 2 : kycSubmitted ? 1 : 0;

  const set = (field: keyof KycForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateKyc = (): boolean => {
    const errs: Partial<Record<keyof KycForm, string>> = {};
    if (!form.nidPassport.trim()) errs.nidPassport = 'NID / Passport number is required';
    else if (form.nidPassport.trim().length < 5) errs.nidPassport = 'Enter a valid NID / Passport number';
    if (!form.presentAddress.trim()) errs.presentAddress = 'Present address is required';
    if (!form.permanentAddress.trim()) errs.permanentAddress = 'Permanent address is required';
    if (!form.occupation) errs.occupation = 'Occupation is required';
    if (!form.sourceOfIncome) errs.sourceOfIncome = 'Source of income is required';
    const income = parseFloat(form.monthlyIncome);
    if (!form.monthlyIncome || isNaN(income) || income <= 0) errs.monthlyIncome = 'Enter a valid monthly income';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitKyc = () => {
    if (!validateKyc()) return;
    updateUser(user.id, {
      kycStatus: 'pending',
      kycData: {
        nidPassport: form.nidPassport.trim(),
        presentAddress: form.presentAddress.trim(),
        permanentAddress: form.permanentAddress.trim(),
        occupation: form.occupation,
        sourceOfIncome: form.sourceOfIncome,
        monthlyIncome: parseFloat(form.monthlyIncome),
        submittedAt: new Date().toISOString(),
      },
    });
    refreshUser();
    toast.showSuccess('KYC information submitted successfully. Awaiting admin approval.');
  };

  const submitNominee = () => {
    const errs: Record<string, string> = {};
    if (!nominee.name.trim()) errs.name = 'Nominee name is required';
    if (!nominee.relationship.trim()) errs.relationship = 'Relationship is required';
    if (!/^01\d{9}$/.test(nominee.mobile)) errs.mobile = 'Enter a valid mobile number (01XXXXXXXXX)';
    if (!nominee.address.trim()) errs.address = 'Address is required';
    setNomErrors(errs);
    if (Object.keys(errs).length > 0) return;

    updateUser(user.id, {
      nominee: {
        name: nominee.name.trim(),
        relationship: nominee.relationship.trim(),
        mobile: nominee.mobile.trim(),
        address: nominee.address.trim(),
        addedAt: new Date().toISOString(),
      },
    });
    refreshUser();
    toast.showSuccess('Nominee information saved successfully!');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="md">
        <Box textAlign="center" mb={4}>
          <BrandLogo variant="auth" clickable height={100} />
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>

        <AnimatePresence mode="wait">
          {/* Step 0: KYC Form */}
          {!kycSubmitted && !kycApproved && (
            <motion.div key="kyc-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <VerifiedUserIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>KYC — Know Your Customer</Typography>
                  </Stack>
                  <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    Please provide accurate information as per your National ID / Passport. This data will be reviewed by bank staff before approval.
                  </Alert>
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="NID / Passport Number" value={form.nidPassport} onChange={set('nidPassport')} error={!!errors.nidPassport} helperText={errors.nidPassport} required inputProps={{ inputMode: 'numeric' }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'} disabled helperText="From registration" />
                    </Grid>
                    <Grid size={12}>
                      <TextField fullWidth label="Present Address" value={form.presentAddress} onChange={set('presentAddress')} error={!!errors.presentAddress} helperText={errors.presentAddress} required multiline rows={2} />
                    </Grid>
                    <Grid size={12}>
                      <TextField fullWidth label="Permanent Address" value={form.permanentAddress} onChange={set('permanentAddress')} error={!!errors.permanentAddress} helperText={errors.permanentAddress} required multiline rows={2} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth error={!!errors.occupation} required>
                        <InputLabel>Occupation</InputLabel>
                        <Select label="Occupation" value={form.occupation} onChange={e => { setForm(f => ({ ...f, occupation: e.target.value })); setErrors(prev => ({ ...prev, occupation: '' })); }}>
                          {OCCUPATIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                        {errors.occupation && <FormHelperText>{errors.occupation}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth error={!!errors.sourceOfIncome} required>
                        <InputLabel>Source of Income</InputLabel>
                        <Select label="Source of Income" value={form.sourceOfIncome} onChange={e => { setForm(f => ({ ...f, sourceOfIncome: e.target.value })); setErrors(prev => ({ ...prev, sourceOfIncome: '' })); }}>
                          {INCOME_SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                        {errors.sourceOfIncome && <FormHelperText>{errors.sourceOfIncome}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth label="Monthly Income (৳)"
                        type="number" value={form.monthlyIncome}
                        onChange={set('monthlyIncome')}
                        error={!!errors.monthlyIncome} helperText={errors.monthlyIncome} required
                        InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                  </Grid>
                  <Button variant="contained" size="large" fullWidth sx={{ mt: 3 }} onClick={submitKyc}>
                    Submit KYC Information
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 1: Waiting for admin approval */}
          {kycSubmitted && !kycApproved && !kycRejected && (
            <motion.div key="waiting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <CardContent sx={{ p: 6 }}>
                  <HourglassEmptyIcon sx={{ fontSize: 72, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h5" fontWeight={700} gutterBottom>KYC Under Review</Typography>
                  <Typography variant="body1" color="text.secondary" mb={3} sx={{ maxWidth: 480, mx: 'auto' }}>
                    Your KYC information has been submitted successfully and is now being reviewed by our bank staff.
                    You will be notified once the review is complete.
                  </Typography>
                  <Paper sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.light', p: 3, borderRadius: 2, maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <Chip label="Pending" color="warning" size="small" />
                      <Typography variant="caption" color="text.secondary">Submitted on {new Date(user.kycData!.submittedAt).toLocaleString()}</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Please check back later or wait for a notification. You can log out and return anytime.
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 1: KYC Rejected */}
          {kycRejected && (
            <motion.div key="rejected" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'error.light' }}>
                <CardContent sx={{ p: 4 }}>
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    Your KYC was rejected. Please review and resubmit your information.
                  </Alert>
                  <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <VerifiedUserIcon color="error" />
                    <Typography variant="h6" fontWeight={700}>Update & Resubmit KYC</Typography>
                  </Stack>
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="NID / Passport Number" value={form.nidPassport} onChange={set('nidPassport')} error={!!errors.nidPassport} helperText={errors.nidPassport} required />
                    </Grid>
                    <Grid size={12}>
                      <TextField fullWidth label="Present Address" value={form.presentAddress} onChange={set('presentAddress')} error={!!errors.presentAddress} helperText={errors.presentAddress} required multiline rows={2} />
                    </Grid>
                    <Grid size={12}>
                      <TextField fullWidth label="Permanent Address" value={form.permanentAddress} onChange={set('permanentAddress')} error={!!errors.permanentAddress} helperText={errors.permanentAddress} required multiline rows={2} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth error={!!errors.occupation} required>
                        <InputLabel>Occupation</InputLabel>
                        <Select label="Occupation" value={form.occupation} onChange={e => { setForm(f => ({ ...f, occupation: e.target.value })); setErrors(prev => ({ ...prev, occupation: '' })); }}>
                          {OCCUPATIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                        {errors.occupation && <FormHelperText>{errors.occupation}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth error={!!errors.sourceOfIncome} required>
                        <InputLabel>Source of Income</InputLabel>
                        <Select label="Source of Income" value={form.sourceOfIncome} onChange={e => { setForm(f => ({ ...f, sourceOfIncome: e.target.value })); setErrors(prev => ({ ...prev, sourceOfIncome: '' })); }}>
                          {INCOME_SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                        {errors.sourceOfIncome && <FormHelperText>{errors.sourceOfIncome}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Monthly Income (৳)" type="number" value={form.monthlyIncome} onChange={set('monthlyIncome')} error={!!errors.monthlyIncome} helperText={errors.monthlyIncome} required InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} />
                    </Grid>
                  </Grid>
                  <Button variant="contained" size="large" fullWidth sx={{ mt: 3 }} onClick={submitKyc}>
                    Resubmit KYC Information
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Nominee Registration (only after KYC approved) */}
          {kycApproved && !nomineeAdded && (
            <motion.div key="nominee" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 4 }}>
                  <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                    <strong>KYC Verified!</strong> Your account is now verified. Complete nominee registration to finish.
                  </Alert>
                  <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <PersonAddIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>Add Nominee</Typography>
                  </Stack>
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Nominee Full Name" value={nominee.name} onChange={e => { setNominee(n => ({ ...n, name: e.target.value })); setNomErrors(prev => ({ ...prev, name: '' })); }} error={!!nomErrors.name} helperText={nomErrors.name} required />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Relationship with Customer" value={nominee.relationship} onChange={e => { setNominee(n => ({ ...n, relationship: e.target.value })); setNomErrors(prev => ({ ...prev, relationship: '' })); }} error={!!nomErrors.relationship} helperText={nomErrors.relationship} required placeholder="e.g. Spouse, Son, Daughter" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Mobile Number" value={nominee.mobile} onChange={e => { setNominee(n => ({ ...n, mobile: e.target.value })); setNomErrors(prev => ({ ...prev, mobile: '' })); }} error={!!nomErrors.mobile} helperText={nomErrors.mobile} required placeholder="01XXXXXXXXX" inputProps={{ inputMode: 'numeric' }} />
                    </Grid>
                    <Grid size={12}>
                      <TextField fullWidth label="Address" value={nominee.address} onChange={e => { setNominee(n => ({ ...n, address: e.target.value })); setNomErrors(prev => ({ ...prev, address: '' })); }} error={!!nomErrors.address} helperText={nomErrors.address} required multiline rows={2} />
                    </Grid>
                  </Grid>
                  <Button variant="contained" size="large" fullWidth sx={{ mt: 3 }} startIcon={<PersonAddIcon />} onClick={submitNominee}>
                    Save Nominee Information
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: All Complete */}
          {allDone && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'success.light', textAlign: 'center' }}>
                <CardContent sx={{ p: 6 }}>
                  <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
                  <Typography variant="h5" fontWeight={700} gutterBottom>Verification Complete!</Typography>
                  <Typography variant="body1" color="text.secondary" mb={4} sx={{ maxWidth: 480, mx: 'auto' }}>
                    Your account is now fully verified. All banking features are unlocked. You can proceed to your dashboard.
                  </Typography>
                  <Paper sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.light', p: 3, borderRadius: 2, maxWidth: 420, mx: 'auto', textAlign: 'left' }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                      <Chip label="Verified" color="success" size="small" />
                      <Typography variant="caption" color="text.secondary">Account fully activated</Typography>
                    </Stack>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">KYC Status</Typography><Typography variant="body2" fontWeight={600} color="success.main">Verified</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Nominee</Typography><Typography variant="body2" fontWeight={600}>{user.nominee!.name}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Account Number</Typography><Typography variant="body2" fontWeight={600} fontFamily="monospace">{user.accountNumber}</Typography></Stack>
                    </Stack>
                  </Paper>
                  <Button variant="contained" size="large" sx={{ mt: 3 }} onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  );
}
