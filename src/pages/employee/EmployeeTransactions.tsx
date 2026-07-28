import { useState } from 'react';
import {
  Box, Card, CardContent, Chip, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography, Button,
} from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import EmployeeLayout from '../../components/EmployeeLayout';
import { getTransactions, getUsers } from '../../utils/localStorageDB';
import type { Transaction } from '../../utils/localStorageDB';

export default function EmployeeTransactions() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  const all = [...getTransactions()].reverse();
  const users = getUsers();
  const getUserName = (acc: string) => users.find(u => u.accountNumber === acc)?.name ?? acc;

  const filtered = all.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (fromDate && new Date(t.date) < new Date(fromDate)) return false;
    if (toDate && new Date(t.date) > new Date(toDate + 'T23:59:59')) return false;
    if (search && !t.id.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase()) && !t.accountNumber.includes(search)) return false;
    return true;
  });

  const isCredit = (t: Transaction) => ['deposit', 'transfer-in', 'loan'].includes(t.type);
  const txColor = (t: Transaction) => isCredit(t) ? 'success.main' : 'error.main';

  const txLabel = (type: string) => {
    const labels: Record<string, string> = {
      'deposit': 'Deposit', 'withdraw': 'Withdrawal', 'transfer-out': 'Transfer Out',
      'transfer-in': 'Transfer In', 'loan': 'Loan', 'interest': 'Interest',
    };
    return labels[type] ?? type;
  };

  const miniStats = [
    { label: 'Total Transactions', value: all.length, color: 'primary.main' },
    { label: 'Successful', value: all.filter(t => t.status === 'success').length, color: 'success.main' },
    { label: 'Pending', value: all.filter(t => t.status === 'pending').length, color: 'warning.main' },
    { label: 'Failed', value: all.filter(t => t.status === 'failed').length, color: 'error.main' },
  ];

  return (
    <EmployeeLayout title="Transaction History">
      <Box>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Transaction History</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>View and filter all bank transactions.</Typography>

        <Grid container spacing={2} mb={3}>
          {miniStats.map(s => (
            <Grid key={s.label} size={{ xs: 6, md: 3 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h6" fontWeight={700} color={s.color}>{s.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <FilterListIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>Filter Transactions</Typography>
            </Stack>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)}>
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="deposit">Deposit</MenuItem>
                    <MenuItem value="withdraw">Withdrawal</MenuItem>
                    <MenuItem value="transfer-out">Transfer Out</MenuItem>
                    <MenuItem value="transfer-in">Transfer In</MenuItem>
                    <MenuItem value="loan">Loan</MenuItem>
                    <MenuItem value="interest">Interest</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth size="small" label="From Date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth size="small" label="To Date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Search (Account / ID / Description)" value={search} onChange={e => setSearch(e.target.value)} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>All Transactions ({filtered.length})</Typography>
              <Button size="small" startIcon={<DownloadIcon />} variant="outlined">Export</Button>
            </Stack>

            {filtered.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography color="text.secondary">No transactions found</Typography>
              </Box>
            ) : (
              <Stack spacing={0}>
                {filtered.slice(0, 100).map((txn, i) => (
                  <Box key={txn.id}>
                    {i > 0 && <Divider />}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" py={2}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{
                          bgcolor: isCredit(txn) ? 'success.50' : 'error.50',
                          borderRadius: '50%', p: 1.2, display: 'flex', color: txColor(txn),
                        }}>
                          {isCredit(txn) ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{txLabel(txn.type)}</Typography>
                          <Typography variant="caption" color="text.secondary">{getUserName(txn.accountNumber)} · {txn.accountNumber}</Typography>
                          {txn.description && <Typography variant="caption" color="text.secondary" display="block">{txn.description}</Typography>}
                          <Typography variant="caption" color="text.secondary" display="block">
                            {new Date(txn.date).toLocaleString()} — ID: {txn.id.slice(0, 8)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Box textAlign="right">
                        <Typography variant="body1" fontWeight={700} color={txColor(txn)}>
                          {isCredit(txn) ? '+' : '-'}৳{txn.amount.toLocaleString()}
                        </Typography>
                        <Chip
                          label={txn.pendingApproval ? 'Pending Approval' : txn.status}
                          size="small"
                          color={txn.pendingApproval ? 'warning' : txn.status === 'success' ? 'success' : 'error'}
                          sx={{ fontSize: '0.65rem' }}
                        />
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </EmployeeLayout>
  );
}
