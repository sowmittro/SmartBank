import { useState } from 'react';
import {
  Box, Button, Card, CardContent, CircularProgress, Stack, TextField,
  Typography, Alert, Divider, Tabs, Tab, Grid, Avatar, List, ListItemButton,
  ListItemText, ListItemAvatar, InputAdornment, IconButton, Tooltip,
  Dialog, DialogContent,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Search, CheckCircle2, ArrowRight, User, Copy, Check,
  Phone, Building2, Lock,
} from 'lucide-react';
import CustomerLayout from '../components/CustomerLayout';
import PinModal from '../components/PinModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getUserByAccount, addTransaction, updateUser, addNotification,
  getTransactionsByAccount,
} from '../utils/localStorageDB';
import { validateAmount } from '../utils/validators';
import { BANK_COLORS } from '../theme';

const MFS_PROVIDERS = [
  {
    key: 'bkash',
    name: 'bKash',
    color: '#E2136E',
    bgColor: '#FFF0F7',
    borderColor: '#F9A8C9',
    logo: '/assets/mfs-logos/Bkash.png',
    prefix: ['017', '013'],
    minAmount: 10,
    maxAmount: 25000,
    charge: (amt: number) => Math.max(5, Math.round(amt * 0.015)),
  },
  {
    key: 'nagad',
    name: 'Nagad',
    color: '#F7931E',
    bgColor: '#FFF8F0',
    borderColor: '#FDD5A0',
    logo: '/assets/mfs-logos/nagad-seeklogo.png',
    prefix: ['017', '018', '016', '019'],
    minAmount: 10,
    maxAmount: 25000,
    charge: (amt: number) => Math.max(5, Math.round(amt * 0.012)),
  },
  {
    key: 'rocket',
    name: 'Rocket',
    color: '#8E2272',
    bgColor: '#FAF0F8',
    borderColor: '#DBA8D1',
    logo: '/assets/mfs-logos/dutch-bangla-rocket-seeklogo.png',
    prefix: ['017', '016'],
    minAmount: 10,
    maxAmount: 20000,
    charge: (amt: number) => Math.max(5, Math.round(amt * 0.018)),
  },
  {
    key: 'upay',
    name: 'Upay',
    color: '#1E3A8A',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    logo: '/assets/mfs-logos/vecteezy_upay-logo-mobile-banking-app-icon-transparent-background_68764291.png',
    prefix: ['017', '018'],
    minAmount: 10,
    maxAmount: 20000,
    charge: (amt: number) => Math.max(5, Math.round(amt * 0.01)),
  },
] as const;

type MfsKey = typeof MFS_PROVIDERS[number]['key'];

function generateTxnId() {
  return 'TXN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export default function Transfer() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<{ name: string; accountNumber: string } | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [mfsProvider, setMfsProvider] = useState<MfsKey>('bkash');
  const [mfsNumber, setMfsNumber] = useState('');
  const [mfsAmount, setMfsAmount] = useState('');
  const [mfsReference, setMfsReference] = useState('');
  const [mfsPin, setMfsPin] = useState('');
  const [mfsErrors, setMfsErrors] = useState<Record<string, string>>({});
  const [mfsConfirmOpen, setMfsConfirmOpen] = useState(false);
  const [mfsSuccess, setMfsSuccess] = useState<{ txnId: string; timestamp: string; amount: number; provider: string; mobile: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  // Recent contacts from transfer history
  const recentTransfers = getTransactionsByAccount(user.accountNumber)
    .filter(t => t.type === 'transfer-out' && t.toAccount)
    .slice(-5)
    .reverse();
  const recentContacts = recentTransfers.map(t => {
    const r = getUserByAccount(t.toAccount!);
    return r ? { name: r.name, accountNumber: r.accountNumber } : null;
  }).filter(Boolean).filter((c, i, arr) => arr.findIndex(x => x!.accountNumber === c!.accountNumber) === i) as { name: string; accountNumber: string }[];

  const lookupAccount = () => {
    setLookupError('');
    setRecipientInfo(null);
    if (!toAccount.trim()) { setLookupError('Enter an account number'); return; }
    if (toAccount === user.accountNumber) { setLookupError('Cannot transfer to your own account'); return; }
    const recipient = getUserByAccount(toAccount.trim());
    if (!recipient || recipient.role === 'admin') { setLookupError('Account not found'); return; }
    if (!recipient.isActive) { setLookupError('Recipient account is frozen'); return; }
    setRecipientInfo({ name: recipient.name, accountNumber: recipient.accountNumber });
  };

  const handleSubmit = () => {
    const err = validateAmount(amount, user.balance);
    if (err) { setAmountError(err); return; }
    if (!recipientInfo) { setLookupError('Please verify the recipient account first'); return; }
    setPinOpen(true);
  };

  const executeTransfer = (pin: string) => {
    if (pin !== user.pin) { setPinError('Incorrect PIN'); return; }
    setPinError('');
    setPinOpen(false);
    setLoading(true);

    setTimeout(() => {
      const amt = parseFloat(amount);
      const recipient = getUserByAccount(toAccount.trim());
      if (!recipient) { setLoading(false); return; }

      updateUser(user.id, { balance: user.balance - amt });
      updateUser(recipient.id, { balance: recipient.balance + amt });

      addTransaction({
        accountNumber: user.accountNumber, type: 'transfer-out', amount: amt,
        toAccount: recipient.accountNumber, status: 'success', pendingApproval: false,
        description: note ? `Transfer to ${recipient.name} — ${note}` : `Transfer to ${recipient.name} (${recipient.accountNumber})`,
      });
      addTransaction({
        accountNumber: recipient.accountNumber, type: 'transfer-in', amount: amt,
        fromAccount: user.accountNumber, status: 'success',
        description: `Transfer from ${user.name} (${user.accountNumber})`,
      });

      addNotification({ accountNumber: user.accountNumber, message: `৳${amt.toLocaleString()} transferred to ${recipient.name} successfully.`, type: 'success' });
      addNotification({ accountNumber: recipient.accountNumber, message: `You received ৳${amt.toLocaleString()} from ${user.name}.`, type: 'success' });

      refreshUser();
      setLoading(false);
      setShowSuccessAnim(true);
      setTimeout(() => {
        setShowSuccessAnim(false);
        toast.showSuccess(`৳${amt.toLocaleString()} transferred to ${recipient.name} successfully.`);
        setToAccount(''); setAmount(''); setNote(''); setRecipientInfo(null);
      }, 1800);
    }, 900);
  };

  const currentProvider = MFS_PROVIDERS.find(p => p.key === mfsProvider)!;

  const validateMfs = (): boolean => {
    const errs: Record<string, string> = {};
    if (!/^01\d{9}$/.test(mfsNumber)) {
      errs.mobile = 'Enter a valid 11-digit mobile number (01XXXXXXXXX)';
    }
    const amtErr = validateAmount(mfsAmount, user.balance);
    if (amtErr) errs.amount = amtErr;
    const amt = parseFloat(mfsAmount);
    if (!isNaN(amt)) {
      if (amt < currentProvider.minAmount) errs.amount = `Minimum transfer is ৳${currentProvider.minAmount}`;
      else if (amt > currentProvider.maxAmount) errs.amount = `Maximum transfer is ৳${currentProvider.maxAmount}`;
    }
    if (mfsPin.length < 4) errs.pin = 'Enter your 4-6 digit PIN';
    setMfsErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleMfsSubmit = () => {
    if (!validateMfs()) return;
    setMfsConfirmOpen(true);
  };

  const confirmMfsTransfer = () => {
    const amt = parseFloat(mfsAmount);
    const charge = currentProvider.charge(amt);
    const total = amt + charge;

    updateUser(user.id, { balance: user.balance - total });
    addTransaction({
      accountNumber: user.accountNumber,
      type: 'transfer-out',
      amount: total,
      toAccount: mfsNumber,
      status: 'success',
      description: `${currentProvider.name} transfer to ${mfsNumber}${mfsReference ? ` — Ref: ${mfsReference}` : ''}`,
    });
    addNotification({
      accountNumber: user.accountNumber,
      message: `৳${amt.toLocaleString()} transferred to ${currentProvider.name} (${mfsNumber}). Charge: ৳${charge}.`,
      type: 'success',
    });

    setMfsSuccess({
      txnId: generateTxnId(),
      timestamp: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
      amount: amt,
      provider: currentProvider.name,
      mobile: mfsNumber,
    });
    setMfsConfirmOpen(false);
    setMfsNumber('');
    setMfsAmount('');
    setMfsReference('');
    setMfsPin('');
    setMfsErrors({});
    refreshUser();
  };

  const copyAccount = () => {
    navigator.clipboard?.writeText(user.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CustomerLayout>
      <Box>
        {/* Success Animation Overlay */}
        <AnimatePresence>
          {showSuccessAnim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <Box sx={{
                  bgcolor: 'white', borderRadius: 6, p: 5, textAlign: 'center',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
                }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 10 }}
                  >
                    <CheckCircle2 size={72} color={BANK_COLORS.secondary} strokeWidth={2.5} />
                  </motion.div>
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 2, fontFamily: '"Poppins", sans-serif' }}>
                    Transfer Successful!
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Your money is on its way
                  </Typography>
                </Box>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!user.isActive && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>Your account is frozen.</Alert>}

        <Grid container spacing={3}>
          {/* Left: Beneficiary List + Recent Contacts */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif', mb: 2 }}>
                  Beneficiaries
                </Typography>

                {/* From Account */}
                <Box sx={{ bgcolor: 'rgba(15,76,129,0.06)', borderRadius: 3, p: 2, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>FROM ACCOUNT</Typography>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mt={0.5}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{user.name}</Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">{user.accountNumber}</Typography>
                        <Tooltip title="Copy">
                          <IconButton size="small" onClick={copyAccount} sx={{ p: 0.25 }}>
                            {copied ? <Check size={12} color={BANK_COLORS.secondary} /> : <Copy size={12} color="#94A3B8" />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary">Balance</Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main">৳{user.balance.toLocaleString()}</Typography>
                    </Box>
                  </Stack>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1}>
                  Recent Contacts
                </Typography>
                {recentContacts.length === 0 ? (
                  <Box textAlign="center" py={3}>
                    <User size={32} color="#CBD5E1" style={{ margin: '0 auto' }} />
                    <Typography variant="body2" color="text.secondary" mt={1}>No recent contacts yet</Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {recentContacts.map((contact, i) => (
                      <ListItemButton
                        key={i}
                        onClick={() => { setToAccount(contact.accountNumber); setRecipientInfo(contact); setLookupError(''); }}
                        sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: 'rgba(15,76,129,0.04)' } }}
                      >
                        <ListItemAvatar sx={{ minWidth: 48 }}>
                          <Avatar sx={{ bgcolor: 'rgba(15,76,129,0.10)', color: 'primary.main', width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}>
                            {contact.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{contact.name}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary" fontFamily="monospace">{contact.accountNumber}</Typography>}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right: Transfer Form */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                  <Box sx={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1B6CA8 100%)', borderRadius: 3, p: 1.25, display: 'flex', boxShadow: '0 4px 12px rgba(15,76,129,0.20)' }}>
                    <Send size={22} color="white" />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif' }}>Transfer Money</Typography>
                    <Typography variant="caption" color="text.secondary">Send money securely to any Smart Bank account</Typography>
                  </Box>
                </Stack>

                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Tab icon={<Building2 size={16} />} iconPosition="start" label="Bank Transfer" />
                  <Tab icon={<Phone size={16} />} iconPosition="start" label="MFS / Mobile" />
                </Tabs>

                {activeTab === 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
                      Bank transfers are instant. Amount is immediately credited to the recipient.
                    </Alert>

                    <Stack direction="row" spacing={1} mb={2}>
                      <TextField
                        fullWidth label="Recipient Account Number" value={toAccount}
                        onChange={e => { setToAccount(e.target.value); setLookupError(''); setRecipientInfo(null); }}
                        error={!!lookupError} helperText={lookupError}
                        placeholder="1234567890" disabled={!user.isActive}
                        InputProps={{ endAdornment: recipientInfo ? <InputAdornment position="end"><CheckCircle2 size={18} color={BANK_COLORS.secondary} /></InputAdornment> : null }}
                      />
                      <Button variant="outlined" onClick={lookupAccount} startIcon={<Search size={18} />} sx={{ minWidth: 110, whiteSpace: 'nowrap' }} disabled={!user.isActive}>
                        Verify
                      </Button>
                    </Stack>

                    {recipientInfo && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <Box sx={{ bgcolor: 'rgba(46,125,50,0.08)', border: '1px solid', borderColor: 'success.light', borderRadius: 3, p: 2, mb: 2 }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: 'rgba(46,125,50,0.15)', color: 'success.dark', width: 44, height: 44, fontWeight: 700 }}>
                              {recipientInfo.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="caption" color="success.dark" fontWeight={600}>RECIPIENT VERIFIED</Typography>
                              <Typography variant="body1" fontWeight={700}>{recipientInfo.name}</Typography>
                              <Typography variant="caption" color="text.secondary" fontFamily="monospace">{recipientInfo.accountNumber}</Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </motion.div>
                    )}

                    <TextField
                      fullWidth label="Amount (৳)" type="number" value={amount}
                      onChange={e => { setAmount(e.target.value); setAmountError(''); }}
                      error={!!amountError} helperText={amountError || `Available: ৳${user.balance.toLocaleString()}`}
                      inputProps={{ min: 1 }} sx={{ mb: 2 }} disabled={!user.isActive}
                    />

                    <TextField
                      fullWidth label="Note (optional)" value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Add a note for this transfer" sx={{ mb: 3 }} disabled={!user.isActive}
                    />

                    <Button
                      variant="contained" fullWidth size="large"
                      onClick={handleSubmit}
                      disabled={loading || !user.isActive || !recipientInfo}
                      endIcon={loading ? undefined : <ArrowRight size={20} />}
                      sx={{ minHeight: 52 }}
                    >
                      {loading ? <CircularProgress size={22} color="inherit" /> : 'Transfer Money'}
                    </Button>
                  </motion.div>
                )}

                {activeTab === 1 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {mfsSuccess ? (
                      <Box textAlign="center" py={4}>
                        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                          <CheckCircle2 size={72} color={BANK_COLORS.success} style={{ marginBottom: 16 }} />
                        </motion.div>
                        <Typography variant="h5" fontWeight={700} gutterBottom>Transfer Successful!</Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                          ৳{mfsSuccess.amount.toLocaleString()} has been sent to {mfsSuccess.provider} ({mfsSuccess.mobile})
                        </Typography>
                        <Card variant="outlined" sx={{ maxWidth: 420, mx: 'auto', textAlign: 'left', borderRadius: 3 }}>
                          <CardContent sx={{ p: 3 }}>
                            <Stack spacing={1.5}>
                              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Transaction ID</Typography><Typography variant="body2" fontWeight={700} fontFamily="monospace">{mfsSuccess.txnId}</Typography></Stack>
                              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Date & Time</Typography><Typography variant="body2" fontWeight={600}>{mfsSuccess.timestamp}</Typography></Stack>
                              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Provider</Typography><Typography variant="body2" fontWeight={600}>{mfsSuccess.provider}</Typography></Stack>
                              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Recipient</Typography><Typography variant="body2" fontWeight={600}>{mfsSuccess.mobile}</Typography></Stack>
                              <Divider />
                              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Amount Sent</Typography><Typography variant="body2" fontWeight={700} color="success.main">৳{mfsSuccess.amount.toLocaleString()}</Typography></Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                        <Button variant="outlined" sx={{ mt: 3 }} onClick={() => setMfsSuccess(null)}>Make Another Transfer</Button>
                      </Box>
                    ) : (
                      <>
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
                          Transfer from your bank account to mobile banking (MFS) wallets. Instant transfer with minimal charges.
                        </Alert>

                        {/* Provider Selection Cards */}
                        <Grid container spacing={2} mb={3}>
                          {MFS_PROVIDERS.map(p => (
                            <Grid key={p.key} size={{ xs: 6, sm: 3 }}>
                              <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                                <Card
                                  onClick={() => setMfsProvider(p.key)}
                                  sx={{
                                    cursor: 'pointer', borderRadius: 3, overflow: 'hidden',
                                    border: '2px solid', borderColor: mfsProvider === p.key ? p.color : p.borderColor,
                                    bgcolor: p.bgColor, transition: 'all 0.2s',
                                    position: 'relative',
                                    '&:hover': { boxShadow: 4 },
                                  }}
                                >
                                  {mfsProvider === p.key && (
                                    <Box sx={{ position: 'absolute', top: 6, right: 6, zIndex: 1, bgcolor: p.color, borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Check size={14} color="white" />
                                    </Box>
                                  )}
                                  <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                      <Box component="img" src={p.logo} alt={p.name} sx={{ maxHeight: 44, maxWidth: '100%', objectFit: 'contain' }} />
                                    </Box>
                                    <Typography variant="body2" fontWeight={700} sx={{ color: p.color }}>{p.name}</Typography>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            </Grid>
                          ))}
                        </Grid>

                        {/* MFS Transfer Form */}
                        <Card variant="outlined" sx={{ borderRadius: 3 }}>
                          <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: currentProvider.bgColor }}>
                                <Box component="img" src={currentProvider.logo} alt={currentProvider.name} sx={{ maxHeight: 28, maxWidth: '100%', objectFit: 'contain' }} />
                              </Box>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={700}>Transfer to {currentProvider.name}</Typography>
                                <Typography variant="caption" color="text.secondary">Min: ৳{currentProvider.minAmount} · Max: ৳{currentProvider.maxAmount}</Typography>
                              </Box>
                            </Stack>

                            <Stack spacing={2}>
                              <TextField
                                fullWidth label="Recipient Mobile Number" value={mfsNumber}
                                onChange={e => { setMfsNumber(e.target.value.replace(/\D/g, '').slice(0, 11)); setMfsErrors(p => ({ ...p, mobile: '' })); }}
                                error={!!mfsErrors.mobile} helperText={mfsErrors.mobile}
                                placeholder="01XXXXXXXXX" disabled={!user.isActive}
                                inputProps={{ inputMode: 'numeric' }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={18} /></InputAdornment> }}
                              />
                              <TextField
                                fullWidth label="Transfer Amount (৳)" type="number" value={mfsAmount}
                                onChange={e => { setMfsAmount(e.target.value); setMfsErrors(p => ({ ...p, amount: '' })); }}
                                error={!!mfsErrors.amount} helperText={mfsErrors.amount || `Available: ৳${user.balance.toLocaleString()} · Charge: ৳${mfsAmount ? currentProvider.charge(parseFloat(mfsAmount) || 0) : 0}`}
                                disabled={!user.isActive}
                                InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
                                inputProps={{ min: currentProvider.minAmount, max: currentProvider.maxAmount }}
                              />
                              <TextField
                                fullWidth label="Reference (Optional)" value={mfsReference}
                                onChange={e => setMfsReference(e.target.value)}
                                placeholder="e.g. Monthly family support" disabled={!user.isActive}
                                inputProps={{ maxLength: 50 }}
                              />
                              <TextField
                                fullWidth label="Enter PIN" type="password" value={mfsPin}
                                onChange={e => { setMfsPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setMfsErrors(p => ({ ...p, pin: '' })); }}
                                error={!!mfsErrors.pin} helperText={mfsErrors.pin}
                                disabled={!user.isActive}
                                inputProps={{ inputMode: 'numeric' }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Lock size={18} /></InputAdornment> }}
                              />
                            </Stack>

                            <Button
                              variant="contained" fullWidth size="large"
                              onClick={handleMfsSubmit}
                              disabled={!user.isActive || !mfsNumber || !mfsAmount || !mfsPin}
                              sx={{ mt: 3, minHeight: 52, bgcolor: currentProvider.color, '&:hover': { bgcolor: currentProvider.color, opacity: 0.9 } }}
                            >
                              Continue to Confirmation
                            </Button>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <PinModal
          open={pinOpen} onClose={() => setPinOpen(false)} onConfirm={executeTransfer}
          title="Confirm Transfer"
          description={`Enter PIN to transfer ৳${parseFloat(amount || '0').toLocaleString()} to ${recipientInfo?.name ?? ''}`}
          error={pinError}
        />

        {/* MFS Confirmation Modal */}
        <Dialog open={mfsConfirmOpen} onClose={() => setMfsConfirmOpen(false)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogContent sx={{ p: 3 }}>
            <Box textAlign="center" mb={2}>
              <Box sx={{ width: 56, height: 56, borderRadius: 2, overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', bgcolor: currentProvider.bgColor, mb: 1 }}>
                <Box component="img" src={currentProvider.logo} alt={currentProvider.name} sx={{ maxHeight: 40, objectFit: 'contain' }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>Confirm {currentProvider.name} Transfer</Typography>
            </Box>
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">To</Typography><Typography variant="body2" fontWeight={600}>{mfsNumber}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Amount</Typography><Typography variant="body2" fontWeight={600}>৳{parseFloat(mfsAmount || '0').toLocaleString()}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Charge</Typography><Typography variant="body2" fontWeight={600}>৳{currentProvider.charge(parseFloat(mfsAmount || '0'))}</Typography></Stack>
              {mfsReference && <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Reference</Typography><Typography variant="body2" fontWeight={600} sx={{ maxWidth: 180, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{mfsReference}</Typography></Stack>}
              <Divider />
              <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2" fontWeight={700}>Total</Typography><Typography variant="subtitle2" fontWeight={700} color="error.main">৳{(parseFloat(mfsAmount || '0') + currentProvider.charge(parseFloat(mfsAmount || '0'))).toLocaleString()}</Typography></Stack>
            </Stack>
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="caption">This is a frontend simulation. No real money will be transferred.</Typography>
            </Alert>
            <Stack direction="row" spacing={1.5}>
              <Button variant="outlined" fullWidth onClick={() => setMfsConfirmOpen(false)}>Cancel</Button>
              <Button variant="contained" fullWidth onClick={confirmMfsTransfer} sx={{ bgcolor: currentProvider.color, '&:hover': { bgcolor: currentProvider.color, opacity: 0.9 } }}>
                Confirm & Send
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>
      </Box>
    </CustomerLayout>
  );
}
