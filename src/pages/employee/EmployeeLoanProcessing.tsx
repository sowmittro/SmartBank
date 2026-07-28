import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Stack, TextField, Typography, Alert, Chip, Divider, MenuItem, FormControl, InputLabel, Select,
} from '@mui/material';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import EmployeeLayout from '../../components/EmployeeLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getUserByAccount, updateUser, addTransaction, addNotification, getInterestRateForAmount,
} from '../../utils/localStorageDB';
import { validateAmount, validateRequired } from '../../utils/validators';

export default function EmployeeLoanProcessing() {
  const { user } = useAuth();
  const toast = useToast();
  const [accountNumber, setAccountNumber] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTerm, setLoanTerm] = useState('12');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<{
    name: string; accountNumber: string; balance: number; loanStatus?: string | null; loanAmount?: number;
  } | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [amountError, setAmountError] = useState('');

  const lookup = () => {
    setLookupError('');
    setCustomer(null);
    if (!accountNumber.trim()) { setLookupError('Enter an account number'); return; }
    const c = getUserByAccount(accountNumber.trim());
    if (!c || c.role !== 'user') { setLookupError('Customer account not found'); return; }
    if (!c.isApproved) { setLookupError('Customer is pending admin approval'); return; }
    if (!c.isActive) { setLookupError('Customer account is frozen'); return; }
    setCustomer({ name: c.name, accountNumber: c.accountNumber, balance: c.balance, loanStatus: c.loanStatus, loanAmount: c.loanAmount });
  };

  const rate = loanAmount ? getInterestRateForAmount(parseFloat(loanAmount)) : 0;

  const handleSubmit = () => {
    setError('');
    if (!customer) { setError('Verify the customer account first'); return; }
    const c = getUserByAccount(accountNumber.trim());
    if (!c) { setError('Customer not found'); return; }
    if (c.loanStatus === 'active') { setError('Customer already has an active loan'); return; }
    const amtErr = validateAmount(loanAmount);
    if (amtErr) { setAmountError(amtErr); return; }
    const termErr = validateRequired(loanTerm, 'Loan term');
    if (termErr) { setError(termErr); return; }
    const amt = parseFloat(loanAmount);
    const interestRate = getInterestRateForAmount(amt);
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);
    updateUser(c.id, {
      balance: c.balance + amt,
      loanAmount: amt,
      loanInterestRate: interestRate,
      loanStartDate: new Date().toISOString(),
      loanDueDate: dueDate.toISOString(),
      loanStatus: 'active',
      interestPaid: 0,
      pendingInterest: 0,
    });
    addTransaction({
      accountNumber: c.accountNumber,
      type: 'loan',
      amount: amt,
      status: 'success',
      pendingApproval: false,
      approvedBy: user?.id,
      description: description || `Loan approved — ${loanTerm} months at ${interestRate}% p.m.`,
    });
    addNotification({
      accountNumber: c.accountNumber,
      message: `Your loan of ৳${amt.toLocaleString()} has been approved at ${interestRate}% p.m. interest. Amount credited to your account.`,
      type: 'success',
    });
    toast.showSuccess(`Loan of ৳${amt.toLocaleString()} approved for ${c.name} at ${interestRate}% p.m.`);
    setCustomer({ name: c.name, accountNumber: c.accountNumber, balance: c.balance + amt, loanStatus: 'active', loanAmount: amt });
    setLoanAmount('');
    setDescription('');
    setAmountError('');
  };

  return (
    <EmployeeLayout title="Loan Processing">
      <Box maxWidth={680} mx="auto">
        <Typography variant="h5" fontWeight={700} mb={0.5}>Loan Processing</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Approve and disburse a loan for a customer.</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
              <Box sx={{ bgcolor: 'secondary.main', borderRadius: 2, p: 1, display: 'flex' }}>
                <CreditScoreIcon sx={{ color: 'white' }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>Loan Application</Typography>
            </Stack>

            <Stack direction="row" spacing={1} mb={2}>
              <TextField
                fullWidth
                label="Customer Account Number"
                value={accountNumber}
                onChange={e => { setAccountNumber(e.target.value); setLookupError(''); setCustomer(null); }}
                error={!!lookupError}
                helperText={lookupError}
                placeholder="1234567890"
                inputProps={{ inputMode: 'numeric' }}
              />
              <Button variant="outlined" onClick={lookup} startIcon={<PersonSearchIcon />} sx={{ minWidth: 100, whiteSpace: 'nowrap' }}>
                Verify
              </Button>
            </Stack>

            {customer && (
              <Box sx={{ bgcolor: 'secondary.50', border: '1px solid', borderColor: 'secondary.main', borderRadius: 2, p: 2, mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="secondary.dark">Customer Verified</Typography>
                    <Typography fontWeight={700} color="secondary.dark">{customer.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{customer.accountNumber}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">Current Balance</Typography>
                    <Typography variant="h6" fontWeight={700} color="secondary.dark">৳{customer.balance.toLocaleString()}</Typography>
                    {customer.loanStatus === 'active' && <Chip label="Has Active Loan" size="small" color="warning" sx={{ mt: 0.5 }} />}
                  </Box>
                </Stack>
              </Box>
            )}

            {customer && customer.loanStatus !== 'active' && (
              <>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Loan Amount (৳)"
                      type="number"
                      value={loanAmount}
                      onChange={e => { setLoanAmount(e.target.value); setAmountError(''); }}
                      error={!!amountError}
                      helperText={amountError}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Loan Term (months)</InputLabel>
                      <Select value={loanTerm} label="Loan Term (months)" onChange={e => setLoanTerm(e.target.value)}>
                        <MenuItem value="6">6 months</MenuItem>
                        <MenuItem value="12">12 months</MenuItem>
                        <MenuItem value="24">24 months</MenuItem>
                        <MenuItem value="36">36 months</MenuItem>
                        <MenuItem value="60">60 months</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Description (optional)"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Personal loan"
                    />
                  </Grid>
                </Grid>

                {loanAmount && parseFloat(loanAmount) > 0 && (
                  <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, mt: 2 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Interest Rate (auto-calculated)</Typography>
                      <Typography variant="body2" fontWeight={700} color="secondary.dark">{rate}% per month</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Monthly Interest</Typography>
                      <Typography variant="body2" fontWeight={700}>৳{Math.round((parseFloat(loanAmount || '0') * rate) / 100).toLocaleString()}</Typography>
                    </Stack>
                  </Box>
                )}

                <Button variant="contained" color="secondary" size="large" sx={{ mt: 3 }} onClick={handleSubmit}>
                  Approve & Disburse Loan
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </EmployeeLayout>
  );
}
