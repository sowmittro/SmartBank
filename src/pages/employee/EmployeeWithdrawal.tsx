import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Stack, TextField, Typography, Alert, Divider,
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import EmployeeLayout from '../../components/EmployeeLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getUserByAccount, updateUser, addTransaction, addNotification } from '../../utils/localStorageDB';
import { validateAmount } from '../../utils/validators';

export default function EmployeeWithdrawal() {
  const { user } = useAuth();
  const toast = useToast();
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<{ name: string; accountNumber: string; balance: number } | null>(null);
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
    setCustomer({ name: c.name, accountNumber: c.accountNumber, balance: c.balance });
  };

  const handleSubmit = () => {
    setError('');
    if (!customer) { setError('Please verify the customer account first'); return; }
    const c = getUserByAccount(accountNumber.trim());
    if (!c) { setError('Customer not found'); return; }
    const amtErr = validateAmount(amount, c.balance);
    if (amtErr) { setAmountError(amtErr); return; }
    const amt = parseFloat(amount);
    updateUser(c.id, { balance: c.balance - amt });
    addTransaction({
      accountNumber: c.accountNumber,
      type: 'withdraw',
      amount: amt,
      status: 'success',
      pendingApproval: false,
      approvedBy: user?.id,
      description: description || `Cash withdrawal by ${user?.name ?? 'employee'}`,
    });
    addNotification({
      accountNumber: c.accountNumber,
      message: `৳${amt.toLocaleString()} has been withdrawn from your account. New balance: ৳${(c.balance - amt).toLocaleString()}.`,
      type: 'warning',
    });
    toast.showSuccess(`৳${amt.toLocaleString()} withdrawn from ${c.name} successfully.`);
    setCustomer({ name: c.name, accountNumber: c.accountNumber, balance: c.balance - amt });
    setAmount('');
    setDescription('');
    setAmountError('');
  };

  return (
    <EmployeeLayout title="Withdrawal">
      <Box maxWidth={640} mx="auto">
        <Typography variant="h5" fontWeight={700} mb={0.5}>Cash Withdrawal</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Process a cash withdrawal from a customer's account.</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
              <Box sx={{ bgcolor: 'error.main', borderRadius: 2, p: 1, display: 'flex' }}>
                <RemoveIcon sx={{ color: 'white' }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>Withdrawal Form</Typography>
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
              <Box sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.main', borderRadius: 2, p: 2, mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="error.dark">Customer Verified</Typography>
                    <Typography fontWeight={700} color="error.dark">{customer.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{customer.accountNumber}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">Available Balance</Typography>
                    <Typography variant="h6" fontWeight={700} color="error.dark">৳{customer.balance.toLocaleString()}</Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Amount (৳)"
                  type="number"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setAmountError(''); }}
                  error={!!amountError}
                  helperText={amountError}
                  inputProps={{ min: 1 }}
                  disabled={!customer}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Description (optional)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Cash withdrawal"
                  disabled={!customer}
                />
              </Grid>
            </Grid>

            <Button variant="contained" color="error" size="large" sx={{ mt: 3 }} onClick={handleSubmit} disabled={!customer}>
              Process Withdrawal
            </Button>
          </CardContent>
        </Card>
      </Box>
    </EmployeeLayout>
  );
}
