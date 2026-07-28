import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Stack, Grid, Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CustomerLayout from '../components/CustomerLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateUser, addNotification } from '../utils/localStorageDB';

interface FDRecord {
  id: string;
  amount: number;
  tenure: number;
  rate: number;
  startDate: string;
  maturityDate: string;
  status: 'active' | 'matured' | 'closed';
  maturityAmount: number;
}

function getFDRate(tenureMonths: number): number {
  if (tenureMonths <= 6) return 6;
  if (tenureMonths <= 12) return 7.5;
  if (tenureMonths <= 24) return 8.5;
  return 9.5;
}

export default function FixedDeposit() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [tenure, setTenure] = useState('12');

  const key = 'smart_fd_' + user?.id;
  const fds: FDRecord[] = JSON.parse(localStorage.getItem(key) || '[]');

  const handleCreate = () => {
    const amt = parseFloat(amount);
    if (!amt || !user || amt > user.balance) return;
    const months = parseInt(tenure);
    const rate = getFDRate(months);
    const maturity = Math.round(amt * Math.pow(1 + rate / 100, months / 12));
    const start = new Date();
    const maturityDate = new Date(start);
    maturityDate.setMonth(maturityDate.getMonth() + months);

    const fd: FDRecord = {
      // eslint-disable-next-line react-hooks/purity -- runs inside the handleCreate click handler, not during render
      id: 'FD' + Math.floor(10000000 + Math.random() * 90000000),
      amount: amt,
      tenure: months,
      rate,
      startDate: start.toISOString(),
      maturityDate: maturityDate.toISOString(),
      status: 'active',
      maturityAmount: maturity,
    };

    updateUser(user.id, { balance: user.balance - amt });
    localStorage.setItem(key, JSON.stringify([...fds, fd]));
    addNotification({ accountNumber: user.accountNumber, message: `Fixed Deposit of ৳${amt.toLocaleString()} created for ${months} months at ${rate}% p.a.`, type: 'success' });
    refreshUser();
    setOpen(false);
    setAmount('');
    toast.showSuccess(`Fixed Deposit created successfully. Maturity amount: ৳${maturity.toLocaleString()}`);
  };

  return (
    <CustomerLayout>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={700}>Fixed Deposit</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Open FD
          </Button>
        </Stack>


        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card><CardContent>
              <Typography variant="caption" color="text.secondary">Available Balance</Typography>
              <Typography variant="h5" fontWeight={700}>৳{(user?.balance ?? 0).toLocaleString()}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card><CardContent>
              <Typography variant="caption" color="text.secondary">Active FDs</Typography>
              <Typography variant="h5" fontWeight={700}>{fds.filter(f => f.status === 'active').length}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card><CardContent>
              <Typography variant="caption" color="text.secondary">Total FD Value</Typography>
              <Typography variant="h5" fontWeight={700}>৳{fds.filter(f => f.status === 'active').reduce((s, f) => s + f.amount, 0).toLocaleString()}</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        <Card>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>FD ID</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Tenure</TableCell>
                <TableCell>Rate</TableCell>
                <TableCell>Maturity Date</TableCell>
                <TableCell>Maturity Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fds.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No Fixed Deposits yet</Typography></TableCell></TableRow>
              )}
              {fds.map(fd => (
                <TableRow key={fd.id}>
                  <TableCell>{fd.id}</TableCell>
                  <TableCell>৳{fd.amount.toLocaleString()}</TableCell>
                  <TableCell>{fd.tenure} months</TableCell>
                  <TableCell>{fd.rate}%</TableCell>
                  <TableCell>{new Date(fd.maturityDate).toLocaleDateString()}</TableCell>
                  <TableCell>৳{fd.maturityAmount.toLocaleString()}</TableCell>
                  <TableCell><Chip size="small" label={fd.status} color={fd.status === 'active' ? 'success' : fd.status === 'matured' ? 'primary' : 'default'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Open Fixed Deposit</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Amount (৳)" type="number" value={amount} onChange={e => setAmount(e.target.value)} fullWidth />
            <TextField label="Tenure (months)" type="number" value={tenure} onChange={e => setTenure(e.target.value)} fullWidth helperText={`Interest rate: ${getFDRate(parseInt(tenure || '0'))}% p.a.`} />
            {amount && tenure && (
              <Typography variant="body2" color="text.secondary">
                Estimated maturity: ৳{Math.round(parseFloat(amount) * Math.pow(1 + getFDRate(parseInt(tenure)) / 100, parseInt(tenure) / 12)).toLocaleString()}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!amount || parseFloat(amount) > (user?.balance ?? 0)}>
            Create FD
          </Button>
        </DialogActions>
      </Dialog>
    </CustomerLayout>
  );
}
