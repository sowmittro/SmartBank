import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Stack, Grid, LinearProgress, Alert,
  TextField, CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Landmark, TrendingUp, AlertTriangle, Calendar, Wallet, Percent,
  CheckCircle2, ShieldCheck, Info,
} from 'lucide-react';
import CustomerLayout from '../components/CustomerLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getUserById, updateUser, addTransaction, addNotification, getInterestRateForAmount, getTransactionsByAccount } from '../utils/localStorageDB';
import { BANK_COLORS } from '../theme';

export default function Loans() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [loanAmount, setLoanAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const currentUser = user ? getUserById(user.id) : null;
  if (!currentUser) return null;

  const loanActive = currentUser.loanStatus === 'active';
  const loanAmountVal = currentUser.loanAmount ?? 0;
  const interestRate = currentUser.loanInterestRate ?? 0;
  const monthlyEMI = Math.round((loanAmountVal * interestRate) / 100);
  const pendingInterest = currentUser.pendingInterest ?? 0;
  const interestPaid = currentUser.interestPaid ?? 0;
  const totalInterestExpected = loanActive ? Math.round(loanAmountVal * interestRate / 100 * 12) : 0;
  const progress = loanActive && totalInterestExpected > 0 ? Math.min(100, (interestPaid / totalInterestExpected) * 100) : 0;

  // Eligibility: based on transaction history and balance
  const transactions = getTransactionsByAccount(currentUser.accountNumber);
  const totalDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const eligibleAmount = Math.min(500000, Math.max(10000, Math.round((currentUser.balance + totalDeposits) * 2)));

  const requestedAmt = parseFloat(loanAmount) || 0;
  const exceedsLimit = requestedAmt > eligibleAmount;
  const autoRate = requestedAmt > 0 ? getInterestRateForAmount(requestedAmt) : 0;
  const estimatedEMI = requestedAmt > 0 ? Math.round((requestedAmt * autoRate) / 100) : 0;

  const handleApplyLoan = () => {
    if (requestedAmt <= 0) return;
    setLoading(true);
    setTimeout(() => {
      const rate = getInterestRateForAmount(requestedAmt);
      const dueDate = new Date(); dueDate.setMonth(dueDate.getMonth() + 1);
      updateUser(currentUser.id, {
        balance: currentUser.balance + requestedAmt,
        loanAmount: requestedAmt, loanInterestRate: rate,
        loanStartDate: new Date().toISOString(), loanDueDate: dueDate.toISOString(),
        loanStatus: 'active', interestPaid: 0, pendingInterest: 0,
      });
      addTransaction({ accountNumber: currentUser.accountNumber, type: 'loan', amount: requestedAmt, status: 'success', description: `Loan of ৳${requestedAmt.toLocaleString()} at ${rate}% monthly interest` });
      addNotification({ accountNumber: currentUser.accountNumber, message: `Loan of ৳${requestedAmt.toLocaleString()} disbursed at ${rate}% monthly interest.`, type: 'success' });
      refreshUser();
      setLoading(false);
      toast.showSuccess(`Loan of ৳${requestedAmt.toLocaleString()} approved at ${rate}% monthly interest.`);
      setLoanAmount('');
    }, 800);
  };

  const handlePayInterest = () => {
    if (pendingInterest <= 0 || currentUser.balance < pendingInterest) return;
    updateUser(currentUser.id, {
      balance: currentUser.balance - pendingInterest, pendingInterest: 0,
      interestPaid: interestPaid + pendingInterest, lastInterestPaidDate: new Date().toISOString(),
    });
    addTransaction({ accountNumber: currentUser.accountNumber, type: 'interest', amount: pendingInterest, status: 'success', description: `Manual loan interest payment of ৳${pendingInterest.toLocaleString()}` });
    addNotification({ accountNumber: currentUser.accountNumber, message: `Loan interest of ৳${pendingInterest.toLocaleString()} paid successfully.`, type: 'success' });
    refreshUser();
    toast.showSuccess(`Interest of ৳${pendingInterest.toLocaleString()} paid successfully.`);
  };

  const handleRepayLoan = () => {
    if (loanAmountVal <= 0 || currentUser.balance < loanAmountVal) return;
    updateUser(currentUser.id, {
      balance: currentUser.balance - loanAmountVal, loanAmount: 0, loanStatus: 'paid',
      loanInterestRate: 0, loanDueDate: undefined, pendingInterest: 0,
    });
    addTransaction({ accountNumber: currentUser.accountNumber, type: 'loan', amount: loanAmountVal, status: 'success', description: `Full loan repayment of ৳${loanAmountVal.toLocaleString()}` });
    addNotification({ accountNumber: currentUser.accountNumber, message: `Loan of ৳${loanAmountVal.toLocaleString()} fully repaid. Congratulations!`, type: 'success' });
    refreshUser();
    toast.showSuccess(`Loan of ৳${loanAmountVal.toLocaleString()} fully repaid.`);
  };

  return (
    <CustomerLayout>
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif', mb: 3 }}>
          Loan Dashboard
        </Typography>


        {loanActive ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Large Loan Card */}
            <Card sx={{
              mb: 3, borderRadius: 4, overflow: 'hidden', border: 'none',
              background: 'linear-gradient(135deg, #0F4C81 0%, #0A3A64 50%, #072842 100%)',
              color: 'white', position: 'relative',
            }}>
              <Box sx={{
                position: 'absolute', top: -60, right: -60, width: 220, height: 220,
                borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
              }} />
              <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={3}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                      <Landmark size={24} color="white" />
                      <Typography variant="h5" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif' }}>Active Loan</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>Your current loan details and repayment status</Typography>
                  </Box>
                  <Chip label="Active" sx={{ bgcolor: 'rgba(255,179,0,0.20)', color: '#FFB300', fontWeight: 700, border: '1px solid rgba(255,179,0,0.30)' }} />
                </Stack>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', borderRadius: 3, p: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Wallet size={14} style={{ opacity: 0.7 }} />
                        <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600 }}>Loan Amount</Typography>
                      </Stack>
                      <Typography variant="h5" fontWeight={700}>৳{loanAmountVal.toLocaleString()}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', borderRadius: 3, p: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Percent size={14} style={{ opacity: 0.7 }} />
                        <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600 }}>Interest Rate</Typography>
                      </Stack>
                      <Typography variant="h5" fontWeight={700}>{interestRate}%<Typography component="span" variant="caption" sx={{ opacity: 0.6 }}> /mo</Typography></Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', borderRadius: 3, p: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <TrendingUp size={14} style={{ opacity: 0.7 }} />
                        <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600 }}>Monthly EMI</Typography>
                      </Stack>
                      <Typography variant="h5" fontWeight={700}>৳{monthlyEMI.toLocaleString()}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', borderRadius: 3, p: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Calendar size={14} style={{ opacity: 0.7 }} />
                        <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600 }}>Due Date</Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={700}>{currentUser.loanDueDate ? new Date(currentUser.loanDueDate).toLocaleDateString('en', { day: 'numeric', month: 'short' }) : 'N/A'}</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box mt={3}>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Repayment Progress</Typography>
                    <Typography variant="caption" fontWeight={700}>{progress.toFixed(0)}%</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate" value={progress}
                    sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.10)', '& .MuiLinearProgress-bar': { borderRadius: 4, background: 'linear-gradient(90deg, #00C853 0%, #4CAF50 100%)' } }}
                  />
                  <Stack direction="row" spacing={3} mt={1.5}>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>Interest Paid: ৳{interestPaid.toLocaleString()}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>Remaining: ৳{Math.max(0, totalInterestExpected - interestPaid).toLocaleString()}</Typography>
                  </Stack>
                </Box>

                {pendingInterest > 0 && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 3, bgcolor: 'rgba(211,47,47,0.15)', color: '#FCA5A5', '& .MuiAlert-icon': { color: '#FCA5A5' } }}>
                    Unpaid Interest: ৳{pendingInterest.toLocaleString()} — Please pay to avoid penalties.
                  </Alert>
                )}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={3}>
                  <Button variant="contained" color="warning" onClick={handlePayInterest} disabled={pendingInterest <= 0 || currentUser.balance < pendingInterest}
                    startIcon={<Wallet size={18} />} sx={{ bgcolor: '#FFB300', '&:hover': { bgcolor: '#FFA000' } }}>
                    Pay Interest ৳{pendingInterest.toLocaleString()}
                  </Button>
                  <Button variant="outlined" onClick={handleRepayLoan} disabled={currentUser.balance < loanAmountVal}
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.30)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}>
                    Repay Full Loan ৳{loanAmountVal.toLocaleString()}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Loan Application Card */}
            <Card sx={{ mb: 3, borderRadius: 4 }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                  <Box sx={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1B6CA8 100%)', borderRadius: 3, p: 1.25, display: 'flex', boxShadow: '0 4px 12px rgba(15,76,129,0.20)' }}>
                    <Landmark size={22} color="white" />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif' }}>Apply for a Loan</Typography>
                    <Typography variant="caption" color="text.secondary">Get instant loans with competitive interest rates</Typography>
                  </Box>
                </Stack>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ bgcolor: 'rgba(46,125,50,0.08)', border: '1px solid', borderColor: 'success.light', borderRadius: 3, p: 2.5, mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <ShieldCheck size={18} color={BANK_COLORS.secondary} />
                        <Typography variant="subtitle2" fontWeight={700} color="success.dark">Your Eligibility</Typography>
                      </Stack>
                      <Typography variant="h4" fontWeight={700} color="success.dark" sx={{ fontFamily: '"Poppins", sans-serif' }}>
                        ৳{eligibleAmount.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Maximum loan amount based on your profile</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ bgcolor: 'rgba(15,76,129,0.06)', borderRadius: 3, p: 2.5, mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <Info size={18} color={BANK_COLORS.primary} />
                        <Typography variant="subtitle2" fontWeight={700}>Interest Rates</Typography>
                      </Stack>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">Up to ৳50,000: <strong>2% per month</strong></Typography>
                        <Typography variant="body2">৳50,001–৳200,000: <strong>3% per month</strong></Typography>
                        <Typography variant="body2">Above ৳200,000: <strong>4% per month</strong></Typography>
                      </Stack>
                    </Box>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth label="Requested Loan Amount (৳)" type="number" value={loanAmount}
                  onChange={e => setLoanAmount(e.target.value)}
                  inputProps={{ min: 1, max: 500000 }}
                  sx={{ mb: 2 }}
                  helperText={`Eligible: ৳${eligibleAmount.toLocaleString()} · Your balance: ৳${currentUser.balance.toLocaleString()}`}
                />

                {requestedAmt > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <Grid container spacing={2} mb={2}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ bgcolor: 'rgba(15,76,129,0.06)', borderRadius: 2.5, p: 1.5, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>Requested</Typography>
                          <Typography variant="body1" fontWeight={700}>৳{requestedAmt.toLocaleString()}</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ bgcolor: 'rgba(15,76,129,0.06)', borderRadius: 2.5, p: 1.5, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>Interest</Typography>
                          <Typography variant="body1" fontWeight={700} color="primary.main">{autoRate}%/mo</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ bgcolor: 'rgba(255,179,0,0.08)', borderRadius: 2.5, p: 1.5, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>Monthly EMI</Typography>
                          <Typography variant="body1" fontWeight={700} color="warning.dark">৳{estimatedEMI.toLocaleString()}</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ bgcolor: 'rgba(15,76,129,0.06)', borderRadius: 2.5, p: 1.5, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Interest (12mo)</Typography>
                          <Typography variant="body1" fontWeight={700}>৳{(estimatedEMI * 12).toLocaleString()}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </motion.div>
                )}

                {/* Risk Indicator - Warning Card */}
                {exceedsLimit && requestedAmt > 0 && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{
                      bgcolor: 'rgba(255,179,0,0.10)',
                      border: '2px solid', borderColor: 'warning.main',
                      borderRadius: 3, p: 3, mb: 2,
                      display: 'flex', gap: 2,
                    }}>
                        <AlertTriangle size={28} color={BANK_COLORS.warning} style={{ flexShrink: 0, marginTop: 2 }} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700} color="warning.dark" sx={{ fontFamily: '"Poppins", sans-serif' }}>
                            Requested loan exceeds your eligible limit.
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Based on your transaction history, we recommend applying for a lower amount.
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            High loan amounts may increase your repayment risk.
                          </Typography>
                          <Typography variant="caption" fontWeight={700} color="warning.dark" sx={{ display: 'block', mt: 1 }}>
                            Your eligible limit: ৳{eligibleAmount.toLocaleString()} · Requested: ৳{requestedAmt.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                  </motion.div>
                )}

                <Button
                  variant="contained" fullWidth size="large"
                  onClick={handleApplyLoan}
                  disabled={loading || requestedAmt <= 0}
                  startIcon={loading ? undefined : <CheckCircle2 size={20} />}
                  sx={{ minHeight: 52 }}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Apply for Loan'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Loan History */}
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif', mb: 2 }}>Loan History</Typography>
            <Box textAlign="center" py={3}>
              <Landmark size={40} color="#CBD5E1" style={{ margin: '0 auto' }} />
              <Typography variant="body2" color="text.secondary" mt={1}>
                {loanActive ? 'Your loan is active. Repay to view full history.' : 'No loan history yet. Apply for a loan to get started.'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </CustomerLayout>
  );
}
