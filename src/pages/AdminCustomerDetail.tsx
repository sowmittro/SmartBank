import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, Grid,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AdminLayout from '../components/AdminLayout';
import {
  getUserById, getTransactionsByAccount, updateUser, addNotification, generatePin,
} from '../utils/localStorageDB';
import type { Transaction } from '../utils/localStorageDB';
import { useToast } from '../context/ToastContext';

export default function AdminCustomerDetail() {
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [newPin, setNewPin] = useState('');
  const [, forceRefresh] = useState(0);

  const getUser = () => id ? getUserById(id) : null;
  const user = getUser();
  const transactions = user ? [...getTransactionsByAccount(user.accountNumber)].reverse() : [];

  if (!user) {
    return (
      <AdminLayout title="Customer Not Found">
        <Alert severity="error">Customer not found.</Alert>
      </AdminLayout>
    );
  }

  const handleFreezeToggle = () => {
    updateUser(user.id, { isActive: !user.isActive });
    addNotification({
      accountNumber: user.accountNumber,
      message: !user.isActive ? 'Account reactivated by admin.' : 'Account frozen by admin.',
      type: !user.isActive ? 'success' : 'error',
    });
    toast.showSuccess(`Account ${!user.isActive ? 'unfrozen' : 'frozen'}.`);
    forceRefresh(k => k + 1);
  };

  const handleApprove = () => {
    updateUser(user.id, { isApproved: true });
    addNotification({ accountNumber: user.accountNumber, message: 'Your account has been approved! You can now log in.', type: 'success' });
    toast.showSuccess('Account approved.');
    forceRefresh(k => k + 1);
  };

  const handleResetPin = () => {
    const pin = generatePin();
    updateUser(user.id, { pin });
    addNotification({ accountNumber: user.accountNumber, message: 'Your PIN has been reset by admin. Please contact support for your new PIN.', type: 'warning' });
    setNewPin(pin);
    toast.showSuccess(`PIN reset successfully. New PIN: ${pin}`);
    forceRefresh(k => k + 1);
  };

  const isCredit = (t: Transaction) => ['deposit', 'transfer-in', 'loan'].includes(t.type);
  const txLabel = (type: string) => ({ deposit: 'Deposit', withdraw: 'Withdrawal', 'transfer-out': 'Transfer Out', 'transfer-in': 'Transfer In', loan: 'Loan', interest: 'Interest' }[type] ?? type);

  const freshUser = getUser() ?? user;

  return (
    <AdminLayout title={`Customer: ${freshUser.name}`}>
      <Box mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} variant="outlined" size="small">
          Back to Dashboard
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Column */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar sx={{ width: 88, height: 88, bgcolor: 'primary.main', fontSize: '2.2rem', mx: 'auto', mb: 2, fontWeight: 700 }}>
                {freshUser.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{freshUser.name}</Typography>
              <Typography variant="body2" color="text.secondary" mb={1.5}>{freshUser.email}</Typography>
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" gap={0.5} mb={3}>
                <Chip label={freshUser.isActive ? 'Active' : 'Frozen'} color={freshUser.isActive ? 'success' : 'error'} size="small" />
                <Chip label={freshUser.isApproved ? 'Approved' : 'Pending'} color={freshUser.isApproved ? 'info' : 'warning'} size="small" />
                <Chip label={freshUser.accountType} size="small" variant="outlined" />
              </Stack>

              <Stack spacing={1.5}>
                {!freshUser.isApproved && (
                  <Button variant="contained" color="success" fullWidth startIcon={<HowToRegIcon />} onClick={handleApprove}>
                    Approve Account
                  </Button>
                )}
                <Button
                  variant={freshUser.isActive ? 'outlined' : 'contained'}
                  color={freshUser.isActive ? 'error' : 'success'}
                  fullWidth
                  startIcon={freshUser.isActive ? <BlockIcon /> : <LockOpenIcon />}
                  onClick={handleFreezeToggle}
                >
                  {freshUser.isActive ? 'Freeze Account' : 'Unfreeze Account'}
                </Button>
                <Button variant="outlined" color="warning" fullWidth startIcon={<VpnKeyIcon />} onClick={handleResetPin}>
                  Reset PIN
                </Button>
                {newPin && (
                  <Alert severity="warning" icon={<VpnKeyIcon />}>
                    New PIN generated: <strong>{newPin}</strong>. Share securely with customer.
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card sx={{ mt: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Account Details</Typography>
              <Stack spacing={1.5} mt={2}>
                {[
                  { label: 'Account Number', value: freshUser.accountNumber, mono: true },
                  { label: 'Balance', value: `৳${freshUser.balance.toLocaleString()}`, bold: true, color: 'success.dark' },
                  { label: 'Mobile', value: freshUser.mobile },
                  { label: 'NID Number', value: freshUser.nidNumber },
                  { label: 'Date of Birth', value: freshUser.dob ? new Date(freshUser.dob).toLocaleDateString() : 'N/A' },
                  { label: 'Gender', value: freshUser.gender },
                  { label: 'Father\'s Name', value: freshUser.fatherName || 'N/A' },
                  { label: 'Mother\'s Name', value: freshUser.motherName || 'N/A' },
                  { label: 'Member Since', value: new Date(freshUser.createdAt).toLocaleDateString() },
                  ...(freshUser.address ? [{ label: 'Address', value: freshUser.address }] : []),
                ].map(item => (
                  <Box key={item.label}>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    <Typography
                      variant="body2"
                      fontWeight={item.bold ? 700 : 500}
                      color={item.color ?? 'text.primary'}
                      fontFamily={item.mono ? 'monospace' : 'inherit'}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Loan Info */}
          {freshUser.loanStatus === 'active' && (
            <Card sx={{ mb: 3, border: '2px solid', borderColor: 'warning.light', boxShadow: 'none' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="warning.dark" mb={2}>Active Loan</Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Loan Amount', value: `৳${freshUser.loanAmount?.toLocaleString()}` },
                    { label: 'Interest Rate', value: `${freshUser.loanInterestRate}% / month` },
                    { label: 'Monthly Interest', value: `৳${Math.round(((freshUser.loanAmount ?? 0) * (freshUser.loanInterestRate ?? 0)) / 100).toLocaleString()}` },
                    { label: 'Loan Start', value: freshUser.loanStartDate ? new Date(freshUser.loanStartDate).toLocaleDateString() : 'N/A' },
                    { label: 'Next Due', value: freshUser.loanDueDate ? new Date(freshUser.loanDueDate).toLocaleDateString() : 'N/A' },
                    { label: 'Total Interest Paid', value: `৳${(freshUser.interestPaid ?? 0).toLocaleString()}` },
                    ...(freshUser.pendingInterest ? [{ label: 'Pending Interest', value: `৳${freshUser.pendingInterest.toLocaleString()}` }] : []),
                  ].map(item => (
                    <Grid key={item.label} size={{ xs: 6, sm: 4 }}>
                      <Box sx={{ bgcolor: 'warning.50', borderRadius: 1.5, p: 1.5, border: '1px solid', borderColor: 'warning.light' }}>
                        <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                        <Typography variant="body2" fontWeight={700}>{item.value}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Typography variant="h6" fontWeight={700}>Transaction History</Typography>
                <Chip label={transactions.length} size="small" variant="outlined" />
              </Stack>

              {transactions.length === 0 ? (
                <Box textAlign="center" py={4}><Typography color="text.secondary">No transactions</Typography></Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        {['Type', 'Amount', 'Date', 'Status', 'Description'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map(t => (
                        <TableRow key={t.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Box sx={{ color: isCredit(t) ? 'success.main' : 'error.main', display: 'flex' }}>
                                {isCredit(t) ? <ArrowDownwardIcon sx={{ fontSize: 14 }} /> : <ArrowUpwardIcon sx={{ fontSize: 14 }} />}
                              </Box>
                              <Typography variant="body2">{txLabel(t.type)}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} color={isCredit(t) ? 'success.dark' : 'error.dark'}>
                              {isCredit(t) ? '+' : '-'}৳{t.amount.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{new Date(t.date).toLocaleString()}</Typography></TableCell>
                          <TableCell>
                            <Chip label={t.pendingApproval ? 'Pending' : t.status} size="small" color={t.pendingApproval ? 'warning' : t.status === 'success' ? 'success' : 'error'} sx={{ fontSize: '0.65rem' }} />
                          </TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{t.description ?? '—'}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AdminLayout>
  );
}
