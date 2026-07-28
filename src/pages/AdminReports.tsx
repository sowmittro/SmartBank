import { useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Grid, Table, TableBody, TableCell, TableHead, TableRow, Chip, ToggleButtonGroup, ToggleButton, Avatar, Tab, Tabs,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SavingsIcon from '@mui/icons-material/Savings';
import BadgeIcon from '@mui/icons-material/Badge';
import AdminLayout from '../components/AdminLayout';
import { BarChart, DonutChart, LineChart } from '../components/Charts';
import { getUsers, getTransactions } from '../utils/localStorageDB';
import { getAllCards } from '../utils/mockCardsData';

export default function AdminReports() {
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [tab, setTab] = useState(0);

  const users = getUsers();
  const transactions = getTransactions();
  const allCards = getAllCards();
  const approvedUsers = users.filter(u => u.role === 'user' && u.isApproved);
  const employees = users.filter(u => u.role === 'employee');

  const filteredTxns = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      if (range === 'today') return d.toDateString() === now.toDateString();
      if (range === 'week') return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
      if (range === 'month') return (now.getTime() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [transactions, range]);

  const totalDeposits = filteredTxns.filter(t => t.type === 'deposit' && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = filteredTxns.filter(t => t.type === 'withdraw' && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const totalTransfers = filteredTxns.filter(t => t.type === 'transfer-out' && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const totalInterest = filteredTxns.filter(t => t.type === 'interest').reduce((s, t) => s + t.amount, 0);

  const totalBalance = approvedUsers.reduce((s, u) => s + u.balance, 0);
  const customersWithLoans = approvedUsers.filter(u => u.loanStatus === 'active');
  const totalLoanPortfolio = customersWithLoans.reduce((s, u) => s + (u.loanAmount ?? 0), 0);

  const txnChartData = [
    { label: 'Deposits', value: totalDeposits, color: '#4caf50' },
    { label: 'Withdrawals', value: totalWithdrawals, color: '#f44336' },
    { label: 'Transfers', value: totalTransfers, color: '#2196f3' },
  ];

  const customerTypeData = [
    { label: 'Savings', value: approvedUsers.filter(u => u.accountType === 'Savings').length },
    { label: 'Checking', value: approvedUsers.filter(u => u.accountType === 'Checking').length },
    { label: 'Current', value: approvedUsers.filter(u => u.accountType === 'Current').length },
  ];

  const cardData = [
    { label: 'Active', value: allCards.filter(c => c.status === 'active').length, color: '#4caf50' },
    { label: 'Frozen', value: allCards.filter(c => c.status === 'frozen').length, color: '#ff9800' },
    { label: 'Blocked', value: allCards.filter(c => c.status === 'blocked').length, color: '#f44336' },
    { label: 'Pending', value: allCards.filter(c => c.status === 'pending').length, color: '#9e9e9e' },
  ];

  const txnTrendData = useMemo(() => {
    const days = range === 'today' ? 1 : range === 'week' ? 7 : range === 'month' ? 30 : 90;
    const now = new Date();
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayTxns = transactions.filter(t => new Date(t.date).toDateString() === d.toDateString() && t.status === 'success');
      const total = dayTxns.reduce((s, t) => s + t.amount, 0);
      data.push({ label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: total });
    }
    return data;
  }, [transactions, range]);

  return (
    <AdminLayout title="Reports & Analytics">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Reports & Analytics</Typography>
            <Typography variant="body2" color="text.secondary">Comprehensive banking statistics and insights</Typography>
          </Box>
          <ToggleButtonGroup value={range} exclusive onChange={(_, v) => v && setRange(v)} size="small">
            <ToggleButton value="today">Today</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="all">All Time</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab icon={<AssessmentIcon fontSize="small" />} iconPosition="start" label="Overview" />
          <Tab icon={<PeopleIcon fontSize="small" />} iconPosition="start" label="Customers" />
          <Tab icon={<ReceiptLongIcon fontSize="small" />} iconPosition="start" label="Transactions" />
          <Tab icon={<CreditCardIcon fontSize="small" />} iconPosition="start" label="Cards" />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Grid container spacing={2} mb={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}><CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Box sx={{ bgcolor: 'success.50', borderRadius: 1, p: 0.75, display: 'flex' }}><TrendingUpIcon color="success" fontSize="small" /></Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Deposits</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={800} color="success.dark">৳{totalDeposits.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">{filteredTxns.filter(t => t.type === 'deposit' && t.status === 'success').length} transactions</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}><CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Box sx={{ bgcolor: 'error.50', borderRadius: 1, p: 0.75, display: 'flex' }}><TrendingDownIcon color="error" fontSize="small" /></Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Withdrawals</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={800} color="error.dark">৳{totalWithdrawals.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">{filteredTxns.filter(t => t.type === 'withdraw' && t.status === 'success').length} transactions</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}><CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Box sx={{ bgcolor: 'info.50', borderRadius: 1, p: 0.75, display: 'flex' }}><ReceiptLongIcon color="info" fontSize="small" /></Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Transfers</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={800} color="info.dark">৳{totalTransfers.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">{filteredTxns.filter(t => t.type === 'transfer-out' && t.status === 'success').length} transactions</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}><CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Box sx={{ bgcolor: 'warning.50', borderRadius: 1, p: 0.75, display: 'flex' }}><AccountBalanceWalletIcon color="warning" fontSize="small" /></Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Interest</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={800} color="warning.dark">৳{totalInterest.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">{customersWithLoans.length} active loans</Typography>
                </CardContent></Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={3}>Transaction Trend</Typography>
                    <LineChart data={txnTrendData} height={200} formatValue={v => `৳${v.toLocaleString()}`} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={3}>Transaction Distribution</Typography>
                    <DonutChart data={txnChartData} centerLabel="Total" centerValue={`৳${(totalDeposits + totalWithdrawals + totalTransfers).toLocaleString()}`} />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Grid container spacing={2} mb={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}><CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <PeopleIcon color="primary" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">Total Customers</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={800}>{approvedUsers.length}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}><CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <SavingsIcon color="success" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">Total Balance</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={800}>৳{totalBalance.toLocaleString()}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}><CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <BadgeIcon color="warning" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">Employees</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={800}>{employees.length}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}><CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <TrendingUpIcon color="info" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">Loan Portfolio</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={800}>৳{totalLoanPortfolio.toLocaleString()}</Typography>
                </CardContent></Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={3}>Account Type Distribution</Typography>
                    <DonutChart data={customerTypeData} centerLabel="Accounts" centerValue={approvedUsers.length.toString()} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={3}>Top Customers by Balance</Typography>
                    <Stack spacing={1.5}>
                      {[...approvedUsers].sort((a, b) => b.balance - a.balance).slice(0, 5).map((u, i) => (
                        <Stack key={u.id} direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: i === 0 ? 'warning.main' : 'grey.400', fontSize: '0.8rem' }}>{i + 1}</Avatar>
                          <Box flex={1} minWidth={0}>
                            <Typography variant="body2" fontWeight={600} noWrap>{u.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{u.accountNumber}</Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={700} color="success.dark">৳{u.balance.toLocaleString()}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {tab === 2 && (
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Account</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTxns.length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No transactions in selected range</Typography></TableCell></TableRow>
                  )}
                  {[...filteredTxns].reverse().slice(0, 100).map(t => (
                    <TableRow key={t.id} hover>
                      <TableCell><Typography variant="body2" fontSize="0.8rem">{new Date(t.date).toLocaleString()}</Typography></TableCell>
                      <TableCell><Chip size="small" label={t.type.replace('-', ' ')} color={t.type === 'deposit' ? 'success' : t.type === 'withdraw' ? 'error' : t.type === 'transfer-out' ? 'info' : 'default'} sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }} /></TableCell>
                      <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">{t.accountNumber}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={700} color="primary.main">৳{t.amount.toLocaleString()}</Typography></TableCell>
                      <TableCell><Chip size="small" label={t.status} color={t.status === 'success' ? 'success' : t.status === 'pending' ? 'warning' : 'error'} sx={{ fontSize: '0.65rem' }} /></TableCell>
                      <TableCell><Typography variant="body2" fontSize="0.8rem">{t.description || '-'}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {tab === 3 && (
          <Box>
            <Grid container spacing={2} mb={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}><CardContent>
                  <Typography variant="caption" color="text.secondary">Total Cards</Typography>
                  <Typography variant="h4" fontWeight={800}>{allCards.length}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}><CardContent>
                  <Typography variant="caption" color="text.secondary">Active</Typography>
                  <Typography variant="h4" fontWeight={800} color="success.main">{allCards.filter(c => c.status === 'active').length}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}><CardContent>
                  <Typography variant="caption" color="text.secondary">Debit Cards</Typography>
                  <Typography variant="h4" fontWeight={800}>{allCards.filter(c => c.type === 'debit').length}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}><CardContent>
                  <Typography variant="caption" color="text.secondary">Credit Cards</Typography>
                  <Typography variant="h4" fontWeight={800}>{allCards.filter(c => c.type === 'credit').length}</Typography>
                </CardContent></Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={3}>Card Status Distribution</Typography>
                    <DonutChart data={cardData} centerLabel="Cards" centerValue={allCards.length.toString()} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={3}>Network Distribution</Typography>
                    <BarChart
                      data={[
                        { label: 'VISA', value: allCards.filter(c => c.network === 'visa').length, color: '#1a1f71' },
                        { label: 'MC', value: allCards.filter(c => c.network === 'mastercard').length, color: '#eb001b' },
                      ]}
                      height={140}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
}
