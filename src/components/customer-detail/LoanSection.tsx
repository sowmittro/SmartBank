import { useMemo } from 'react';
import {
  Box, Card, CardContent, Stack, Typography, Chip, Grid, Divider,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  AccountBalance as LoanIcon, Percent as PercentIcon,
  Payments as PaymentsIcon, TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { User } from '../../utils/localStorageDB';
import { getTransactionsByAccount } from '../../utils/localStorageDB';

const fmtCur = (n: number) => `৳${(n ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function LoanSection({ user }: { user: User }) {
  const loanTxns = useMemo(() => {
    return getTransactionsByAccount(user.accountNumber)
      .filter(t => t.type === 'loan' || t.type === 'interest')
      .reverse();
  }, [user.accountNumber]);

  if (!user.loanStatus || user.loanStatus === 'paid' || !user.loanAmount) {
    return (
      <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <LoanIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary" variant="body2">
            {user.loanStatus === 'paid' ? 'Loan has been fully repaid.' : 'No active loan for this customer.'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const monthlyEMI = (user.loanAmount * (user.loanInterestRate ?? 0)) / 100;
  const totalInterestExpected = monthlyEMI * 12;
  const progress = totalInterestExpected > 0 ? Math.min(100, ((user.interestPaid ?? 0) / totalInterestExpected) * 100) : 0;
  const remaining = user.loanAmount - (user.interestPaid ?? 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Loan Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ bgcolor: 'primary.50', borderRadius: 2, p: 1.25, display: 'flex' }}>
                  <LoanIcon color="primary" fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>Approved Amount</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">{fmtCur(user.loanAmount)}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ bgcolor: 'error.50', borderRadius: 2, p: 1.25, display: 'flex' }}>
                  <TrendingUpIcon color="error" fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>Remaining Balance</Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main">{fmtCur(remaining)}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ bgcolor: 'warning.50', borderRadius: 2, p: 1.25, display: 'flex' }}>
                  <PercentIcon color="warning" fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>Interest Rate</Typography>
                  <Typography variant="h6" fontWeight={700} color="warning.main">{user.loanInterestRate}%</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ bgcolor: 'success.50', borderRadius: 2, p: 1.25, display: 'flex' }}>
                  <PaymentsIcon color="success" fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>Monthly EMI</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">{fmtCur(monthlyEMI)}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Loan Details + Progress */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Loan Details</Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Loan Type</Typography>
                  <Typography variant="body2" fontWeight={600}>Personal Loan</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Approved Amount</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmtCur(user.loanAmount)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Interest Rate (Monthly)</Typography>
                  <Typography variant="body2" fontWeight={600}>{user.loanInterestRate}%</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Monthly EMI</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmtCur(monthlyEMI)}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Start Date</Typography>
                  <Typography variant="body2" fontWeight={600}>{user.loanStartDate ? new Date(user.loanStartDate).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Next Due Date</Typography>
                  <Typography variant="body2" fontWeight={600} color="warning.main">{user.loanDueDate ? new Date(user.loanDueDate).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Loan Status</Typography>
                  <Chip size="small" label={user.loanStatus === 'active' ? 'Active' : 'Paid'} color={user.loanStatus === 'active' ? 'warning' : 'success'} variant="outlined" />
                </Stack>
                {(user.pendingInterest ?? 0) > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Pending Interest</Typography>
                    <Typography variant="body2" fontWeight={600} color="error.main">{fmtCur(user.pendingInterest ?? 0)}</Typography>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Loan Progress</Typography>
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">Interest Paid</Typography>
                  <Typography variant="caption" fontWeight={700} color="primary.main">{progress.toFixed(1)}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 12, borderRadius: 6 }} />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">৳{Math.round(user.interestPaid ?? 0).toLocaleString()} paid</Typography>
                  <Typography variant="caption" color="text.secondary">৳{Math.round(totalInterestExpected).toLocaleString()} total</Typography>
                </Stack>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Total Interest Expected (12 mo)</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmtCur(totalInterestExpected)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Interest Paid So Far</Typography>
                  <Typography variant="body2" fontWeight={600} color="success.main">{fmtCur(user.interestPaid ?? 0)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Remaining Principal</Typography>
                  <Typography variant="body2" fontWeight={600} color="error.main">{fmtCur(remaining)}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment History */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Payment History</Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.default' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Transaction ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loanTxns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>
                          <Typography color="text.secondary" variant="body2">No loan payments recorded.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : loanTxns.map((t, i) => (
                      <TableRow key={t.id ?? i} hover>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{new Date(t.date).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}</Typography>
                        </TableCell>
                        <TableCell><Typography variant="caption" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{t.id?.slice(0, 12) ?? '—'}</Typography></TableCell>
                        <TableCell>
                          <Chip size="small" label={t.type === 'loan' ? 'Loan Disbursement' : 'Interest Payment'} variant="outlined" color={t.type === 'loan' ? 'primary' : 'success'} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="success.main">+{fmtCur(t.amount)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={t.status} color={t.status === 'success' ? 'success' : t.status === 'pending' ? 'warning' : 'error'} variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </motion.div>
  );
}
