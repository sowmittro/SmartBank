import { useState, useMemo } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Stack, TextField, Typography, Alert,
  Divider, Dialog, DialogContent, DialogTitle, DialogActions,
  InputAdornment, CircularProgress, Paper,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Flame, Droplet, Wifi, Smartphone, Phone, CreditCard, GraduationCap,
  ShieldCheck, Landmark, Tv, HeartPulse, CheckCircle2, Receipt,
} from 'lucide-react';
import CustomerLayout from '../components/CustomerLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { addTransaction, updateUser, addNotification } from '../utils/localStorageDB';
import { BANK_COLORS } from '../theme';

interface BillCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  providers: { name: string }[];
}

const BILL_CATEGORIES: BillCategory[] = [
  { key: 'electricity', label: 'Electricity', icon: <Zap size={24} />, color: '#F59E0B', bgColor: 'rgba(245,158,11,0.10)', providers: [
    { name: 'DESCO' }, { name: 'BPDB' }, { name: 'NESCO' }, { name: 'WZPDCL' },
  ]},
  { key: 'gas', label: 'Gas', icon: <Flame size={24} />, color: '#DC2626', bgColor: 'rgba(220,38,38,0.10)', providers: [
    { name: 'Titas Gas' }, { name: 'Bakhrabad Gas' }, { name: 'Jalalabad Gas' },
  ]},
  { key: 'water', label: 'Water', icon: <Droplet size={24} />, color: '#0EA5E9', bgColor: 'rgba(14,165,233,0.10)', providers: [
    { name: 'WASA Dhaka' }, { name: 'CWASA' }, { name: 'KWASA' },
  ]},
  { key: 'internet', label: 'Internet', icon: <Wifi size={24} />, color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.10)', providers: [
    { name: 'BTCL' }, { name: 'Link3' }, { name: 'ISPros' }, { name: 'AmberIT' },
  ]},
  { key: 'mobile', label: 'Mobile Postpaid', icon: <Smartphone size={24} />, color: '#2563EB', bgColor: 'rgba(37,99,235,0.10)', providers: [
    { name: 'Grameenphone' }, { name: 'Robi' }, { name: 'Banglalink' }, { name: 'Teletalk' },
  ]},
  { key: 'landline', label: 'Landline', icon: <Phone size={24} />, color: '#0891B2', bgColor: 'rgba(8,145,178,0.10)', providers: [
    { name: 'BTCL Landline' }, { name: 'Sheba Phone' },
  ]},
  { key: 'creditcard', label: 'Credit Card', icon: <CreditCard size={24} />, color: '#7C3AED', bgColor: 'rgba(124,58,237,0.10)', providers: [
    { name: 'Visa Credit Card' }, { name: 'Mastercard Credit' }, { name: 'Amex Credit Card' },
  ]},
  { key: 'education', label: 'Education Fees', icon: <GraduationCap size={24} />, color: '#059669', bgColor: 'rgba(5,150,105,0.10)', providers: [
    { name: 'BUET' }, { name: 'Dhaka University' }, { name: 'NSU' }, { name: 'BRAC University' },
  ]},
  { key: 'insurance', label: 'Insurance', icon: <ShieldCheck size={24} />, color: '#4F46E5', bgColor: 'rgba(79,70,229,0.10)', providers: [
    { name: 'Pragati Insurance' }, { name: 'Sunlife Insurance' }, { name: 'Delta Life Insurance' },
  ]},
  { key: 'government', label: 'Govt Fees & Taxes', icon: <Landmark size={24} />, color: '#B45309', bgColor: 'rgba(180,83,9,0.10)', providers: [
    { name: 'Income Tax' }, { name: 'VAT' }, { name: 'Land Tax' }, { name: 'Passport Fee' },
  ]},
  { key: 'cabletv', label: 'Cable TV / DTH', icon: <Tv size={24} />, color: '#9333EA', bgColor: 'rgba(147,51,234,0.10)', providers: [
    { name: 'Dish TV' }, { name: 'Akash DTH' }, { name: 'T Sports' },
  ]},
  { key: 'medical', label: 'Hospital & Medical', icon: <HeartPulse size={24} />, color: '#E11D48', bgColor: 'rgba(225,29,72,0.10)', providers: [
    { name: 'Square Hospital' }, { name: 'Apollo Hospital' }, { name: 'Labaid' },
  ]},
];

function generateTxnId() {
  return 'BILL' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

export default function PayBills() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [refNumber, setRefNumber] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ txnId: string; timestamp: string; amount: number; provider: string; category: string } | null>(null);
  const [dueDate] = useState(() => new Date(Date.now() + 7 * 86400000));

  const selectedProviderInfo = useMemo(() => {
    if (!selectedCategory || !selectedProvider) return null;
    const provider = selectedCategory.providers.find(p => p.name === selectedProvider);
    return provider ? { name: provider.name } : null;
  }, [selectedCategory, selectedProvider]);

  if (!user) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedProvider) errs.provider = 'Select a bill provider';
    if (!refNumber.trim()) errs.refNumber = 'Enter your customer/account/reference number';
    else if (refNumber.trim().length < 4) errs.refNumber = 'Enter a valid reference number';
    const amt = parseFloat(payAmount);
    if (!payAmount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount';
    else if (amt > user.balance) errs.amount = 'Insufficient balance';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    setConfirmOpen(true);
  };

  const confirmPayment = () => {
    setLoading(true);
    setTimeout(() => {
      const amt = parseFloat(payAmount);
      const txnId = generateTxnId();
      updateUser(user.id, { balance: user.balance - amt });
      addTransaction({
        accountNumber: user.accountNumber,
        type: 'transfer-out',
        amount: amt,
        toAccount: selectedProvider,
        status: 'success',
        description: `Bill payment — ${selectedCategory?.label} (${selectedProvider}) — Ref: ${refNumber}`,
      });
      addNotification({
        accountNumber: user.accountNumber,
        message: `৳${amt.toLocaleString()} paid for ${selectedCategory?.label} (${selectedProvider}). Transaction ID: ${txnId}`,
        type: 'success',
      });
      refreshUser();
      setSuccess({ txnId, timestamp: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }), amount: amt, provider: selectedProvider, category: selectedCategory?.label ?? '' });
      toast.showSuccess(`Bill payment of ৳${amt.toLocaleString()} to ${selectedProvider} successful!`);
      setConfirmOpen(false);
      setLoading(false);
    }, 1000);
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setSelectedProvider('');
    setRefNumber('');
    setPayAmount('');
    setErrors({});
    setSuccess(null);
  };

  return (
    <CustomerLayout>
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif' }} mb={0.5}>Pay Bills</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Pay your utility bills, fees, and taxes instantly.</Typography>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Box textAlign="center" py={4} maxWidth={500} mx="auto">
                <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                  <CheckCircle2 size={72} color={BANK_COLORS.success} style={{ marginBottom: 16 }} />
                </motion.div>
                <Typography variant="h5" fontWeight={700} gutterBottom>Payment Successful!</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  ৳{success.amount.toLocaleString()} paid to {success.provider} for {success.category}
                </Typography>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Transaction ID</Typography><Typography variant="body2" fontWeight={700} fontFamily="monospace">{success.txnId}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Date & Time</Typography><Typography variant="body2" fontWeight={600}>{success.timestamp}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Category</Typography><Typography variant="body2" fontWeight={600}>{success.category}</Typography></Stack>
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Provider</Typography><Typography variant="body2" fontWeight={600}>{success.provider}</Typography></Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Amount Paid</Typography><Typography variant="body2" fontWeight={700} color="success.main">৳{success.amount.toLocaleString()}</Typography></Stack>
                    </Stack>
                  </CardContent>
                </Card>
                <Button variant="outlined" sx={{ mt: 3 }} onClick={resetForm}>Pay Another Bill</Button>
              </Box>
            </motion.div>
          ) : !selectedCategory ? (
            <motion.div key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Grid container spacing={2}>
                {BILL_CATEGORIES.map((cat, i) => (
                  <Grid key={cat.key} size={{ xs: 6, sm: 4, md: 3 }}>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <Card
                        onClick={() => { setSelectedCategory(cat); setSelectedProvider(''); setRefNumber(''); setPayAmount(''); setErrors({}); }}
                        sx={{
                          cursor: 'pointer', borderRadius: 3, border: '1px solid', borderColor: 'divider', transition: 'all 0.2s',
                          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', borderColor: cat.color },
                        }}
                      >
                        <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                          <Box sx={{ bgcolor: cat.bgColor, borderRadius: 2.5, p: 1.5, display: 'inline-flex', mb: 1.5, color: cat.color }}>
                            {cat.icon}
                          </Box>
                          <Typography variant="body2" fontWeight={600}>{cat.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{cat.providers.length} providers</Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Button variant="text" sx={{ mb: 2 }} onClick={() => setSelectedCategory(null)}>← Back to Categories</Button>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <Box sx={{ bgcolor: selectedCategory.bgColor, borderRadius: 2, p: 1.5, color: selectedCategory.color, display: 'flex' }}>
                  {selectedCategory.icon}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{selectedCategory.label} Bills</Typography>
                  <Typography variant="caption" color="text.secondary">Select provider and enter your details</Typography>
                </Box>
              </Stack>

              <Card variant="outlined" sx={{ borderRadius: 3, maxWidth: 600 }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>SELECT PROVIDER</Typography>
                      <Grid container spacing={1.5}>
                        {selectedCategory.providers.map(p => (
                          <Grid key={p.name} size={{ xs: 12, sm: 6 }}>
                            <Box
                              onClick={() => { setSelectedProvider(p.name); setErrors(prev => ({ ...prev, provider: '', amount: '' })); }}
                              sx={{
                                p: 2, border: '2px solid', borderColor: selectedProvider === p.name ? selectedCategory.color : 'divider',
                                borderRadius: 2, cursor: 'pointer', transition: 'all 0.2s',
                                bgcolor: selectedProvider === p.name ? selectedCategory.bgColor : 'background.paper',
                                '&:hover': { borderColor: selectedCategory.color },
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                                {selectedProvider === p.name && <CheckCircle2 size={18} color={selectedCategory.color} />}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">Tap to select</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      {errors.provider && <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>{errors.provider}</Typography>}
                    </Box>

                    <TextField
                      fullWidth label="Customer / Account / Reference Number" value={refNumber}
                      onChange={e => { setRefNumber(e.target.value); setErrors(p => ({ ...p, refNumber: '' })); }}
                      error={!!errors.refNumber} helperText={errors.refNumber}
                      placeholder="e.g. 1234567890"
                    />

                    {selectedProviderInfo && (
                      <Paper sx={{ p: 2, bgcolor: 'rgba(15,76,129,0.04)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Stack spacing={0.75}>
                          <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Provider</Typography><Typography variant="caption" fontWeight={600}>{selectedProviderInfo.name}</Typography></Stack>
                          <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Billing Period</Typography><Typography variant="caption" fontWeight={600}>{new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}</Typography></Stack>
                          <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Due Date</Typography><Typography variant="caption" fontWeight={600} color="warning.dark">{dueDate.toLocaleDateString()}</Typography></Stack>
                        </Stack>
                      </Paper>
                    )}

                    <TextField
                      fullWidth label="Payment Amount (৳)" type="number" value={payAmount}
                      onChange={e => { setPayAmount(e.target.value); setErrors(p => ({ ...p, amount: '' })); }}
                      error={!!errors.amount} helperText={errors.amount || `Available balance: ৳${user.balance.toLocaleString()}`}
                      inputProps={{ min: 1 }}
                      InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
                    />

                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Typography variant="caption">You can pay full or partial amount. This is a frontend simulation — no real payment is processed.</Typography>
                    </Alert>

                    <Button
                      variant="contained" size="large" onClick={handlePay}
                      disabled={!user.isActive || !selectedProvider || !refNumber || !payAmount}
                      sx={{ minHeight: 52 }}
                    >
                      <Receipt size={18} style={{ marginRight: 8 }} /> Proceed to Payment
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
          <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>Confirm Bill Payment</DialogTitle>
          <DialogContent>
            <Box sx={{ bgcolor: 'rgba(15,76,129,0.06)', borderRadius: 3, p: 2.5, mb: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Category</Typography><Typography variant="body2" fontWeight={600}>{selectedCategory?.label}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Provider</Typography><Typography variant="body2" fontWeight={600}>{selectedProvider}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Reference</Typography><Typography variant="body2" fontWeight={600} fontFamily="monospace">{refNumber}</Typography></Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2" fontWeight={700}>Total Amount</Typography><Typography variant="subtitle2" fontWeight={700} color="error.main">৳{parseFloat(payAmount || '0').toLocaleString()}</Typography></Stack>
              </Stack>
            </Box>
            <Alert severity="warning" sx={{ borderRadius: 2 }}><Typography variant="caption">This is a frontend simulation. No real payment will be processed.</Typography></Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" onClick={() => setConfirmOpen(false)} fullWidth>Cancel</Button>
            <Button variant="contained" color="success" disabled={loading} onClick={confirmPayment} fullWidth>
              {loading ? <CircularProgress size={20} /> : 'Confirm & Pay'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </CustomerLayout>
  );
}
