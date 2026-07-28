import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, Stack, TextField,
  Typography, Alert, Divider, LinearProgress, List, ListItem, ListItemText,
  ListItemIcon, IconButton, Tooltip, Avatar, InputAdornment,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Send, Wallet, ArrowDownToLine, ArrowUpFromLine,
  Receipt, CreditCard, TrendingUp, Bell, Copy, Check, Eye, EyeOff,
  ShieldCheck, Info, AlertTriangle,
} from 'lucide-react';
import CustomerLayout from '../components/CustomerLayout';
import PinModal from '../components/PinModal';
import MobileRechargeDialog from '../components/MobileRechargeDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getTransactionsByAccount, addTransaction, updateUser, addNotification,
  getInterestRateForAmount, getUserByAccount,
  getNotificationsByAccount,
} from '../utils/localStorageDB';
import { getCardByNumber, updateCard } from '../utils/mockCardsData';
import { validateAmount } from '../utils/validators';
import type { Transaction } from '../utils/localStorageDB';
import { BANK_COLORS } from '../theme';

type ActionType = 'deposit' | 'withdraw' | 'loan' | 'pay_interest' | null;

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    let raf: number;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(fromRef.current + (value - fromRef.current) * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [actionType, setActionType] = useState<ActionType>(null);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);

  // Card Deposit state
  const [cardDepositOpen, setCardDepositOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardDepositAmount, setCardDepositAmount] = useState('');
  const [cardDepositErrors, setCardDepositErrors] = useState<Record<string, string>>({});
  const [cardDepositConfirmOpen, setCardDepositConfirmOpen] = useState(false);
  const [cardDepositSuccess, setCardDepositSuccess] = useState<{ txnId: string; timestamp: string; amount: number; cardLast4: string } | null>(null);

  if (!user) return null;

  const transactions = getTransactionsByAccount(user.accountNumber);
  const recent = [...transactions].reverse().slice(0, 6);
  const totalIn = transactions.filter(t => ['deposit', 'transfer-in', 'loan'].includes(t.type) && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => ['withdraw', 'transfer-out', 'interest'].includes(t.type) && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const notifications = getNotificationsByAccount(user.accountNumber).slice(0, 4);

  // autoRate removed — loan dialog uses loanAutoRate/loanEstimatedEMI directly
  const monthlyInterest = user.loanStatus === 'active' && user.loanAmount && user.loanInterestRate
    ? Math.round((user.loanAmount * user.loanInterestRate) / 100) : 0;

  const loanEligibleAmount = (() => {
    const txns = getTransactionsByAccount(user.accountNumber);
    const totalDeposits = txns.filter(t => t.type === 'deposit' && t.status === 'success').reduce((s, t) => s + t.amount, 0);
    return Math.min(500000, Math.max(10000, Math.round((user.balance + totalDeposits) * 2)));
  })();
  const loanRequestedAmt = parseFloat(amount) || 0;
  const loanExceedsLimit = loanRequestedAmt > loanEligibleAmount;
  const loanAutoRate = loanRequestedAmt > 0 ? getInterestRateForAmount(loanRequestedAmt) : 0;
  const loanEstimatedEMI = loanRequestedAmt > 0 ? Math.round((loanRequestedAmt * loanAutoRate) / 100) : 0;
  const pendingInterest = user.pendingInterest ?? 0;

  // Spending analytics data
  const spendingByType = [
    { name: 'Deposits', value: transactions.filter(t => t.type === 'deposit' && t.status === 'success').reduce((s, t) => s + t.amount, 0), color: BANK_COLORS.primary },
    { name: 'Withdrawals', value: transactions.filter(t => t.type === 'withdraw' && t.status === 'success').reduce((s, t) => s + t.amount, 0), color: BANK_COLORS.warning },
    { name: 'Transfers', value: transactions.filter(t => t.type === 'transfer-out' && t.status === 'success').reduce((s, t) => s + t.amount, 0), color: BANK_COLORS.purple },
    { name: 'Interest', value: transactions.filter(t => t.type === 'interest' && t.status === 'success').reduce((s, t) => s + t.amount, 0), color: BANK_COLORS.cyan },
  ].filter(d => d.value > 0);

  // Monthly trend (last 6 months)
  const monthlyData = (() => {
    const months: { month: string; income: number; expense: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en', { month: 'short' });
      const income = transactions.filter(t => ['deposit', 'transfer-in', 'loan'].includes(t.type) && t.status === 'success' && new Date(t.date).getMonth() === d.getMonth() && new Date(t.date).getFullYear() === d.getFullYear()).reduce((s, t) => s + t.amount, 0);
      const expense = transactions.filter(t => ['withdraw', 'transfer-out', 'interest'].includes(t.type) && t.status === 'success' && new Date(t.date).getMonth() === d.getMonth() && new Date(t.date).getFullYear() === d.getFullYear()).reduce((s, t) => s + t.amount, 0);
      months.push({ month: label, income, expense });
    }
    return months;
  })();

  const copyAccount = () => {
    navigator.clipboard?.writeText(user.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openAction = (type: ActionType) => { setActionType(type); setAmount(''); setAmountError(''); };

  const handleActionSubmit = () => {
    if (actionType === 'pay_interest') {
      if (user.balance < monthlyInterest) { setAmountError(`Insufficient balance. Need ৳${monthlyInterest.toLocaleString()}`); return; }
      setPinOpen(true); return;
    }
    const err = validateAmount(amount, actionType === 'withdraw' ? user.balance : undefined);
    if (err) { setAmountError(err); return; }
    if (actionType !== 'deposit') setPinOpen(true);
    else executeAction('');
  };

  const executeAction = (pin: string) => {
    if (actionType !== 'deposit' && pin !== user.pin) { setPinError('Incorrect PIN'); return; }
    setPinError(''); setPinOpen(false); setLoading(true);
    setTimeout(() => {
      const amt = actionType === 'pay_interest' ? monthlyInterest : parseFloat(amount);
      if (actionType === 'deposit') {
        addTransaction({ accountNumber: user.accountNumber, type: 'deposit', amount: amt, status: 'pending', pendingApproval: true, description: 'Deposit request — pending authority approval' });
        addNotification({ accountNumber: user.accountNumber, message: `Deposit request of ৳${amt.toLocaleString()} is pending authority approval.`, type: 'info' });
        toast.showSuccess('Deposit request submitted! Awaiting authority approval.');
      } else if (actionType === 'withdraw') {
        updateUser(user.id, { balance: user.balance - amt });
        addTransaction({ accountNumber: user.accountNumber, type: 'withdraw', amount: amt, status: 'success', description: 'Withdrawal' });
        toast.showSuccess(`৳${amt.toLocaleString()} withdrawn successfully.`);
        refreshUser();
      } else if (actionType === 'loan') {
        const rate = getInterestRateForAmount(amt);
        const dueDate = new Date(); dueDate.setMonth(dueDate.getMonth() + 1);
        updateUser(user.id, { balance: user.balance + amt, loanAmount: amt, loanInterestRate: rate, loanStartDate: new Date().toISOString(), loanDueDate: dueDate.toISOString(), loanStatus: 'active', interestPaid: 0, pendingInterest: 0 });
        addTransaction({ accountNumber: user.accountNumber, type: 'loan', amount: amt, status: 'success', description: `Loan of ৳${amt.toLocaleString()} at ${rate}% monthly interest` });
        addNotification({ accountNumber: user.accountNumber, message: `Loan of ৳${amt.toLocaleString()} disbursed at ${rate}% monthly interest.`, type: 'success' });
        toast.showSuccess(`Loan of ৳${amt.toLocaleString()} approved at ${rate}% monthly interest.`);
        refreshUser();
      } else if (actionType === 'pay_interest') {
        updateUser(user.id, { balance: user.balance - amt, lastInterestPaidDate: new Date().toISOString(), interestPaid: (user.interestPaid ?? 0) + amt, pendingInterest: Math.max(0, (user.pendingInterest ?? 0) - amt) });
        addTransaction({ accountNumber: user.accountNumber, type: 'interest', amount: amt, status: 'success', description: `Manual interest payment` });
        const nextDue = new Date(user.loanDueDate ?? new Date()); nextDue.setMonth(nextDue.getMonth() + 1);
        updateUser(user.id, { loanDueDate: nextDue.toISOString() });
        addNotification({ accountNumber: user.accountNumber, message: `Interest payment of ৳${amt.toLocaleString()} processed.`, type: 'success' });
        toast.showSuccess(`Interest payment of ৳${amt.toLocaleString()} completed.`);
        refreshUser();
      }
      setActionType(null); setLoading(false);
    }, 800);
  };

  const txColor = (type: Transaction['type']) => ['deposit', 'transfer-in', 'loan'].includes(type) ? BANK_COLORS.secondary : BANK_COLORS.danger;
  const txIcon = (type: Transaction['type']) => ['deposit', 'transfer-in', 'loan'].includes(type) ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />;

  const quickActions = [
    { label: 'Send Money', icon: <Send size={22} />, action: () => navigate('/transfer'), color: BANK_COLORS.primary, disabled: !user.isActive },
    { label: 'Deposit', icon: <ArrowDownToLine size={22} />, action: () => openAction('deposit'), color: BANK_COLORS.secondary, disabled: !user.isActive },
    { label: 'Card Deposit', icon: <CreditCard size={22} />, action: () => { setCardDepositOpen(true); setCardDepositSuccess(null); setCardNumber(''); setCardHolderName(''); setCardExpiry(''); setCardCvv(''); setCardDepositAmount(''); setCardDepositErrors({}); }, color: BANK_COLORS.cyan, disabled: !user.isActive },
    { label: 'Withdraw', icon: <ArrowUpFromLine size={22} />, action: () => openAction('withdraw'), color: BANK_COLORS.warning, disabled: !user.isActive },
    { label: 'Pay Bills', icon: <Receipt size={22} />, action: () => navigate('/pay-bills'), color: BANK_COLORS.purple, disabled: !user.isActive },
    { label: 'Mobile Recharge', icon: <Wallet size={22} />, action: () => setRechargeOpen(true), color: BANK_COLORS.cyan, disabled: !user.isActive },
    { label: 'Loan', icon: <CreditCard size={22} />, action: () => openAction('loan'), color: BANK_COLORS.danger, disabled: !user.isActive || user.loanStatus === 'active' },
  ];

  return (
    <CustomerLayout>
      <Box>
        {!user.isActive && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>Your account is frozen. Contact an administrator.</Alert>}

        <Grid container spacing={3}>
          {/* Welcome Card + Balance */}
          <Grid size={{ xs: 12, md: 8 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Card sx={{
                position: 'relative', overflow: 'hidden', border: 'none',
                background: 'linear-gradient(135deg, #0F4C81 0%, #0A3A64 50%, #072842 100%)',
                color: 'white', borderRadius: 4,
                '&::before': { content: '""', position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' },
                '&::after': { content: '""', position: 'absolute', bottom: -60, right: 20, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' },
              }}>
                <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.85, mb: 0.5, fontWeight: 500 }}>Welcome back,</Typography>
                      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                        <Avatar src={user.profilePhoto} sx={{ width: 48, height: 48, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '1.2rem', fontWeight: 700, border: '2px solid rgba(255,255,255,0.3)' }}>
                          {!user.profilePhoto && user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="h5" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif' }}>{user.name}</Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ opacity: 0.85, mb: 0.5, fontWeight: 500 }}>Total Balance</Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h2" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif', fontSize: { xs: '2rem', md: '3rem' } }}>
                          {hideBalance ? '৳••••••' : <>৳<AnimatedCounter value={user.balance} /></>}
                        </Typography>
                        <IconButton size="small" onClick={() => setHideBalance(!hideBalance)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {hideBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                        </IconButton>
                      </Stack>
                      <Stack direction="row" spacing={1} mt={1.5} alignItems="center" flexWrap="wrap" gap={0.5}>
                        <Chip label={user.accountType} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.7rem', height: 24, fontWeight: 600 }} />
                        <Typography variant="caption" sx={{ opacity: 0.8, fontFamily: 'monospace' }}>{user.accountNumber}</Typography>
                        <Tooltip title="Copy account number">
                          <IconButton size="small" onClick={copyAccount} sx={{ color: 'rgba(255,255,255,0.6)', p: 0.3 }}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                    <Box sx={{ opacity: 0.15 }}>
                      <TrendingUp size={80} strokeWidth={1} />
                    </Box>
                  </Stack>

                  <Grid container spacing={2} mt={2}>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)', borderRadius: 3, p: 2.5, border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                          <ArrowDownRight size={16} color="#4ADE80" />
                          <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>Savings Account</Typography>
                        </Stack>
                        <Typography variant="h6" fontWeight={700}>৳{totalIn.toLocaleString()}</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)', borderRadius: 3, p: 2.5, border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                          <ArrowUpRight size={16} color="#FCA5A5" />
                          <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>Current Account</Typography>
                        </Stack>
                        <Typography variant="h6" fontWeight={700}>৳{totalOut.toLocaleString()}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <Grid container spacing={1.5} mt={0.5}>
              {quickActions.map((btn, i) => (
                <Grid key={btn.label} size={{ xs: 6, sm: 4, md: 3 }}>
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}>
                    <Card sx={{
                      textAlign: 'center', cursor: btn.disabled ? 'not-allowed' : 'pointer',
                      opacity: btn.disabled ? 0.5 : 1,
                      '&:hover': btn.disabled ? {} : { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(15,76,129,0.10)' },
                    }} onClick={btn.disabled ? undefined : btn.action}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{
                          bgcolor: `${btn.color}15`, borderRadius: 2.5, p: 1.25,
                          display: 'inline-flex', mb: 1, color: btn.color,
                        }}>
                          {btn.icon}
                        </Box>
                        <Typography variant="caption" fontWeight={600} display="block">{btn.label}</Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Spending Analytics */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
              <Card sx={{ mt: 3, borderRadius: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif' }}>Spending Analytics</Typography>
                      <Typography variant="caption" color="text.secondary">Income vs Expense over last 6 months</Typography>
                    </Box>
                    <Chip icon={<TrendingUp size={14} />} label="Live" size="small" color="success" sx={{ fontWeight: 600 }} />
                  </Stack>
                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={BANK_COLORS.primary} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={BANK_COLORS.primary} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={BANK_COLORS.warning} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={BANK_COLORS.warning} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                        <RTooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: 13 }} formatter={(v) => `৳${Number(v).toLocaleString()}`} />
                        <Area type="monotone" dataKey="income" stroke={BANK_COLORS.primary} strokeWidth={2.5} fill="url(#incomeGrad)" name="Income" />
                        <Area type="monotone" dataKey="expense" stroke={BANK_COLORS.warning} strokeWidth={2.5} fill="url(#expenseGrad)" name="Expense" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                  {spendingByType.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">SPENDING BY CATEGORY</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {spendingByType.map((s, i) => (
                          <PieMini key={i} data={s} />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Mini Statement */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
              <Card sx={{ mt: 3, borderRadius: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif' }}>Mini Statement</Typography>
                      <Typography variant="caption" color="text.secondary">Last 5 transactions</Typography>
                    </Box>
                    <Button size="small" variant="outlined" onClick={() => navigate('/transactions')} sx={{ fontWeight: 600, borderRadius: 2 }}>Full Statement</Button>
                  </Stack>
                  {recent.length === 0 ? (
                    <Box textAlign="center" py={3}>
                      <Typography color="text.secondary" variant="body2">No transactions yet</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ overflow: 'hidden', borderRadius: 2 }}>
                      {recent.map((txn, i) => {
                        const isIncoming = ['deposit', 'transfer-in', 'loan'].includes(txn.type);
                        return (
                          <Box key={txn.id}>
                            {i > 0 && <Divider />}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5, px: 1, '&:hover': { bgcolor: 'grey.50' }, borderRadius: i === 0 ? '8px 8px 0 0' : i === recent.length - 1 ? '0 0 8px 8px' : 0, transition: 'background-color 0.15s' }}>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Box sx={{
                                  width: 36, height: 36, borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  bgcolor: isIncoming ? 'rgba(46,125,50,0.10)' : 'rgba(211,47,47,0.10)',
                                  color: isIncoming ? BANK_COLORS.secondary : BANK_COLORS.danger,
                                }}>
                                  {isIncoming ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                                </Box>
                                <Box>
                                  <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>
                                    {txn.type.replace('-', ' ')}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    {new Date(txn.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · {new Date(txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </Typography>
                                </Box>
                              </Stack>
                              <Stack alignItems="flex-end" spacing={0.3}>
                                <Typography variant="body2" fontWeight={700} color={isIncoming ? BANK_COLORS.secondary : BANK_COLORS.danger} sx={{ fontSize: '0.85rem' }}>
                                  {isIncoming ? '+' : '-'}৳{txn.amount.toLocaleString()}
                                </Typography>
                                <Chip
                                  label={txn.pendingApproval ? 'Pending' : txn.status}
                                  size="small"
                                  sx={{
                                    fontSize: '0.6rem', height: 16, fontWeight: 600,
                                    bgcolor: txn.pendingApproval ? 'rgba(255,179,0,0.12)' : txn.status === 'success' ? 'rgba(0,200,83,0.12)' : 'rgba(211,47,47,0.12)',
                                    color: txn.pendingApproval ? BANK_COLORS.warning : txn.status === 'success' ? BANK_COLORS.success : BANK_COLORS.danger,
                                  }}
                                />
                              </Stack>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Right Column */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              {/* Recent Transactions */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif' }}>Recent Transactions</Typography>
                      <Button size="small" onClick={() => navigate('/transactions')} sx={{ fontWeight: 600 }}>View All</Button>
                    </Stack>
                    {recent.length === 0 ? (
                      <Box textAlign="center" py={4}><Typography color="text.secondary">No transactions yet</Typography></Box>
                    ) : (
                      <Stack spacing={0}>
                        <AnimatePresence>
                          {recent.map((txn, i) => (
                            <Box key={txn.id}>
                              {i > 0 && <Divider />}
                              <Stack direction="row" justifyContent="space-between" alignItems="center" py={1.5}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <Box sx={{ bgcolor: `${txColor(txn.type)}15`, borderRadius: 2, p: 1, display: 'flex', color: txColor(txn.type) }}>
                                    {txIcon(txn.type)}
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{txn.type.replace('-', ' ')}</Typography>
                                    <Typography variant="caption" color="text.secondary">{new Date(txn.date).toLocaleDateString()}</Typography>
                                  </Box>
                                </Stack>
                                <Box textAlign="right">
                                  <Typography variant="body2" fontWeight={700} color={txColor(txn.type)}>
                                    {['deposit', 'transfer-in', 'loan'].includes(txn.type) ? '+' : '-'}৳{txn.amount.toLocaleString()}
                                  </Typography>
                                  <Chip label={txn.pendingApproval ? 'Pending' : txn.status} size="small"
                                    sx={{ fontSize: '0.65rem', height: 18, fontWeight: 600, bgcolor: txn.pendingApproval ? 'rgba(255,179,0,0.12)' : txn.status === 'success' ? 'rgba(0,200,83,0.12)' : 'rgba(211,47,47,0.12)', color: txn.pendingApproval ? BANK_COLORS.warning : txn.status === 'success' ? BANK_COLORS.success : BANK_COLORS.danger }} />
                                </Box>
                              </Stack>
                            </Box>
                          ))}
                        </AnimatePresence>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Latest Notifications */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <Bell size={18} color={BANK_COLORS.primary} />
                      <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif' }}>Notifications</Typography>
                    </Stack>
                    {notifications.length === 0 ? (
                      <Box textAlign="center" py={3}><Typography color="text.secondary" variant="body2">No notifications</Typography></Box>
                    ) : (
                      <List sx={{ p: 0 }}>
                        {notifications.map((n, i) => (
                          <Box key={n.id}>
                            {i > 0 && <Divider />}
                            <ListItem sx={{ px: 0, py: 1.5 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <Box sx={{ bgcolor: n.type === 'success' ? 'rgba(0,200,83,0.12)' : n.type === 'warning' ? 'rgba(255,179,0,0.12)' : n.type === 'error' ? 'rgba(211,47,47,0.12)' : 'rgba(15,76,129,0.12)', borderRadius: 2, p: 0.75, color: n.type === 'success' ? BANK_COLORS.success : n.type === 'warning' ? BANK_COLORS.warning : n.type === 'error' ? BANK_COLORS.danger : BANK_COLORS.primary }}>
                                  <Bell size={14} />
                                </Box>
                              </ListItemIcon>
                              <ListItemText
                                primary={<Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>{n.message}</Typography>}
                                secondary={<Typography variant="caption" color="text.secondary">{new Date(n.date).toLocaleDateString()}</Typography>}
                              />
                            </ListItem>
                          </Box>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Stack>
          </Grid>
        </Grid>

        {/* Loan Status Card */}
        {user.loanStatus === 'active' && (
          <Card sx={{ mt: 3, border: '1px solid', borderColor: 'warning.light', borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <CreditCard size={18} color={BANK_COLORS.warning} />
                    <Typography variant="subtitle1" fontWeight={700} color="warning.dark">Active Loan</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    ৳{user.loanAmount?.toLocaleString()} at <strong>{user.loanInterestRate}% monthly</strong> — Monthly interest: <strong>৳{monthlyInterest.toLocaleString()}</strong>
                  </Typography>
                  {pendingInterest > 0 && <Alert severity="error" sx={{ mt: 1, py: 0.5, borderRadius: 3 }}>Unpaid interest: ৳{pendingInterest.toLocaleString()}</Alert>}
                </Box>
                <Stack spacing={1} minWidth={160}>
                  <Button variant="contained" color="warning" size="small" startIcon={<Wallet size={16} />} onClick={() => openAction('pay_interest')} disabled={!user.isActive || user.balance < monthlyInterest}>Pay Interest</Button>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total paid: ৳{(user.interestPaid ?? 0).toLocaleString()}</Typography>
                    {user.loanAmount && user.interestPaid ? <LinearProgress variant="determinate" value={Math.min(100, ((user.interestPaid ?? 0) / (user.loanAmount * 0.5)) * 100)} color="warning" sx={{ mt: 0.5, borderRadius: 4, height: 4 }} /> : null}
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Action Dialog */}
      <Dialog open={actionType !== null && actionType !== 'pay_interest'} onClose={() => setActionType(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>
          {actionType === 'deposit' && 'Deposit Money'}{actionType === 'withdraw' && 'Withdraw Money'}{actionType === 'loan' && 'Apply for Loan'}
        </DialogTitle>
        <DialogContent>
          {actionType === 'deposit' && <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>Deposits require authority approval before being credited.</Alert>}
          <TextField fullWidth label="Amount (৳)" type="number" value={amount} onChange={e => { setAmount(e.target.value); setAmountError(''); }} error={!!amountError} helperText={amountError || (actionType === 'withdraw' ? `Balance: ৳${user.balance.toLocaleString()}` : '')} inputProps={{ min: 1 }} sx={{ mt: 1 }} autoFocus />
          {actionType === 'loan' && (
            <Box mt={2}>
              <Grid container spacing={2} mb={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ bgcolor: 'rgba(46,125,50,0.08)', border: '1px solid', borderColor: 'success.light', borderRadius: 3, p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <ShieldCheck size={16} color={BANK_COLORS.secondary} />
                      <Typography variant="caption" fontWeight={700} color="success.dark">Your Eligibility</Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="success.dark">৳{loanEligibleAmount.toLocaleString()}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ bgcolor: 'rgba(15,76,129,0.06)', borderRadius: 3, p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Info size={16} color={BANK_COLORS.primary} />
                      <Typography variant="caption" fontWeight={700}>Interest Rates</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                      ≤৳50K: 2%/mo · ৳50K–200K: 3%/mo · &gt;৳200K: 4%/mo
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              {loanRequestedAmt > 0 && (
                <Grid container spacing={1.5} mb={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ bgcolor: 'rgba(15,76,129,0.06)', borderRadius: 2.5, p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Requested</Typography>
                      <Typography variant="body2" fontWeight={700}>৳{loanRequestedAmt.toLocaleString()}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ bgcolor: 'rgba(15,76,129,0.06)', borderRadius: 2.5, p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Interest</Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main">{loanAutoRate}%/mo</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ bgcolor: 'rgba(255,179,0,0.08)', borderRadius: 2.5, p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Monthly EMI</Typography>
                      <Typography variant="body2" fontWeight={700} color="warning.dark">৳{loanEstimatedEMI.toLocaleString()}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ bgcolor: 'rgba(15,76,129,0.06)', borderRadius: 2.5, p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Total (12mo)</Typography>
                      <Typography variant="body2" fontWeight={700}>৳{(loanEstimatedEMI * 12).toLocaleString()}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
              {loanExceedsLimit && loanRequestedAmt > 0 && (
                <Box sx={{ bgcolor: 'rgba(255,179,0,0.10)', border: '2px solid', borderColor: 'warning.main', borderRadius: 3, p: 2, mb: 2, display: 'flex', gap: 1.5 }}>
                  <AlertTriangle size={24} color={BANK_COLORS.warning} style={{ flexShrink: 0, marginTop: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="warning.dark">Requested loan exceeds your eligible limit.</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Eligible: ৳{loanEligibleAmount.toLocaleString()} · Requested: ৳{loanRequestedAmt.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setActionType(null)} fullWidth>Cancel</Button>
          <Button variant="contained" onClick={handleActionSubmit} fullWidth disabled={loading}>{loading ? <CircularProgress size={20} /> : 'Continue'}</Button>
        </DialogActions>
      </Dialog>

      {/* Pay Interest Dialog */}
      <Dialog open={actionType === 'pay_interest'} onClose={() => setActionType(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>Pay Monthly Interest</DialogTitle>
        <DialogContent>
          <Box p={2} sx={{ bgcolor: 'rgba(255,179,0,0.08)', borderRadius: 3, border: '1px solid', borderColor: 'warning.light', mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" mb={1}><Typography variant="body2" color="text.secondary">Loan Amount</Typography><Typography variant="body2" fontWeight={600}>৳{user.loanAmount?.toLocaleString()}</Typography></Stack>
            <Stack direction="row" justifyContent="space-between" mb={1}><Typography variant="body2" color="text.secondary">Interest Rate</Typography><Typography variant="body2" fontWeight={600}>{user.loanInterestRate}% per month</Typography></Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between"><Typography variant="body2" fontWeight={700}>Amount Due</Typography><Typography variant="body2" fontWeight={800} color="warning.dark">৳{monthlyInterest.toLocaleString()}</Typography></Stack>
          </Box>
          {amountError && <Alert severity="error" sx={{ mb: 1, borderRadius: 3 }}>{amountError}</Alert>}
          <Typography variant="body2" color="text.secondary">Your balance: ৳{user.balance.toLocaleString()}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setActionType(null)} fullWidth>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleActionSubmit} fullWidth disabled={user.balance < monthlyInterest}>Pay ৳{monthlyInterest.toLocaleString()}</Button>
        </DialogActions>
      </Dialog>

      {/* Mobile Recharge Dialog */}
      <MobileRechargeDialog open={rechargeOpen} onClose={() => setRechargeOpen(false)} />

      <PinModal open={pinOpen} onClose={() => setPinOpen(false)} onConfirm={executeAction} title="Verify PIN" description={`Enter your PIN to ${actionType === 'pay_interest' ? 'pay interest' : actionType}`} error={pinError} />

      {/* Card Deposit Dialog */}
      <Dialog open={cardDepositOpen} onClose={() => setCardDepositOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>Deposit via Card</DialogTitle>
        <DialogContent>
          {cardDepositSuccess ? (
            <Box textAlign="center" py={3}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                <ShieldCheck size={64} color={BANK_COLORS.success} style={{ marginBottom: 12 }} />
              </motion.div>
              <Typography variant="h6" fontWeight={700} gutterBottom>Deposit Successful!</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>৳{cardDepositSuccess.amount.toLocaleString()} has been credited to your account.</Typography>
              <Card variant="outlined" sx={{ maxWidth: 380, mx: 'auto', textAlign: 'left', borderRadius: 3 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Transaction ID</Typography><Typography variant="caption" fontWeight={700} fontFamily="monospace">{cardDepositSuccess.txnId}</Typography></Stack>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Date & Time</Typography><Typography variant="caption" fontWeight={600}>{cardDepositSuccess.timestamp}</Typography></Stack>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Card</Typography><Typography variant="caption" fontWeight={600}>**** {cardDepositSuccess.cardLast4}</Typography></Stack>
                    <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Amount</Typography><Typography variant="caption" fontWeight={700} color="success.main">+৳{cardDepositSuccess.amount.toLocaleString()}</Typography></Stack>
                  </Stack>
                </CardContent>
              </Card>
              <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setCardDepositOpen(false)}>Close</Button>
            </Box>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>Enter card details to deposit funds. If the card is linked to an account in this bank, the amount will be deducted from that account. Cards not linked to any account here are treated as an external top-up simulation.</Alert>
              <Stack spacing={2}>
                <TextField
                  fullWidth label="Card Number" value={cardNumber}
                  onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 16); setCardNumber(v); setCardDepositErrors(p => ({ ...p, cardNumber: '' })); }}
                  error={!!cardDepositErrors.cardNumber} helperText={cardDepositErrors.cardNumber}
                  placeholder="4111 1111 1111 1111" inputProps={{ inputMode: 'numeric' }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CreditCard size={18} /></InputAdornment> }}
                />
                <TextField
                  fullWidth label="Cardholder Name" value={cardHolderName}
                  onChange={e => { setCardHolderName(e.target.value); setCardDepositErrors(p => ({ ...p, cardHolderName: '' })); }}
                  error={!!cardDepositErrors.cardHolderName} helperText={cardDepositErrors.cardHolderName}
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth label="Expiry (MM/YY)" value={cardExpiry}
                    onChange={e => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2); setCardExpiry(v); setCardDepositErrors(p => ({ ...p, cardExpiry: '' })); }}
                    error={!!cardDepositErrors.cardExpiry} helperText={cardDepositErrors.cardExpiry}
                    placeholder="MM/YY"
                  />
                  <TextField
                    fullWidth label="CVV" type="password" value={cardCvv}
                    onChange={e => { setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); setCardDepositErrors(p => ({ ...p, cardCvv: '' })); }}
                    error={!!cardDepositErrors.cardCvv} helperText={cardDepositErrors.cardCvv}
                    inputProps={{ inputMode: 'numeric' }}
                  />
                </Stack>
                <TextField
                  fullWidth label="Deposit Amount (৳)" type="number" value={cardDepositAmount}
                  onChange={e => { setCardDepositAmount(e.target.value); setCardDepositErrors(p => ({ ...p, amount: '' })); }}
                  error={!!cardDepositErrors.amount} helperText={cardDepositErrors.amount}
                  inputProps={{ min: 100 }}
                />
              </Stack>
            </>
          )}
        </DialogContent>
        {!cardDepositSuccess && (
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" onClick={() => setCardDepositOpen(false)} fullWidth>Cancel</Button>
            <Button variant="contained" color="primary" onClick={() => {
              const errs: Record<string, string> = {};
              if (cardNumber.replace(/\D/g, '').length < 16) errs.cardNumber = 'Enter a valid 16-digit card number';
              if (!cardHolderName.trim()) errs.cardHolderName = 'Enter cardholder name';
              if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) errs.cardExpiry = 'Enter expiry as MM/YY';
              else { const [m] = cardExpiry.split('/').map(Number); if (m < 1 || m > 12) errs.cardExpiry = 'Invalid month'; }
              if (cardCvv.length < 3) errs.cardCvv = 'Enter 3-4 digit CVV';
              const amt = parseFloat(cardDepositAmount);
              if (!cardDepositAmount || isNaN(amt) || amt < 100) errs.amount = 'Minimum deposit is ৳100';

              // If this card number belongs to a real card in the system, validate it fully
              // and make sure the linked account actually has the funds to send.
              if (Object.keys(errs).length === 0) {
                const linkedCard = getCardByNumber(cardNumber);
                if (linkedCard) {
                  if (linkedCard.accountNumber === user.accountNumber) {
                    errs.cardNumber = 'You cannot deposit into your own account using your own card. Use ATM Deposit from Cards instead.';
                  } else if (linkedCard.holderName.trim().toLowerCase() !== cardHolderName.trim().toLowerCase()) {
                    errs.cardHolderName = 'Cardholder name does not match our records';
                  } else if (linkedCard.expiry !== cardExpiry) {
                    errs.cardExpiry = 'Expiry does not match our records';
                  } else if (linkedCard.cvv !== cardCvv) {
                    errs.cardCvv = 'Incorrect CVV';
                  } else if (linkedCard.status !== 'active') {
                    errs.cardNumber = `This card is ${linkedCard.status} and cannot be used.`;
                  } else {
                    const linkedAccount = getUserByAccount(linkedCard.accountNumber);
                    const available = linkedCard.type === 'credit'
                      ? (linkedCard.creditLimit ?? 0) - (linkedCard.currentBalance ?? 0)
                      : (linkedAccount?.balance ?? 0);
                    if (!linkedAccount || amt > available) {
                      errs.amount = 'Insufficient balance on the linked card account';
                    }
                  }
                }
              }

              setCardDepositErrors(errs);
              if (Object.keys(errs).length === 0) setCardDepositConfirmOpen(true);
            }} fullWidth>Continue</Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Card Deposit Confirmation */}
      <Dialog open={cardDepositConfirmOpen} onClose={() => setCardDepositConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>Confirm Card Deposit</DialogTitle>
        <DialogContent>
          <Box sx={{ bgcolor: 'rgba(15,76,129,0.06)', borderRadius: 3, p: 2.5, mb: 2 }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Card</Typography><Typography variant="body2" fontWeight={600} fontFamily="monospace">**** {cardNumber.slice(12)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Cardholder</Typography><Typography variant="body2" fontWeight={600}>{cardHolderName}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Expiry</Typography><Typography variant="body2" fontWeight={600}>{cardExpiry}</Typography></Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2" fontWeight={700}>Deposit Amount</Typography><Typography variant="subtitle2" fontWeight={700} color="success.main">৳{parseFloat(cardDepositAmount || '0').toLocaleString()}</Typography></Stack>
            </Stack>
          </Box>
          <Alert severity="warning" sx={{ borderRadius: 3 }}><Typography variant="caption">{getCardByNumber(cardNumber) ? 'The deposit amount will be deducted from the linked card\'s account.' : 'This card is not linked to any account here — this is a frontend simulation and no real payment is processed.'}</Typography></Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setCardDepositConfirmOpen(false)} fullWidth>Cancel</Button>
          <Button variant="contained" color="success" disabled={loading} onClick={() => {
            setLoading(true);
            setTimeout(() => {
              const amt = parseFloat(cardDepositAmount);
              const txnId = 'CD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

              const linkedCard = getCardByNumber(cardNumber);
              if (linkedCard) {
                const linkedAccount = getUserByAccount(linkedCard.accountNumber);
                if (linkedAccount) {
                  if (linkedCard.type === 'credit') {
                    updateCard(linkedCard.id, { currentBalance: (linkedCard.currentBalance ?? 0) + amt });
                  } else {
                    updateUser(linkedAccount.id, { balance: linkedAccount.balance - amt });
                  }
                  addTransaction({ accountNumber: linkedCard.accountNumber, type: 'withdraw', amount: amt, status: 'success', description: `Card deposit sent to ${user.accountNumber} via **** ${cardNumber.slice(12)}` });
                  addNotification({ accountNumber: linkedCard.accountNumber, message: `৳${amt.toLocaleString()} was deducted from your account via card **** ${cardNumber.slice(12)} deposit to another account.`, type: 'warning' });
                }
              }

              updateUser(user.id, { balance: user.balance + amt });
              addTransaction({ accountNumber: user.accountNumber, type: 'deposit', amount: amt, status: 'success', description: `Card deposit via **** ${cardNumber.slice(12)}` });
              addNotification({ accountNumber: user.accountNumber, message: `৳${amt.toLocaleString()} deposited via card **** ${cardNumber.slice(12)}.`, type: 'success' });
              refreshUser();
              setCardDepositSuccess({ txnId, timestamp: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }), amount: amt, cardLast4: cardNumber.slice(12) });
              setCardDepositConfirmOpen(false);
              setLoading(false);
            }, 1000);
          }} fullWidth>{loading ? <CircularProgress size={20} /> : 'Confirm Deposit'}</Button>
        </DialogActions>
      </Dialog>
    </CustomerLayout>
  );
}

function PieMini({ data }: { data: { name: string; value: number; color: string } }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ bgcolor: `${data.color}10`, borderRadius: 2, px: 1.5, py: 0.75 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: data.color }} />
      <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>{data.name}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>৳{data.value.toLocaleString()}</Typography>
    </Stack>
  );
}
