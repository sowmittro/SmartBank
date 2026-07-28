import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Stack, TextField, Typography, Alert,
  Divider, Dialog, DialogContent, DialogTitle, DialogActions,
  InputAdornment, CircularProgress, Chip, useTheme,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Smartphone, ArrowLeft, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { addTransaction, updateUser, addNotification } from '../utils/localStorageDB';
import { BANK_COLORS } from '../theme';

interface Operator {
  id: string;
  name: string;
  logo: string;
  color: string;
  prefix: string[];
}

const OPERATORS: Operator[] = [
  { id: 'grameenphone', name: 'Grameenphone', logo: '/assets/mfs-logos/vecteezy_grameenphone-logo-horizontal-gp-sim-company-icon-transparent_68894425.png', color: '#00A1E0', prefix: ['017', '013'] },
  { id: 'robi', name: 'Robi', logo: '/assets/mfs-logos/pngwing.com.png', color: '#E60012', prefix: ['018', '016'] },
  { id: 'banglalink', name: 'Banglalink', logo: '/banglalink.webp', color: '#F36F21', prefix: ['019', '014'] },
  { id: 'airtel', name: 'Airtel', logo: '/airtel.webp', color: '#E40012', prefix: ['016', '015'] },
];

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];
const SERVICE_CHARGE_RATE = 0;

function generateTxnId() {
  return 'RCH' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

type Step = 'operator' | 'details' | 'confirm' | 'success';

interface MobileRechargeDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileRechargeDialog({ open, onClose }: MobileRechargeDialogProps) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const theme = useTheme();

  const [step, setStep] = useState<Step>('operator');
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [loading, setLoading] = useState(false);
  const [txnResult, setTxnResult] = useState<{ txnId: string; timestamp: string; operator: string; number: string; amount: number; serviceCharge: number; total: number } | null>(null);

  if (!user) return null;

  const reset = () => {
    setStep('operator');
    setSelectedOperator(null);
    setPhoneNumber('');
    setAmount('');
    setPhoneError('');
    setAmountError('');
    setTxnResult(null);
    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const validatePhone = (val: string): boolean => {
    const digits = val.replace(/\D/g, '');
    if (!digits) { setPhoneError('Phone number is required'); return false; }
    if (digits.length !== 11) { setPhoneError('Must be exactly 11 digits'); return false; }
    const validPrefixes = ['013', '014', '015', '016', '017', '018', '019'];
    const prefix = digits.substring(0, 3);
    if (!validPrefixes.includes(prefix)) { setPhoneError('Invalid BD mobile prefix'); return false; }
    setPhoneError('');
    return true;
  };

  const validateAmount = (val: string): boolean => {
    const amt = parseFloat(val);
    if (!val || isNaN(amt) || amt <= 0) { setAmountError('Enter a valid amount'); return false; }
    if (amt < 10) { setAmountError('Minimum recharge is ৳10'); return false; }
    if (amt > user.balance) { setAmountError('Insufficient balance'); return false; }
    setAmountError('');
    return true;
  };

  const handleOperatorSelect = (op: Operator) => {
    setSelectedOperator(op);
    setStep('details');
  };

  const handleProceed = () => {
    const phoneOk = validatePhone(phoneNumber);
    const amtOk = validateAmount(amount);
    if (phoneOk && amtOk) setStep('confirm');
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      const amt = parseFloat(amount);
      const serviceCharge = Math.round(amt * SERVICE_CHARGE_RATE);
      const total = amt + serviceCharge;
      const txnId = generateTxnId();

      updateUser(user.id, { balance: user.balance - total });
      addTransaction({
        accountNumber: user.accountNumber,
        type: 'transfer-out',
        amount: total,
        toAccount: `Mobile Recharge — ${selectedOperator?.name}`,
        status: 'success',
        description: `Mobile Recharge — ${selectedOperator?.name} (Prepaid) — ${phoneNumber}`,
      });
      addNotification({
        accountNumber: user.accountNumber,
        message: `৳${total.toLocaleString()} recharged to ${phoneNumber} (${selectedOperator?.name}). Txn ID: ${txnId}`,
        type: 'success',
      });
      refreshUser();
      setTxnResult({
        txnId,
        timestamp: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
        operator: selectedOperator?.name ?? '',
        number: phoneNumber,
        amount: amt,
        serviceCharge,
        total,
      });
      toast.showSuccess(`Recharge of ৳${total.toLocaleString()} to ${phoneNumber} successful!`);
      setStep('success');
      setLoading(false);
    }, 1200);
  };

  const formatPhoneDisplay = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    return digits;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Smartphone size={22} color={BANK_COLORS.primary} />
        Mobile Recharge
        {step !== 'operator' && step !== 'success' && (
          <Button
            size="small"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => setStep(step === 'confirm' ? 'details' : 'operator')}
            sx={{ ml: 'auto' }}
          >
            Back
          </Button>
        )}
      </DialogTitle>
      <DialogContent>
        <AnimatePresence mode="wait">
          {/* Step 1: Operator Selection */}
          {step === 'operator' && (
            <motion.div key="operator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Typography variant="body2" color="text.secondary" mb={2.5}>Select your mobile operator</Typography>
              <Grid container spacing={2}>
                {OPERATORS.map((op, i) => (
                  <Grid key={op.id} size={{ xs: 6, sm: 3 }}>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <Card
                        onClick={() => handleOperatorSelect(op)}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 3,
                          border: '2px solid',
                          borderColor: 'divider',
                          transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 24px ${op.color}30`,
                            borderColor: op.color,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Box sx={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                            <Box
                              component="img"
                              src={op.logo}
                              alt={op.name}
                              sx={{
                                maxHeight: 48,
                                maxWidth: '100%',
                                width: 'auto',
                                objectFit: 'contain',
                                filter: theme.palette.mode === 'dark' ? 'brightness(1.1)' : 'none',
                              }}
                            />
                          </Box>
                          <Typography variant="caption" fontWeight={600}>{op.name}</Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && selectedOperator && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <Stack spacing={2.5}>
                {/* Selected operator chip */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    component="img"
                    src={selectedOperator.logo}
                    alt={selectedOperator.name}
                    sx={{ height: 36, width: 'auto', objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'brightness(1.1)' : 'none' }}
                  />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{selectedOperator.name}</Typography>
                    <Chip label="Prepaid" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                  </Box>
                </Stack>

                <Divider />

                {/* Recharge Type - Fixed Prepaid */}
                <Box>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>RECHARGE TYPE</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip label="Prepaid" color="primary" variant="filled" icon={<CheckCircle2 size={16} />} sx={{ fontWeight: 600 }} />
                    <Chip label="Postpaid" disabled sx={{ opacity: 0.4 }} />
                  </Stack>
                </Box>

                {/* Phone Number Input */}
                <Box>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>PHONE NUMBER</Typography>
                  <TextField
                    fullWidth
                    value={phoneNumber}
                    onChange={e => { setPhoneNumber(formatPhoneDisplay(e.target.value)); setPhoneError(''); }}
                    error={!!phoneError}
                    helperText={phoneError || 'Enter 11-digit BD mobile number (e.g. 017XXXXXXXX)'}
                    placeholder="017XXXXXXXX"
                    inputProps={{ inputMode: 'numeric', maxLength: 11 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Box
                              component="img"
                              src={selectedOperator.logo}
                              alt={selectedOperator.name}
                              sx={{ height: 20, width: 'auto', objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'brightness(1.1)' : 'none' }}
                            />
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>+880</Typography>
                          </Stack>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Recharge Amount */}
                <Box>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>RECHARGE AMOUNT (BDT)</Typography>
                  <Grid container spacing={1} mb={1.5}>
                    {QUICK_AMOUNTS.map(amt => (
                      <Grid key={amt} size={{ xs: 4, sm: 2 }}>
                        <Button
                          variant={parseFloat(amount) === amt ? 'contained' : 'outlined'}
                          size="small"
                          fullWidth
                          onClick={() => { setAmount(String(amt)); setAmountError(''); }}
                          sx={{ borderRadius: 2, fontWeight: 700, minHeight: 36 }}
                        >
                          ৳{amt}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                  <TextField
                    fullWidth
                    label="Or enter custom amount"
                    type="number"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setAmountError(''); }}
                    error={!!amountError}
                    helperText={amountError || `Available balance: ৳${user.balance.toLocaleString()}`}
                    inputProps={{ min: 10 }}
                    InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
                  />
                </Box>

                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="caption">Prepaid recharge will be processed instantly. This is a frontend simulation.</Typography>
                </Alert>
              </Stack>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirm' && selectedOperator && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <Typography variant="body2" color="text.secondary" mb={2}>Please confirm your recharge details</Typography>
              <Box sx={{ bgcolor: 'rgba(37,99,235,0.06)', borderRadius: 3, p: 2.5, mb: 2 }}>
                <Stack spacing={1.5} divider={<Divider flexItem />}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Operator</Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box component="img" src={selectedOperator.logo} alt={selectedOperator.name} sx={{ height: 24, width: 'auto', objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'brightness(1.1)' : 'none' }} />
                      <Typography variant="body2" fontWeight={600}>{selectedOperator.name}</Typography>
                    </Stack>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Recharge Type</Typography>
                    <Typography variant="body2" fontWeight={600}>Prepaid</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Mobile Number</Typography>
                    <Typography variant="body2" fontWeight={600} fontFamily="monospace">+880{phoneNumber.substring(1)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Recharge Amount</Typography>
                    <Typography variant="body2" fontWeight={600}>৳{parseFloat(amount).toLocaleString()}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Service Charge</Typography>
                    <Typography variant="body2" fontWeight={600}>৳0</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight={700}>Total Amount</Typography>
                    <Typography variant="subtitle2" fontWeight={700} color="primary.main">৳{parseFloat(amount).toLocaleString()}</Typography>
                  </Stack>
                </Stack>
              </Box>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="caption">৳{parseFloat(amount).toLocaleString()} will be deducted from your account. This is a frontend simulation.</Typography>
              </Alert>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && txnResult && (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Box textAlign="center" py={2}>
                <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                  <CheckCircle2 size={64} color={BANK_COLORS.success} style={{ marginBottom: 12 }} />
                </motion.div>
                <Typography variant="h6" fontWeight={700} gutterBottom>Recharge Successful!</Typography>
                <Typography variant="body2" color="text.secondary" mb={2.5}>
                  ৳{txnResult.total.toLocaleString()} recharged to {txnResult.number}
                </Typography>
                <Card variant="outlined" sx={{ borderRadius: 3, textAlign: 'left' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Transaction ID</Typography><Typography variant="caption" fontWeight={700} fontFamily="monospace">{txnResult.txnId}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Date & Time</Typography><Typography variant="caption" fontWeight={600}>{txnResult.timestamp}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Operator</Typography><Typography variant="caption" fontWeight={600}>{txnResult.operator}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Number</Typography><Typography variant="caption" fontWeight={600} fontFamily="monospace">+880{txnResult.number.substring(1)}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Type</Typography><Typography variant="caption" fontWeight={600}>Prepaid</Typography></Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Amount</Typography><Typography variant="caption" fontWeight={600}>৳{txnResult.amount.toLocaleString()}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Service Charge</Typography><Typography variant="caption" fontWeight={600}>৳{txnResult.serviceCharge.toLocaleString()}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2" fontWeight={700}>Total Paid</Typography><Typography variant="subtitle2" fontWeight={700} color="success.main">৳{txnResult.total.toLocaleString()}</Typography></Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {step === 'success' ? (
          <Button variant="outlined" fullWidth onClick={handleClose}>Close</Button>
        ) : step === 'confirm' ? (
          <>
            <Button variant="outlined" fullWidth onClick={() => setStep('details')}>Back</Button>
            <Button variant="contained" color="success" fullWidth disabled={loading} onClick={handleConfirm}>
              {loading ? <CircularProgress size={20} /> : 'Confirm & Recharge'}
            </Button>
          </>
        ) : step === 'details' ? (
          <Button
            variant="contained"
            fullWidth
            disabled={!phoneNumber || !amount || !!phoneError || !!amountError}
            onClick={handleProceed}
            sx={{ minHeight: 48 }}
          >
            <Receipt size={18} style={{ marginRight: 8 }} /> Proceed to Confirm
          </Button>
        ) : (
          <Button variant="outlined" fullWidth onClick={handleClose}>Cancel</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
