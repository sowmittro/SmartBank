import { useState } from 'react';
import {
  Box, Card, CardContent, Chip, Divider, FormControl, Grid, InputLabel,
  MenuItem, Select, Stack, TextField, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Search, Download, Filter } from 'lucide-react';
import CustomerLayout from '../components/CustomerLayout';
import { useAuth } from '../context/AuthContext';
import { getTransactionsByAccount } from '../utils/localStorageDB';
import type { Transaction } from '../utils/localStorageDB';
import { BANK_COLORS } from '../theme';

export default function Transactions() {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (!user) return null;

  const all = [...getTransactionsByAccount(user.accountNumber)].reverse();

  const filtered = all.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (fromDate && new Date(t.date) < new Date(fromDate)) return false;
    if (toDate && new Date(t.date) > new Date(toDate + 'T23:59:59')) return false;
    if (search && !t.id.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isCredit = (t: Transaction) => ['deposit', 'transfer-in', 'loan'].includes(t.type);
  const txColor = (t: Transaction) => isCredit(t) ? BANK_COLORS.secondary : BANK_COLORS.danger;

  const txLabel = (type: string) => {
    const labels: Record<string, string> = {
      'deposit': 'Deposit', 'withdraw': 'Withdrawal', 'transfer-out': 'Transfer Out',
      'transfer-in': 'Transfer In', 'loan': 'Loan', 'interest': 'Interest',
    };
    return labels[type] ?? type;
  };

  const txMethod = (t: Transaction) => {
    if (t.type === 'deposit') return 'Bank Deposit';
    if (t.type === 'withdraw') return 'ATM / Teller';
    if (t.type.startsWith('transfer')) return 'Bank Transfer';
    if (t.type === 'loan') return 'Loan Disbursement';
    if (t.type === 'interest') return 'Interest Payment';
    return 'Bank';
  };

  const statusBadge = (t: Transaction) => {
    if (t.pendingApproval) return <Chip label="Pending" size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22, bgcolor: 'rgba(255,179,0,0.12)', color: BANK_COLORS.warning }} />;
    if (t.status === 'success') return <Chip label="Success" size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22, bgcolor: 'rgba(0,200,83,0.12)', color: BANK_COLORS.success }} />;
    return <Chip label="Failed" size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22, bgcolor: 'rgba(211,47,47,0.12)', color: BANK_COLORS.danger }} />;
  };

  const miniStats = [
    { label: 'Total Deposited', value: all.filter(t => t.type === 'deposit' && t.status === 'success').reduce((s, t) => s + t.amount, 0), color: BANK_COLORS.secondary, icon: <ArrowDownRight size={18} /> },
    { label: 'Total Withdrawn', value: all.filter(t => t.type === 'withdraw' && t.status === 'success').reduce((s, t) => s + t.amount, 0), color: BANK_COLORS.danger, icon: <ArrowUpRight size={18} /> },
    { label: 'Total Sent', value: all.filter(t => t.type === 'transfer-out' && t.status === 'success').reduce((s, t) => s + t.amount, 0), color: BANK_COLORS.primary, icon: <ArrowUpRight size={18} /> },
    { label: 'Total Received', value: all.filter(t => t.type === 'transfer-in' && t.status === 'success').reduce((s, t) => s + t.amount, 0), color: BANK_COLORS.accent, icon: <ArrowDownRight size={18} /> },
  ];

  return (
    <CustomerLayout>
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif', mb: 3 }}>
          Transaction History
        </Typography>

        {/* Mini Stats */}
        <Grid container spacing={2} mb={3}>
          {miniStats.map((s, i) => (
            <Grid key={s.label} size={{ xs: 6, md: 3 }}>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                <Card sx={{ '&:hover': { boxShadow: '0 8px 16px rgba(15,76,129,0.08)' } }}>
                  <CardContent sx={{ py: 2.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{ bgcolor: `${s.color}15`, borderRadius: 2, p: 1, display: 'flex', color: s.color }}>{s.icon}</Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                        <Typography variant="h6" fontWeight={700} color={s.color}>৳{s.value.toLocaleString()}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Filter Card */}
        <Card sx={{ mb: 3, borderRadius: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Filter size={18} color={BANK_COLORS.primary} />
              <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif' }}>Filter Transactions</Typography>
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
                <TextField fullWidth size="small" label="From Date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth size="small" label="To Date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField fullWidth size="small" label="Search" value={search} onChange={e => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 6, color: '#94A3B8' }} /> }} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Transaction Table */}
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ fontFamily: '"Poppins", sans-serif' }}>
                All Transactions ({filtered.length})
              </Typography>
              <Button size="small" startIcon={<Download size={16} />} variant="outlined">Export CSV</Button>
            </Stack>
            <Divider />

            {filtered.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography color="text.secondary">No transactions found matching your filters.</Typography>
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((txn) => (
                        <TableRow key={txn.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{new Date(txn.date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</Typography>
                            <Typography variant="caption" color="text.secondary">{new Date(txn.date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Box sx={{ bgcolor: `${txColor(txn)}15`, borderRadius: 2, p: 0.75, display: 'flex', color: txColor(txn) }}>
                                {isCredit(txn) ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                              </Box>
                              <Typography variant="body2" fontWeight={600}>{txLabel(txn.type)}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} color={txColor(txn)}>
                              {isCredit(txn) ? '+' : '-'}৳{txn.amount.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>{statusBadge(txn)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{txMethod(txn)}</Typography>
                          </TableCell>
                          <TableCell>
                            {txn.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.description}</Typography>}
                            {txn.toAccount && <Typography variant="caption" color="text.secondary">To: {txn.toAccount}</Typography>}
                            {txn.fromAccount && <Typography variant="caption" color="text.secondary">From: {txn.fromAccount}</Typography>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filtered.length}
                  page={page}
                  onPageChange={(_, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  rowsPerPageOptions={[10, 25, 50]}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </CustomerLayout>
  );
}
