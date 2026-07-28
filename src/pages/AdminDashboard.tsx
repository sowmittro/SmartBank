import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, Stack, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tabs, TextField, Tooltip, Typography,
  MenuItem, Select, FormControl, InputLabel, LinearProgress,
  Divider, Badge, Paper, InputAdornment,
} from '@mui/material';
import {
  Users, Wallet, TrendingUp, CreditCard, Bell,
} from 'lucide-react';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddIcon from '@mui/icons-material/Add';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AdminLayout from '../components/AdminLayout';
import {
  getUsers, getTransactions, getPendingTransactions, getPendingAccountApprovals,
  updateUser, updateTransaction, addTransaction, addNotification, createUser,
  getUserByEmail, generatePin, deleteUser,
} from '../utils/localStorageDB';
import { getAllTickets } from '../utils/ticketService';
import { validateEmail, validatePassword, validateMobile, validateNID, validateAge } from '../utils/validators';
import { BANK_COLORS } from '../theme';
import { useToast } from '../context/ToastContext';

type TabValue = 'overview' | 'approvals' | 'customers' | 'transactions' | 'loans' | 'interest' | 'admins';

export default function AdminDashboard() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabValue;
  const validTabs: TabValue[] = ['overview', 'approvals', 'customers', 'transactions', 'loans', 'interest', 'admins'];
  const [tab, setTab] = useState<TabValue>(validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview');
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositError, setDepositError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setRefreshKey] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');
  const [approvalSearch, setApprovalSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const refresh = () => setRefreshKey(k => k + 1);

  const allUsers = getUsers().filter(u => u.role === 'user');
  const allAdmins = getUsers().filter(u => u.role === 'admin');
  const allTransactions = getTransactions();
  const pendingTxns = getPendingTransactions();
  const pendingApprovals = getPendingAccountApprovals();
  const filteredApprovals = pendingApprovals.filter(u =>
    !approvalSearch ||
    u.name.toLowerCase().includes(approvalSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(approvalSearch.toLowerCase()) ||
    u.accountNumber.toLowerCase().includes(approvalSearch.toLowerCase()) ||
    u.mobile.includes(approvalSearch)
  );
  const approvedUsers = allUsers.filter(u => u.isApproved);
  const filteredCustomers = approvedUsers.filter(u =>
    !customerSearch ||
    u.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    u.accountNumber.toLowerCase().includes(customerSearch.toLowerCase()) ||
    u.mobile.includes(customerSearch)
  );
  const customersWithLoans = approvedUsers.filter(u => u.loanStatus === 'active');
  const customersWithInterestPaid = approvedUsers.filter(u => (u.interestPaid ?? 0) > 0);
  const totalBalance = approvedUsers.reduce((s, u) => s + u.balance, 0);

  const handleApproveAccount = (userId: string) => {
    updateUser(userId, { isApproved: true });
    const u = getUsers().find(u => u.id === userId);
    if (u) {
      addNotification({
        accountNumber: u.accountNumber,
        message: 'Your account has been approved! You can now log in and start banking.',
        type: 'success',
      });
    }
    toast.showSuccess('Account approved successfully!');
    refresh();
  };

  const handleRejectAccount = (userId: string) => {
    const u = getUsers().find(u => u.id === userId);
    if (u) {
      addNotification({
        accountNumber: u.accountNumber,
        message: 'Your account application has been rejected. Please contact support.',
        type: 'error',
      });
    }
    const users = getUsers();
    const updated = users.filter(user => user.id !== userId);
    localStorage.setItem('sb_users', JSON.stringify(updated));
    toast.showSuccess('Account application rejected.');
    refresh();
  };

  const handleApproveTransaction = (txnId: string) => {
    setLoading(true);
    const txn = allTransactions.find(t => t.id === txnId);
    if (!txn) { setLoading(false); return; }
    setTimeout(() => {
      if (txn.type === 'deposit') {
        const user = getUsers().find(u => u.accountNumber === txn.accountNumber);
        if (user) {
          updateUser(user.id, { balance: user.balance + txn.amount });
          addNotification({ accountNumber: user.accountNumber, message: `Deposit of ৳${txn.amount.toLocaleString()} approved and credited.`, type: 'success' });
        }
        updateTransaction(txnId, { status: 'success', pendingApproval: false });
      } else if (txn.type === 'transfer-out') {
        const sender = getUsers().find(u => u.accountNumber === txn.accountNumber);
        const recipient = txn.toAccount ? getUsers().find(u => u.accountNumber === txn.toAccount) : null;
        if (recipient) {
          updateUser(recipient.id, { balance: recipient.balance + txn.amount });
          addTransaction({ accountNumber: recipient.accountNumber, type: 'transfer-in', amount: txn.amount, fromAccount: txn.accountNumber, status: 'success', description: `Transfer from ${sender?.name ?? txn.accountNumber}` });
          addNotification({ accountNumber: recipient.accountNumber, message: `You received ৳${txn.amount.toLocaleString()} from ${sender?.name ?? txn.accountNumber}.`, type: 'success' });
        }
        if (sender) addNotification({ accountNumber: sender.accountNumber, message: `Transfer of ৳${txn.amount.toLocaleString()} approved.`, type: 'success' });
        updateTransaction(txnId, { status: 'success', pendingApproval: false });
      }
      toast.showSuccess('Transaction approved!');
      setLoading(false);
      refresh();
    }, 600);
  };

  const handleRejectTransaction = (txnId: string) => {
    const txn = allTransactions.find(t => t.id === txnId);
    if (!txn) return;
    if (txn.type === 'transfer-out') {
      const sender = getUsers().find(u => u.accountNumber === txn.accountNumber);
      if (sender) {
        updateUser(sender.id, { balance: sender.balance + txn.amount });
        addNotification({ accountNumber: sender.accountNumber, message: `Transfer of ৳${txn.amount.toLocaleString()} rejected. Amount refunded.`, type: 'error' });
      }
    }
    updateTransaction(txnId, { status: 'failed', pendingApproval: false });
    toast.showSuccess('Transaction rejected.');
    refresh();
  };

  const handleFreezeToggle = (userId: string, isActive: boolean) => {
    updateUser(userId, { isActive: !isActive });
    const u = getUsers().find(u => u.id === userId);
    if (u) addNotification({ accountNumber: u.accountNumber, message: !isActive ? 'Account reactivated by admin.' : 'Account frozen by admin.', type: !isActive ? 'success' : 'error' });
    toast.showSuccess(`Account ${!isActive ? 'unfrozen' : 'frozen'}.`);
    refresh();
  };

  const handleAdminDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (!depositAmount || isNaN(amt) || amt <= 0) { setDepositError('Enter a valid amount'); return; }
    const user = getUsers().find(u => u.id === selectedUserId);
    if (!user) return;
    updateUser(user.id, { balance: user.balance + amt });
    addTransaction({ accountNumber: user.accountNumber, type: 'deposit', amount: amt, status: 'success', description: 'Admin deposit' });
    addNotification({ accountNumber: user.accountNumber, message: `Admin deposited ৳${amt.toLocaleString()} to your account.`, type: 'success' });
    setDepositOpen(false);
    setDepositAmount('');
    setDepositError('');
    toast.showSuccess(`৳${amt.toLocaleString()} deposited to ${user.name}'s account.`);
    refresh();
  };

  const openTickets = getAllTickets().filter(t => t.status === 'open' || t.status === 'in-progress').length;

  const statCards = [
    { label: 'Total Customers', value: approvedUsers.length, sub: `${pendingApprovals.length} pending approval`, icon: <Users size={22} />, color: BANK_COLORS.primary, bg: 'rgba(15,76,129,0.10)' },
    { label: 'Total Deposits', value: `৳${totalBalance.toLocaleString()}`, sub: 'Bank-wide balance', icon: <Wallet size={22} />, color: BANK_COLORS.secondary, bg: 'rgba(46,125,50,0.10)' },
    { label: 'Pending Approvals', value: pendingTxns.length + pendingApprovals.length, sub: `${pendingTxns.length} txn · ${pendingApprovals.length} accounts`, icon: <Bell size={22} />, color: BANK_COLORS.warning, bg: 'rgba(255,179,0,0.10)' },
    { label: 'Active Loans', value: customersWithLoans.length, sub: 'Customers with loans', icon: <CreditCard size={22} />, color: BANK_COLORS.purple, bg: 'rgba(124,58,237,0.10)' },
    { label: 'Support Tickets', value: openTickets, sub: 'Open / in-progress tickets', icon: <TrendingUp size={22} />, color: '#0891b2', bg: 'rgba(8,145,178,0.10)' },
  ];

  return (
    <AdminLayout>
      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); navigate(`/admin?tab=${v}`, { replace: true }); }}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
        variant="scrollable" scrollButtons="auto"
      >
        <Tab value="overview" label="Overview" />
        <Tab value="approvals" label={
          <Badge badgeContent={pendingApprovals.length} color="error" max={99}>
            <Box sx={{ pr: pendingApprovals.length > 0 ? 1.5 : 0 }}>Account Approvals</Box>
          </Badge>
        } />
        <Tab value="customers" label={`Customers (${approvedUsers.length})`} />
        <Tab value="transactions" label={
          <Badge badgeContent={pendingTxns.length} color="warning" max={99}>
            <Box sx={{ pr: pendingTxns.length > 0 ? 1.5 : 0 }}>Pending Txns</Box>
          </Badge>
        } />
        <Tab value="loans" label={`Loans (${customersWithLoans.length})`} />
        <Tab value="interest" label={`Interest (${customersWithInterestPaid.length})`} />
        <Tab value="admins" label={`Admins (${allAdmins.length})`} />
      </Tabs>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <Box>
          <Grid container spacing={3} mb={4}>
            {statCards.map(s => (
              <Grid key={s.label} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' } }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ bgcolor: s.bg, borderRadius: 2, p: 1.5, color: s.color, display: 'flex', minWidth: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                        {s.icon}
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Typography>
                        <Typography variant="h4" fontWeight={800} color={s.color} mt={0.3}>{s.value}</Typography>
                        <Typography variant="caption" color="text.secondary" mt={0.3} display="block">{s.sub}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Today Summary */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                    <Typography variant="h6" fontWeight={700}>Today's Activity</Typography>
                    <Chip label={new Date().toLocaleDateString()} size="small" variant="outlined" />
                  </Stack>
                  {(() => {
                    const today = new Date().toDateString();
                    const todayTxns = allTransactions.filter(t => new Date(t.date).toDateString() === today);
                    const stats = [
                      { label: 'Deposits', value: todayTxns.filter(t => t.type === 'deposit' && t.status === 'success').reduce((s, t) => s + t.amount, 0), count: todayTxns.filter(t => t.type === 'deposit').length, color: '#10B981' },
                      { label: 'Withdrawals', value: todayTxns.filter(t => t.type === 'withdraw' && t.status === 'success').reduce((s, t) => s + t.amount, 0), count: todayTxns.filter(t => t.type === 'withdraw').length, color: '#F59E0B' },
                      { label: 'Transfers', value: todayTxns.filter(t => t.type === 'transfer-out' && t.status === 'success').reduce((s, t) => s + t.amount, 0), count: todayTxns.filter(t => t.type === 'transfer-out').length, color: '#8B5CF6' },
                      { label: 'Interest', value: todayTxns.filter(t => t.type === 'interest').reduce((s, t) => s + t.amount, 0), count: todayTxns.filter(t => t.type === 'interest').length, color: '#06B6D4' },
                    ];
                    return (
                      <Grid container spacing={2}>
                        {stats.map(s => (
                          <Grid key={s.label} size={{ xs: 6, md: 3 }}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                              <Typography variant="h6" fontWeight={700} color={s.color} mt={0.5}>৳{s.value.toLocaleString()}</Typography>
                              <Typography variant="caption" color="text.secondary">{s.count} txn{s.count !== 1 ? 's' : ''}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    );
                  })()}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} mb={3}>Quick Stats</Typography>
                  <Stack spacing={2}>
                    {[
                      { label: 'Active Customers', value: approvedUsers.filter(u => u.isActive).length, total: approvedUsers.length, color: 'success' },
                      { label: 'Frozen Accounts', value: approvedUsers.filter(u => !u.isActive).length, total: approvedUsers.length, color: 'error' },
                      { label: 'Loan Coverage', value: customersWithLoans.length, total: approvedUsers.length, color: 'warning' },
                    ].map(s => (
                      <Box key={s.label}>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                          <Typography variant="body2" fontWeight={700}>{s.value}/{s.total}</Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={s.total > 0 ? (s.value / s.total) * 100 : 0}
                          color={s.color as 'success' | 'error' | 'warning'}
                          sx={{ borderRadius: 4, height: 6 }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Activity Timeline & Quick Actions */}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight={700}>Recent Activity Timeline</Typography>
                    <Chip label="Last 10 events" size="small" variant="outlined" />
                  </Stack>
                  <Box sx={{ position: 'relative', pl: 3, '&::before': { content: '""', position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, bgcolor: 'divider' } }}>
                    {[...allTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((t, i) => {
                      const user = approvedUsers.find(u => u.accountNumber === t.accountNumber);
                      const typeColors: Record<string, string> = { deposit: 'success', withdraw: 'error', 'transfer-out': 'info', 'transfer-in': 'info', loan: 'warning', interest: 'warning' };
                      const typeLabels: Record<string, string> = { deposit: 'Deposited', withdraw: 'Withdrew', 'transfer-out': 'Transferred', 'transfer-in': 'Received', loan: 'Loan', interest: 'Interest' };
                      return (
                        <Box key={t.id} sx={{ mb: i === 9 ? 0 : 2.5, position: 'relative', '&::before': { content: '""', position: 'absolute', left: -22, top: 4, width: 10, height: 10, borderRadius: '50%', bgcolor: `${typeColors[t.type] ?? 'primary'}.main`, border: '2px solid', borderColor: 'background.paper' } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {user?.name ?? t.accountNumber}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {typeLabels[t.type] ?? t.type} • {t.status}
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Typography variant="body2" fontWeight={700} color={`${typeColors[t.type] ?? 'primary'}.main`}>
                                {t.type === 'withdraw' || t.type === 'transfer-out' ? '-' : '+'}৳{t.amount.toLocaleString()}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} mb={3}>Quick Actions</Typography>
                  <Stack spacing={1.5}>
                    <Button variant="outlined" color="success" startIcon={<AddIcon />} fullWidth sx={{ justifyContent: 'flex-start', py: 1.25 }} onClick={() => setCreateCustomerOpen(true)}>Create Customer Account</Button>
                    <Button variant="outlined" color="primary" startIcon={<PersonAddIcon />} fullWidth sx={{ justifyContent: 'flex-start', py: 1.25 }} onClick={() => navigate('/admin?tab=approvals')}>Review Pending Approvals ({pendingApprovals.length})</Button>
                    <Button variant="outlined" color="warning" startIcon={<AssignmentTurnedInIcon />} fullWidth sx={{ justifyContent: 'flex-start', py: 1.25 }} onClick={() => navigate('/admin?tab=transactions')}>Approve Transactions ({pendingTxns.length})</Button>
                    <Button variant="outlined" color="info" startIcon={<CreditScoreIcon />} fullWidth sx={{ justifyContent: 'flex-start', py: 1.25 }} onClick={() => navigate('/admin?tab=loans')}>Manage Loans ({customersWithLoans.length})</Button>
                    <Button variant="outlined" startIcon={<PeopleIcon />} fullWidth sx={{ justifyContent: 'flex-start', py: 1.25 }} onClick={() => navigate('/admin/employees')}>Manage Employees</Button>
                    <Button variant="outlined" startIcon={<ReceiptLongIcon />} fullWidth sx={{ justifyContent: 'flex-start', py: 1.25 }} onClick={() => navigate('/admin/reports')}>View Full Reports</Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ACCOUNT APPROVALS */}
      {tab === 'approvals' && (
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Pending Account Approvals</Typography>
              <Typography variant="body2" color="text.secondary">Review and approve new customer registrations</Typography>
            </Box>
            <Chip label={`${pendingApprovals.length} pending`} color={pendingApprovals.length > 0 ? 'warning' : 'default'} />
          </Stack>

          {pendingApprovals.length > 0 && (
            <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ py: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search pending accounts by name, email, account number, or mobile..."
                  value={approvalSearch}
                  onChange={e => setApprovalSearch(e.target.value)}
                  InputProps={{ startAdornment: (
                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  )}}
                />
              </CardContent>
            </Card>
          )}

          {filteredApprovals.length === 0 ? (
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <Box textAlign="center" py={8}>
                <HowToRegIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No pending approvals</Typography>
                <Typography variant="body2" color="text.disabled">All accounts are up to date</Typography>
              </Box>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {filteredApprovals.map(u => (
                <Grid key={u.id} size={{ xs: 12, md: 6, lg: 4 }}>
                  <Card sx={{ border: '1px solid', borderColor: 'warning.light', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                        <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48, fontSize: '1.2rem' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Typography variant="subtitle1" fontWeight={700} noWrap>{u.name}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">{u.email}</Typography>
                          <Chip label="Pending Approval" size="small" color="warning" sx={{ mt: 0.5, fontSize: '0.65rem' }} />
                        </Box>
                      </Stack>
                      <Divider sx={{ mb: 2 }} />
                      <Stack spacing={0.75} mb={2}>
                        {[
                          { label: 'Account No.', value: u.accountNumber },
                          { label: 'Mobile', value: u.mobile },
                          { label: 'NID', value: u.nidNumber },
                          { label: 'DOB', value: u.dob ? new Date(u.dob).toLocaleDateString() : 'N/A' },
                          { label: 'Applied', value: new Date(u.createdAt).toLocaleDateString() },
                        ].map(item => (
                          <Stack key={item.label} direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                            <Typography variant="caption" fontWeight={600}>{item.value}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <Button fullWidth variant="contained" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={() => handleApproveAccount(u.id)}>
                          Approve
                        </Button>
                        <Button fullWidth variant="outlined" color="error" size="small" startIcon={<PersonOffIcon />} onClick={() => handleRejectAccount(u.id)}>
                          Reject
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* CUSTOMERS */}
      {tab === 'customers' && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Customer Management</Typography>
              <Typography variant="body2" color="text.secondary">{approvedUsers.length} approved customers</Typography>
            </Box>
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setCreateCustomerOpen(true)}>
              Create Customer
            </Button>
          </Stack>

          <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ py: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, email, account number, or mobile..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                InputProps={{ startAdornment: (
                  <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                )}}
              />
            </CardContent>
          </Card>

          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Account</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Balance</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Loan</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers.map(u => (
                    <TableRow key={u.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.9rem' }}>{u.name.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => navigate(`/admin/customer/${u.id}`)}>
                              {u.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">{u.accountNumber}</Typography></TableCell>
                      <TableCell><Typography fontWeight={700} color="success.dark" fontSize="0.9rem">৳{u.balance.toLocaleString()}</Typography></TableCell>
                      <TableCell>
                        <Chip label={u.isActive ? 'Active' : 'Frozen'} size="small" color={u.isActive ? 'success' : 'error'} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {u.loanStatus === 'active'
                          ? <Chip label={`৳${u.loanAmount?.toLocaleString()}`} size="small" color="warning" />
                          : <Typography variant="body2" color="text.disabled" fontSize="0.8rem">None</Typography>}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Full Dashboard"><IconButton size="small" color="info" onClick={() => navigate(`/admin/customer-detail/${u.id}`)}><OpenInNewIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Admin Deposit"><IconButton size="small" color="success" onClick={() => { setSelectedUserId(u.id); setDepositAmount(''); setDepositError(''); setDepositOpen(true); }}><AddIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={u.isActive ? 'Freeze Account' : 'Unfreeze Account'}>
                            <IconButton size="small" color={u.isActive ? 'error' : 'success'} onClick={() => handleFreezeToggle(u.id, u.isActive)}>
                              {u.isActive ? <BlockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Account">
                            <IconButton size="small" color="error" onClick={() => setDeleteConfirmId(u.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary">{customerSearch ? 'No customers match your search' : 'No approved customers yet'}</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* PENDING TRANSACTIONS */}
      {tab === 'transactions' && (
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Pending Transaction Approvals</Typography>
              <Typography variant="body2" color="text.secondary">Review deposits and transfers awaiting approval</Typography>
            </Box>
            <Chip label={`${pendingTxns.length} pending`} color={pendingTxns.length > 0 ? 'warning' : 'default'} />
          </Stack>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            {pendingTxns.length === 0 ? (
              <Box textAlign="center" py={8}>
                <AssignmentTurnedInIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No pending transactions</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      {['Customer', 'Type', 'Amount', 'Date', 'Actions'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingTxns.map(txn => {
                      const txnUser = allUsers.find(u => u.accountNumber === txn.accountNumber);
                      return (
                        <TableRow key={txn.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{txnUser?.name ?? txn.accountNumber}</Typography>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">{txn.accountNumber}</Typography>
                          </TableCell>
                          <TableCell><Chip label={txn.type.replace('-', ' ')} size="small" color="warning" sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }} /></TableCell>
                          <TableCell><Typography fontWeight={700} color="primary.main">৳{txn.amount.toLocaleString()}</Typography></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{new Date(txn.date).toLocaleString()}</Typography></TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="contained" color="success" onClick={() => handleApproveTransaction(txn.id)} disabled={loading}>Approve</Button>
                              <Button size="small" variant="outlined" color="error" onClick={() => handleRejectTransaction(txn.id)}>Reject</Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Box>
      )}

      {/* LOANS */}
      {tab === 'loans' && (
        <Box>
          <Stack alignItems="flex-start" mb={3}>
            <Typography variant="h6" fontWeight={700}>Active Loan Portfolio</Typography>
            <Typography variant="body2" color="text.secondary">{customersWithLoans.length} customers with active loans</Typography>
          </Stack>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            {customersWithLoans.length === 0 ? (
              <Box textAlign="center" py={8}>
                <CreditScoreIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No active loans</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      {['Customer', 'Loan Amount', 'Rate', 'Monthly Interest', 'Next Due', 'Paid Interest', ''].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customersWithLoans.map(u => {
                      const monthly = Math.round(((u.loanAmount ?? 0) * (u.loanInterestRate ?? 0)) / 100);
                      const isOverdue = u.loanDueDate && new Date(u.loanDueDate) < new Date();
                      return (
                        <TableRow key={u.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => navigate(`/admin/customer/${u.id}`)}>{u.name}</Typography>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">{u.accountNumber}</Typography>
                          </TableCell>
                          <TableCell><Typography fontWeight={700} color="warning.dark">৳{u.loanAmount?.toLocaleString()}</Typography></TableCell>
                          <TableCell><Chip label={`${u.loanInterestRate}% p.m.`} size="small" color="primary" variant="outlined" /></TableCell>
                          <TableCell><Typography variant="body2">৳{monthly.toLocaleString()}</Typography></TableCell>
                          <TableCell>
                            <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.primary'} fontWeight={isOverdue ? 700 : 400}>
                              {u.loanDueDate ? new Date(u.loanDueDate).toLocaleDateString() : 'N/A'}
                            </Typography>
                            {isOverdue && <Chip label="Overdue" size="small" color="error" sx={{ ml: 0.5 }} />}
                          </TableCell>
                          <TableCell><Typography fontWeight={600} color="success.dark">৳{(u.interestPaid ?? 0).toLocaleString()}</Typography></TableCell>
                          <TableCell><Button size="small" variant="outlined" onClick={() => navigate(`/admin/customer/${u.id}`)}>View</Button></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Box>
      )}

      {/* INTEREST */}
      {tab === 'interest' && (
        <Box>
          <Stack alignItems="flex-start" mb={3}>
            <Typography variant="h6" fontWeight={700}>Interest Payment Records</Typography>
            <Typography variant="body2" color="text.secondary">{customersWithInterestPaid.length} customers with interest history</Typography>
          </Stack>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            {customersWithInterestPaid.length === 0 ? (
              <Box textAlign="center" py={8}>
                <TrendingUp size={48} color="text.disabled" style={{ marginBottom: 8 }} />
                <Typography variant="h6" color="text.secondary">No interest payments recorded</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      {['Customer', 'Loan Amount', 'Rate', 'Total Interest Paid', 'Last Payment'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customersWithInterestPaid.map(u => (
                      <TableRow key={u.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => navigate(`/admin/customer/${u.id}`)}>{u.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{u.accountNumber}</Typography>
                        </TableCell>
                        <TableCell>৳{u.loanAmount?.toLocaleString() ?? 'N/A'}</TableCell>
                        <TableCell>{u.loanInterestRate ?? 'N/A'}%</TableCell>
                        <TableCell><Typography fontWeight={700} color="success.dark">৳{(u.interestPaid ?? 0).toLocaleString()}</Typography></TableCell>
                        <TableCell>{u.lastInterestPaidDate ? new Date(u.lastInterestPaidDate).toLocaleDateString() : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Box>
      )}

      {/* ADMINS */}
      {tab === 'admins' && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Admin Accounts</Typography>
              <Typography variant="body2" color="text.secondary">Manage administrator access</Typography>
            </Box>
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setCreateAdminOpen(true)}>Create Admin</Button>
          </Stack>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    {['Administrator', 'Email', 'Account No.', 'Created'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allAdmins.map(a => (
                    <TableRow key={a.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.9rem' }}>{a.name.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{a.name}</Typography>
                            <Chip label="Admin" size="small" color="primary" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2">{a.email}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">{a.accountNumber}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{new Date(a.createdAt).toLocaleDateString()}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* Dialogs */}
      <CreateUserDialog open={createCustomerOpen} onClose={() => setCreateCustomerOpen(false)} onCreated={() => { setCreateCustomerOpen(false); toast.showSuccess('Customer created & auto-approved!'); refresh(); }} role="user" />
      <CreateUserDialog open={createAdminOpen} onClose={() => setCreateAdminOpen(false)} onCreated={() => { setCreateAdminOpen(false); toast.showSuccess('Admin account created!'); refresh(); }} role="admin" />

      <Dialog open={depositOpen} onClose={() => setDepositOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Admin Deposit</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Direct deposit to <strong>{allUsers.find(u => u.id === selectedUserId)?.name}</strong>'s account.
          </Typography>
          <TextField fullWidth label="Amount (৳)" type="number" value={depositAmount} onChange={e => { setDepositAmount(e.target.value); setDepositError(''); }} error={!!depositError} helperText={depositError} inputProps={{ min: 1 }} autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDepositOpen(false)} fullWidth>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleAdminDeposit} fullWidth>Deposit</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Delete Customer Account</DialogTitle>
        <DialogContent>
          {(() => {
            const u = deleteConfirmId ? getUsers().find(u => u.id === deleteConfirmId) : null;
            return u ? (
              <Box>
                <Typography variant="body1" mb={1}>
                  Are you sure you want to permanently delete the account of <strong>{u.name}</strong>?
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Account: <strong>{u.accountNumber}</strong> &nbsp;|&nbsp; Balance: <strong>৳{u.balance.toLocaleString()}</strong>
                </Typography>
                <Typography variant="body2" color="error.main" fontWeight={600}>
                  This action is irreversible. All account data and transaction history will be removed.
                </Typography>
              </Box>
            ) : null;
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteConfirmId(null)} fullWidth>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            fullWidth
            startIcon={<DeleteIcon />}
            onClick={() => {
              if (!deleteConfirmId) return;
              deleteUser(deleteConfirmId);
              setDeleteConfirmId(null);
              toast.showSuccess('Customer account deleted successfully.');
              refresh();
            }}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  role: 'user' | 'admin';
}

function CreateUserDialog({ open, onClose, onCreated, role }: CreateUserDialogProps) {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', nidNumber: '', dob: '', gender: 'Male', fatherName: '', motherName: '', accountType: 'Savings' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [createdPin, setCreatedPin] = useState('');
  const [done, setDone] = useState(false);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleCreate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Required';
    const emailErr = validateEmail(form.email); if (emailErr) errs.email = emailErr;
    const mobileErr = validateMobile(form.mobile); if (mobileErr) errs.mobile = mobileErr;
    const pwErr = validatePassword(form.password); if (pwErr) errs.password = pwErr;
    if (role === 'user') {
      const nidErr = validateNID(form.nidNumber); if (nidErr) errs.nidNumber = nidErr;
      const ageErr = validateAge(form.dob); if (ageErr) errs.dob = ageErr;
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (getUserByEmail(form.email)) { setGlobalError('Email already exists'); return; }
    setGlobalError('');
    const autoPin = generatePin();
    createUser({
      name: form.name, fatherName: form.fatherName, motherName: form.motherName,
      nidNumber: form.nidNumber || '0000000000', dob: form.dob || '1990-01-01',
      gender: form.gender, mobile: form.mobile, email: form.email, password: form.password,
      pin: autoPin, accountType: form.accountType, balance: 0, role,
      isApproved: role === 'user' ? true : undefined,
    });
    setCreatedPin(autoPin);
    setDone(true);
  };

  const handleClose = () => {
    setForm({ name: '', email: '', mobile: '', password: '', nidNumber: '', dob: '', gender: 'Male', fatherName: '', motherName: '', accountType: 'Savings' });
    setErrors({}); setGlobalError(''); setCreatedPin(''); setDone(false);
    if (done) onCreated(); else onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create {role === 'admin' ? 'Admin' : 'Customer'} Account</DialogTitle>
      <DialogContent>
        {done ? (
          <Box textAlign="center" py={2}>
            <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" fontWeight={700} mb={1}>Account Created!</Typography>
            <Paper sx={{ bgcolor: 'warning.50', border: '2px solid', borderColor: 'warning.main', p: 2.5, borderRadius: 2, mt: 2 }}>
              <Typography variant="body2" color="warning.dark" fontWeight={600} mb={1}>Auto-Generated PIN</Typography>
              <Typography variant="h3" fontWeight={900} letterSpacing={8} color="warning.dark">{createdPin}</Typography>
              <Alert severity="warning" sx={{ mt: 1.5, textAlign: 'left' }}>Share this PIN with the customer — it won't be shown again.</Alert>
            </Paper>
          </Box>
        ) : (
          <>
            {globalError && <Alert severity="error" sx={{ mb: 2 }}>{globalError}</Alert>}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={12}><TextField fullWidth label="Full Name" value={form.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} error={!!errors.email} helperText={errors.email} required /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Mobile" value={form.mobile} onChange={set('mobile')} error={!!errors.mobile} helperText={errors.mobile} required placeholder="01XXXXXXXXX" /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Password" type="password" value={form.password} onChange={set('password')} error={!!errors.password} helperText={errors.password} required /></Grid>
              {role === 'user' && <>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="NID Number" value={form.nidNumber} onChange={set('nidNumber')} error={!!errors.nidNumber} helperText={errors.nidNumber} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Date of Birth" type="date" value={form.dob} onChange={set('dob')} error={!!errors.dob} helperText={errors.dob} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Father's Name" value={form.fatherName} onChange={set('fatherName')} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Mother's Name" value={form.motherName} onChange={set('motherName')} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth><InputLabel>Gender</InputLabel>
                    <Select value={form.gender} label="Gender" onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                      <MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem><MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth><InputLabel>Account Type</InputLabel>
                    <Select value={form.accountType} label="Account Type" onChange={e => setForm(p => ({ ...p, accountType: e.target.value }))}>
                      <MenuItem value="Savings">Savings</MenuItem><MenuItem value="Checking">Checking</MenuItem><MenuItem value="Current">Current</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>}
            </Grid>
            <Alert severity="info" sx={{ mt: 2 }}>A 6-digit PIN will be auto-generated and shown after creation.</Alert>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {done ? (
          <Button variant="contained" onClick={handleClose} fullWidth>Done</Button>
        ) : (
          <>
            <Button variant="outlined" onClick={handleClose} fullWidth>Cancel</Button>
            <Button variant="contained" onClick={handleCreate} fullWidth>Create Account</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
