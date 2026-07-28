import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Box, Card, CardContent, Grid, Stack, Typography, Button, Chip,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmployeeLayout from '../../components/EmployeeLayout';
import { SummaryCard, ActivityTimeline, QuickActionGrid, NotificationList, type ActivityItem } from '../../components/DashboardWidgets';
import { BarChart, DonutChart } from '../../components/Charts';
import { useAuth } from '../../context/AuthContext';
import {
  getUsers, getTransactions, getPendingKyc, getNotificationsByAccount,
} from '../../utils/localStorageDB';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const data = useMemo(() => {
    const users = getUsers();
    const customers = users.filter(u => u.role === 'user' && u.isApproved);
    const pendingKyc = getPendingKyc();
    const txns = getTransactions();
    const today = new Date().toDateString();
    const todayTxns = txns.filter(t => new Date(t.date).toDateString() === today);
    const myProcessedTxns = txns.filter(t => t.approvedBy === user?.id);
    return { customers, pendingKyc, txns, todayTxns, myProcessedTxns };
  }, [user?.id]);

  const totalDeposits = data.todayTxns.filter(t => t.type === 'deposit' && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = data.todayTxns.filter(t => t.type === 'withdraw' && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const totalTransfers = data.todayTxns.filter(t => t.type === 'transfer-out' && t.status === 'success').reduce((s, t) => s + t.amount, 0);

  // Last 7 days transaction volume (mock-friendly from real data)
  const weeklyData = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const dayTotal = data.txns.filter(t => new Date(t.date).toDateString() === key && t.status === 'success').reduce((s, t) => s + t.amount, 0);
      days.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: dayTotal });
    }
    return days;
  }, [data.txns]);

  const txnTypeBreakdown = useMemo(() => {
    const counts: Record<'deposit' | 'withdraw' | 'transfer-out' | 'loan' | 'interest', number> = { deposit: 0, withdraw: 0, 'transfer-out': 0, loan: 0, interest: 0 };
    data.txns.filter(t => t.status === 'success').forEach(t => {
      if (t.type in counts) counts[t.type as keyof typeof counts]++;
    });
    return [
      { label: 'Deposits', value: counts.deposit },
      { label: 'Withdrawals', value: counts.withdraw },
      { label: 'Transfers', value: counts['transfer-out'] },
      { label: 'Loans', value: counts.loan },
    ];
  }, [data.txns]);

  const activity: ActivityItem[] = useMemo(() => {
    return [...data.txns]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
      .map(t => ({
        id: t.id,
        title: `${t.type.replace('-', ' ')} — ৳${t.amount.toLocaleString()}`,
        description: t.description ?? `Account ${t.accountNumber}`,
        date: t.date,
        type: t.status === 'success' ? 'success' : t.status === 'pending' ? 'warning' : 'error',
      }));
  }, [data.txns]);

  const notifications = useMemo(() => {
    if (!user) return [];
    return getNotificationsByAccount(user.accountNumber).slice(-6).reverse();
  }, [user]);

  const quickActions = [
    { label: 'New Customer', icon: <PersonAddIcon />, onClick: () => navigate('/employee/registration'), color: 'primary' as const },
    { label: 'Open Account', icon: <AccountBalanceWalletIcon />, onClick: () => navigate('/employee/open-account'), color: 'info' as const },
    { label: 'KYC Verify', icon: <VerifiedUserIcon />, onClick: () => navigate('/employee/kyc'), color: 'warning' as const, disabled: data.pendingKyc.length === 0 },
    { label: 'Deposit', icon: <AddIcon />, onClick: () => navigate('/employee/deposit'), color: 'success' as const },
    { label: 'Withdraw', icon: <RemoveIcon />, onClick: () => navigate('/employee/withdrawal'), color: 'error' as const },
    { label: 'Transfer', icon: <SwapHorizIcon />, onClick: () => navigate('/employee/transfer'), color: 'primary' as const },
    { label: 'Loan', icon: <CreditScoreIcon />, onClick: () => navigate('/employee/loan-processing'), color: 'secondary' as const },
    { label: 'Search', icon: <PeopleIcon />, onClick: () => navigate('/employee/customer-search'), color: 'info' as const },
    { label: 'History', icon: <ReceiptLongIcon />, onClick: () => navigate('/employee/transactions'), color: 'primary' as const },
  ];

  return (
    <EmployeeLayout title="Dashboard">
      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Welcome, {user?.name?.split(' ')[0]}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.designation ?? 'Employee'} · {user?.branch ?? 'Main Branch'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Typography>
          </Box>
          <Chip icon={<TrendingUpIcon fontSize="small" />} label={`${data.todayTxns.length} transactions today`} color="primary" variant="outlined" />
        </Stack>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard label="Total Customers" value={data.customers.length} sub={`${data.pendingKyc.length} pending KYC`} icon={<PeopleIcon />} color="#2563EB" bg="rgba(37,99,235,0.10)" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard label="Today's Deposits" value={`৳${totalDeposits.toLocaleString()}`} sub={`${data.todayTxns.filter(t => t.type === 'deposit').length} transactions`} icon={<AddIcon />} color="#10B981" bg="rgba(16,185,129,0.10)" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard label="Today's Withdrawals" value={`৳${totalWithdrawals.toLocaleString()}`} sub={`${data.todayTxns.filter(t => t.type === 'withdraw').length} transactions`} icon={<RemoveIcon />} color="#b54545" bg="#f6e3e3" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard label="Today's Transfers" value={`৳${totalTransfers.toLocaleString()}`} sub={`${data.todayTxns.filter(t => t.type === 'transfer-out').length} transactions`} icon={<SwapHorizIcon />} color="#4a7a8a" bg="#e2eef2" />
          </Grid>
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={700}>Weekly Transaction Volume</Typography>
                  <Chip label="Last 7 days" size="small" variant="outlined" />
                </Stack>
                <BarChart data={weeklyData.map((d, i) => ({ ...d, color: i === 6 ? '#2563EB' : '#93C5FD' }))} formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString()} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Transaction Mix</Typography>
                <DonutChart data={txnTypeBreakdown} centerValue={data.txns.filter(t => t.status === 'success').length.toString()} centerLabel="Total" />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Quick Actions</Typography>
            <QuickActionGrid actions={quickActions} />
          </CardContent>
        </Card>

        {/* Activity + Notifications */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={700}>Activity Timeline</Typography>
                  <Button size="small" onClick={() => navigate('/employee/transactions')}>View All</Button>
                </Stack>
                <ActivityTimeline items={activity} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={700}>Notifications</Typography>
                  <Button size="small" onClick={() => navigate('/employee/notifications')}>All</Button>
                </Stack>
                <NotificationList items={notifications} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </EmployeeLayout>
  );
}
