import { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Stack, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, MenuItem, InputAdornment,
  TablePagination, Divider,
} from '@mui/material';
import { Search, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { User } from '../../utils/localStorageDB';
import { getTransactionsByAccount } from '../../utils/localStorageDB';

const isCredit = (type: string) => type === 'deposit' || type === 'transfer-in' || type === 'loan' || type === 'interest';

const txLabel = (type: string) => {
  const labels: Record<string, string> = {
    deposit: 'Deposit', withdraw: 'Withdrawal', 'transfer-out': 'Transfer Out',
    'transfer-in': 'Transfer In', loan: 'Loan', interest: 'Interest',
  };
  return labels[type] || type;
};

const statusChip = (status: string) => {
  if (status === 'success') return <Chip size="small" label="Success" color="success" variant="outlined" />;
  if (status === 'pending') return <Chip size="small" label="Pending" color="warning" variant="outlined" />;
  return <Chip size="small" label="Failed" color="error" variant="outlined" />;
};

export function TransactionsSection({ user }: { user: User }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const allTxns = useMemo(() => {
    const txns = getTransactionsByAccount(user.accountNumber);
    return [...txns].reverse();
  }, [user.accountNumber]);

  const filtered = useMemo(() => {
    return allTxns.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (t.id?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.toAccount?.toLowerCase().includes(q) || t.fromAccount?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [allTxns, search, typeFilter]);

  // Calculate running balance
  const withRunningBalance = useMemo(() => {
    const chronological = [...filtered].reverse();
    const mapped = chronological.reduce<Array<typeof chronological[number] & { balanceAfter: number }>>((acc, t) => {
      const prevBalance = acc.length > 0 ? acc[acc.length - 1].balanceAfter : 0;
      const balanceAfter = prevBalance + (isCredit(t.type) ? t.amount : -t.amount);
      acc.push({ ...t, balanceAfter });
      return acc;
    }, []);
    return mapped.reverse();
  }, [filtered]);

  const fmtCur = (n: number) => `৳${(n ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalIn = allTxns.filter(t => t.status === 'success' && isCredit(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalOut = allTxns.filter(t => t.status === 'success' && !isCredit(t.type)).reduce((s, t) => s + t.amount, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Mini stats */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ bgcolor: 'success.50', borderRadius: 2, p: 1, display: 'flex' }}>
                <ArrowDownward color="success" fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>Total In</Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">{fmtCur(totalIn)}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ bgcolor: 'error.50', borderRadius: 2, p: 1, display: 'flex' }}>
                <ArrowUpward color="error" fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>Total Out</Typography>
                <Typography variant="h6" fontWeight={700} color="error.main">{fmtCur(totalOut)}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ bgcolor: 'primary.50', borderRadius: 2, p: 1, display: 'flex' }}>
                <Typography variant="caption" fontWeight={700} color="primary.main">N</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>Total Transactions</Typography>
                <Typography variant="h6" fontWeight={700} color="text.primary">{allTxns.length}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by ID, description, account..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <TextField
          select
          size="small"
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 160 }}
          SelectProps={{ displayEmpty: true }}
        >
          <MenuItem value="all">All Types</MenuItem>
          <MenuItem value="deposit">Deposit</MenuItem>
          <MenuItem value="withdraw">Withdrawal</MenuItem>
          <MenuItem value="transfer-out">Transfer Out</MenuItem>
          <MenuItem value="transfer-in">Transfer In</MenuItem>
          <MenuItem value="loan">Loan</MenuItem>
          <MenuItem value="interest">Interest</MenuItem>
        </TextField>
      </Stack>

      {/* Transaction Table */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Txn ID</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Sender / Receiver</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Balance After</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {withRunningBalance.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((t, i) => {
                const credit = isCredit(t.type);
                return (
                  <TableRow key={t.id ?? i} hover>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{new Date(t.date).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>{new Date(t.date).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{t.id?.slice(0, 12) ?? '—'}</Typography></TableCell>
                    <TableCell>
                      <Chip size="small" label={txLabel(t.type)} variant="outlined" color={credit ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {t.type === 'transfer-out' ? `To: ${t.toAccount || '—'}` : t.type === 'transfer-in' ? `From: ${t.fromAccount || '—'}` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{t.description || '—'}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color={credit ? 'success.main' : 'error.main'}>
                        {credit ? '+' : '−'}{fmtCur(t.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{statusChip(t.status)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" fontWeight={600} color="text.primary">{fmtCur(t.balanceAfter)}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {withRunningBalance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary" variant="body2">No transactions found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <TablePagination
          component="div"
          count={withRunningBalance.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>
    </motion.div>
  );
}
