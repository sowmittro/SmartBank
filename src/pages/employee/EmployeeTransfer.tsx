import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Stack, TextField, Typography, Alert, Divider,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import EmployeeLayout from '../../components/EmployeeLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getUserByAccount, updateUser, addTransaction, addNotification } from '../../utils/localStorageDB';
import { validateAmount } from '../../utils/validators';

export default function EmployeeTransfer() {
  const { user } = useAuth();
  const toast = useToast();
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [fromCustomer, setFromCustomer] = useState<{ name: string; accountNumber: string; balance: number } | null>(null);
  const [toCustomer, setToCustomer] = useState<{ name: string; accountNumber: string } | null>(null);
  const [fromLookupError, setFromLookupError] = useState('');
  const [toLookupError, setToLookupError] = useState('');
  const [amountError, setAmountError] = useState('');

  const lookupFrom = () => {
    setFromLookupError('');
    setFromCustomer(null);
    if (!fromAccount.trim()) { setFromLookupError('Enter an account number'); return; }
    const c = getUserByAccount(fromAccount.trim());
    if (!c || c.role !== 'user') { setFromLookupError('Customer account not found'); return; }
    if (!c.isApproved) { setFromLookupError('Customer is pending admin approval'); return; }
    if (!c.isActive) { setFromLookupError('Sender account is frozen'); return; }
    setFromCustomer({ name: c.name, accountNumber: c.accountNumber, balance: c.balance });
  };

  const lookupTo = () => {
    setToLookupError('');
    setToCustomer(null);
    if (!toAccount.trim()) { setToLookupError('Enter an account number'); return; }
    if (toAccount.trim() === fromAccount.trim()) { setToLookupError('Cannot transfer to the same account'); return; }
    const c = getUserByAccount(toAccount.trim());
    if (!c || c.role === 'admin') { setToLookupError('Recipient account not found'); return; }
    if (!c.isActive) { setToLookupError('Recipient account is frozen'); return; }
    setToCustomer({ name: c.name, accountNumber: c.accountNumber });
  };

  const handleSubmit = () => {
    setError('');
    if (!fromCustomer) { setError('Verify the sender account first'); return; }
    if (!toCustomer) { setError('Verify the recipient account first'); return; }
    const sender = getUserByAccount(fromAccount.trim());
    if (!sender) { setError('Sender not found'); return; }
    const amtErr = validateAmount(amount, sender.balance);
    if (amtErr) { setAmountError(amtErr); return; }
    const recipient = getUserByAccount(toAccount.trim());
    if (!recipient) { setError('Recipient not found'); return; }
    const amt = parseFloat(amount);
    updateUser(sender.id, { balance: sender.balance - amt });
    updateUser(recipient.id, { balance: recipient.balance + amt });
    addTransaction({
      accountNumber: sender.accountNumber,
      type: 'transfer-out',
      amount: amt,
      toAccount: recipient.accountNumber,
      status: 'success',
      pendingApproval: false,
      approvedBy: user?.id,
      description: description || `Transfer to ${recipient.name} (processed by ${user?.name ?? 'employee'})`,
    });
    addTransaction({
      accountNumber: recipient.accountNumber,
      type: 'transfer-in',
      amount: amt,
      fromAccount: sender.accountNumber,
      status: 'success',
      pendingApproval: false,
      description: `Transfer from ${sender.name} (processed by ${user?.name ?? 'employee'})`,
    });
    addNotification({
      accountNumber: sender.accountNumber,
      message: `৳${amt.toLocaleString()} transferred to ${recipient.name}. New balance: ৳${(sender.balance - amt).toLocaleString()}.`,
      type: 'info',
    });
    addNotification({
      accountNumber: recipient.accountNumber,
      message: `You received ৳${amt.toLocaleString()} from ${sender.name}.`,
      type: 'success',
    });
    toast.showSuccess(`৳${amt.toLocaleString()} transferred from ${sender.name} to ${recipient.name} successfully.`);
    setFromCustomer({ name: sender.name, accountNumber: sender.accountNumber, balance: sender.balance - amt });
    setAmount('');
    setDescription('');
    setAmountError('');
  };

  return (
    <EmployeeLayout title="Fund Transfer">
      <Box maxWidth={680} mx="auto">
        <Typography variant="h5" fontWeight={700} mb={0.5}>Fund Transfer Processing</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Transfer funds between customer accounts.</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
              <Box sx={{ bgcolor: 'primary.main', borderRadius: 2, p: 1, display: 'flex' }}>
                <SwapHorizIcon sx={{ color: 'white' }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>Transfer Details</Typography>
            </Stack>

            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1}>From (Sender)</Typography>
            <Stack direction="row" spacing={1} mb={2}>
              <TextField
                fullWidth
                label="Sender Account Number"
                value={fromAccount}
                onChange={e => { setFromAccount(e.target.value); setFromLookupError(''); setFromCustomer(null); }}
                error={!!fromLookupError}
                helperText={fromLookupError}
                placeholder="1234567890"
                inputProps={{ inputMode: 'numeric' }}
              />
              <Button variant="outlined" onClick={lookupFrom} startIcon={<PersonSearchIcon />} sx={{ minWidth: 100, whiteSpace: 'nowrap' }}>
                Verify
              </Button>
            </Stack>

            {fromCustomer && (
              <Box sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.main', borderRadius: 2, p: 2, mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="primary.dark">Sender Verified</Typography>
                    <Typography fontWeight={700} color="primary.dark">{fromCustomer.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{fromCustomer.accountNumber}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">Available Balance</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.dark">৳{fromCustomer.balance.toLocaleString()}</Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            <Divider sx={{ mb: 3 }} />

            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1}>To (Recipient)</Typography>
            <Stack direction="row" spacing={1} mb={2}>
              <TextField
                fullWidth
                label="Recipient Account Number"
                value={toAccount}
                onChange={e => { setToAccount(e.target.value); setToLookupError(''); setToCustomer(null); }}
                error={!!toLookupError}
                helperText={toLookupError}
                placeholder="9876543210"
                inputProps={{ inputMode: 'numeric' }}
              />
              <Button variant="outlined" onClick={lookupTo} startIcon={<PersonSearchIcon />} sx={{ minWidth: 100, whiteSpace: 'nowrap' }}>
                Verify
              </Button>
            </Stack>

            {toCustomer && (
              <Box sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main', borderRadius: 2, p: 2, mb: 3 }}>
                <Typography variant="caption" color="success.dark">Recipient Verified</Typography>
                <Typography fontWeight={700} color="success.dark">{toCustomer.name}</Typography>
                <Typography variant="body2" color="text.secondary">{toCustomer.accountNumber}</Typography>
              </Box>
            )}

            <Divider sx={{ mb: 3 }} />

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
                  disabled={!fromCustomer || !toCustomer}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Description (optional)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Fund transfer"
                  disabled={!fromCustomer || !toCustomer}
                />
              </Grid>
            </Grid>

            <Button variant="contained" size="large" sx={{ mt: 3 }} onClick={handleSubmit} disabled={!fromCustomer || !toCustomer}>
              Process Transfer
            </Button>
          </CardContent>
        </Card>
      </Box>
    </EmployeeLayout>
  );
}
