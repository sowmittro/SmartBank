import { useState } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment,
  Tabs, Tab, Alert, IconButton, Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import AdminLayout from '../components/AdminLayout';
import { CardStatusBadge, CardDetailsModal } from '../components/CardComponents';
import {
  getAllCards, getAllApplications, getAllReplacements,
  updateCard, updateApplication, deleteCard,
  saveAllReplacements,
  createCard, freezeCard, unfreezeCard,
  type BankCard, type CardApplication, type CardReplacement,
} from '../utils/mockCardsData';
import { getUsers, addNotification, getUserById } from '../utils/localStorageDB';
import { getAllCardTxnRecords } from '../utils/cardTransactionService';
import { useToast } from '../context/ToastContext';

export default function AdminCards() {
  const toast = useToast();
  const [, setRefreshKey] = useState(0);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<BankCard | null>(null);
  const [rejectDialog, setRejectDialog] = useState<CardApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteConfirmCard, setDeleteConfirmCard] = useState<BankCard | null>(null);
  const [limitsCard, setLimitsCard] = useState<BankCard | null>(null);
  const [limitsData, setLimitsData] = useState({ dailyLimit: 50000, perTxnLimit: 25000 });
  const [txnHistoryCard, setTxnHistoryCard] = useState<BankCard | null>(null);

  const refresh = () => setRefreshKey(k => k + 1);

  const users = getUsers();
  const allCards = getAllCards();
  const allApplications = getAllApplications();
  const allReplacements = getAllReplacements();
  const allTxnRecords = getAllCardTxnRecords();

  const pendingApplications = allApplications.filter(a => a.status === 'pending');
  const pendingReplacements = allReplacements.filter(r => r.status === 'pending');
  const suspiciousTxns = allTxnRecords.filter(r => r.status === 'failed' && r.failureReason?.includes('fraud'));

  const filteredCards = allCards.filter(c => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    const matchesSearch = !search ||
      c.holderName.toLowerCase().includes(search.toLowerCase()) ||
      c.accountNumber.includes(search) ||
      c.number.includes(search);
    return matchesStatus && matchesType && matchesSearch;
  });

  const getUserName = (userId: string) => getUserById(userId)?.name ?? users.find(u => u.id === userId)?.name ?? userId;

  const handleApproveApplication = (app: CardApplication) => {
    const user = getUserById(app.userId);
    const card = createCard({
      userId: app.userId,
      accountNumber: app.accountNumber,
      network: app.network,
      type: app.cardType,
      holderName: (user?.name ?? 'CARDHOLDER').toUpperCase(),
      creditLimit: app.creditLimit,
      approvedBy: 'admin',
    });
    updateApplication(app.id, { status: 'approved', processedAt: new Date().toISOString(), processedBy: 'admin' });
    addNotification({
      accountNumber: app.accountNumber,
      message: `Your ${app.network} ${app.cardType} card application has been approved! Card ending in ${card.number.slice(-4)} is now active.`,
      type: 'success',
    });
    toast.showSuccess(`Card approved for ${getUserName(app.userId)}. Card ending in ${card.number.slice(-4)}.`);
    refresh();
  };

  const handleRejectApplication = () => {
    if (!rejectDialog) return;
    updateApplication(rejectDialog.id, {
      status: 'rejected',
      processedAt: new Date().toISOString(),
      processedBy: 'admin',
      notes: rejectReason,
    });
    addNotification({
      accountNumber: rejectDialog.accountNumber,
      message: `Your ${rejectDialog.network} ${rejectDialog.cardType} card application was rejected. ${rejectReason ? 'Reason: ' + rejectReason : ''}`,
      type: 'error',
    });
    toast.showSuccess('Card application rejected.');
    setRejectDialog(null);
    setRejectReason('');
    refresh();
  };

  const handleCardStatus = (card: BankCard, newStatus: BankCard['status']) => {
    updateCard(card.id, { status: newStatus });
    addNotification({
      accountNumber: card.accountNumber,
      message: `Your ${card.network} ${card.type} card has been ${newStatus === 'blocked' ? 'blocked' : newStatus === 'frozen' ? 'frozen' : 'reactivated'}.`,
      type: newStatus === 'active' ? 'success' : 'error',
    });
    toast.showSuccess(`Card ${newStatus}.`);
    refresh();
  };

  const handleFreezeToggle = (card: BankCard) => {
    if (card.status === 'active') {
      freezeCard(card.id);
      addNotification({ accountNumber: card.accountNumber, message: `Your card ****${card.number.slice(-4)} has been frozen by admin.`, type: 'warning' });
      toast.showSuccess('Card frozen.');
    } else if (card.status === 'frozen') {
      unfreezeCard(card.id);
      addNotification({ accountNumber: card.accountNumber, message: `Your card ****${card.number.slice(-4)} has been unfrozen by admin.`, type: 'success' });
      toast.showSuccess('Card unfrozen.');
    }
    refresh();
  };

  const handleDeleteCard = () => {
    if (!deleteConfirmCard) return;
    deleteCard(deleteConfirmCard.id);
    addNotification({
      accountNumber: deleteConfirmCard.accountNumber,
      message: `Your ${deleteConfirmCard.network} ${deleteConfirmCard.type} card (****${deleteConfirmCard.number.slice(12)}) has been cancelled and removed by admin.`,
      type: 'error',
    });
    toast.showSuccess(`Card deleted for ${getUserName(deleteConfirmCard.userId)}.`);
    setDeleteConfirmCard(null);
    refresh();
  };

  const handleApproveReplacement = (rep: CardReplacement) => {
    const oldCard = allCards.find(c => c.id === rep.cardId);
    if (!oldCard) return;
    const newCard = createCard({
      userId: oldCard.userId,
      accountNumber: oldCard.accountNumber,
      network: oldCard.network,
      type: oldCard.type,
      holderName: oldCard.holderName,
      creditLimit: oldCard.creditLimit,
      approvedBy: 'admin',
    });
    updateCard(oldCard.id, { status: 'blocked' });
    const reps = getAllReplacements();
    const idx = reps.findIndex(r => r.id === rep.id);
    if (idx >= 0) {
      reps[idx] = { ...reps[idx], status: 'completed' as const, processedAt: new Date().toISOString(), newCardId: newCard.id };
      saveAllReplacements(reps);
    }
    addNotification({
      accountNumber: oldCard.accountNumber,
      message: `Your card replacement request has been approved. New card ending in ${newCard.number.slice(-4)} is now active.`,
      type: 'success',
    });
    toast.showSuccess('Replacement approved. New card issued.');
    refresh();
  };

  const handleOpenLimits = (card: BankCard) => {
    setLimitsCard(card);
    setLimitsData({ dailyLimit: card.dailyLimit, perTxnLimit: card.perTxnLimit });
  };

  const handleSaveLimits = () => {
    if (!limitsCard) return;
    updateCard(limitsCard.id, { dailyLimit: limitsData.dailyLimit, perTxnLimit: limitsData.perTxnLimit });
    addNotification({
      accountNumber: limitsCard.accountNumber,
      message: `Transaction limits updated for your card ****${limitsCard.number.slice(-4)}. Daily: ৳${limitsData.dailyLimit.toLocaleString()}, Per-txn: ৳${limitsData.perTxnLimit.toLocaleString()}.`,
      type: 'info',
    });
    toast.showSuccess('Transaction limits updated.');
    setLimitsCard(null);
    refresh();
  };

  const cardTxnRecords = !txnHistoryCard
    ? []
    : allTxnRecords.filter(r => r.cardId === txnHistoryCard.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <AdminLayout title="Card Management">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Card Management</Typography>
            <Typography variant="body2" color="text.secondary">
              {allCards.length} card{allCards.length !== 1 ? 's' : ''} · {pendingApplications.length} pending app{pendingApplications.length !== 1 ? 's' : ''} · {suspiciousTxns.length} suspicious
            </Typography>
          </Box>
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Applications (${pendingApplications.length})`} />
          <Tab label={`Replacements (${pendingReplacements.length})`} />
          <Tab label={`All Cards (${allCards.length})`} />
          <Tab label={`Audit Log (${allTxnRecords.length})`} />
          {suspiciousTxns.length > 0 && <Tab label={`Suspicious (${suspiciousTxns.length})`} />}
        </Tabs>

        {/* Pending Applications */}
        {tab === 0 && (
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Account</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Card Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Network</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Credit Limit</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Applied</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingApplications.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No pending applications</Typography></TableCell></TableRow>
                ) : pendingApplications.map(app => (
                  <TableRow key={app.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={600}>{getUserName(app.userId)}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontFamily="monospace">{app.accountNumber}</Typography></TableCell>
                    <TableCell><Chip size="small" label={app.cardType} color={app.cardType === 'credit' ? 'secondary' : 'primary'} variant="outlined" /></TableCell>
                    <TableCell><Chip size="small" label={app.network.toUpperCase()} sx={{ fontWeight: 600 }} /></TableCell>
                    <TableCell><Typography variant="body2">{app.creditLimit ? `৳${app.creditLimit.toLocaleString()}` : '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{new Date(app.requestedAt).toLocaleDateString()}</Typography></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleApproveApplication(app)}>Approve</Button>
                        <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setRejectDialog(app)}>Reject</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Replacement Requests */}
        {tab === 1 && (
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            {pendingReplacements.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}><Typography color="text.secondary">No pending replacement requests</Typography></Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Card</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Requested</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingReplacements.map(rep => {
                    const card = allCards.find(c => c.id === rep.cardId);
                    return (
                      <TableRow key={rep.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{card ? getUserName(card.userId) : '—'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" fontFamily="monospace">{card ? `****${card.number.slice(12)}` : '—'}</Typography></TableCell>
                        <TableCell><Chip size="small" label={rep.reason} variant="outlined" /></TableCell>
                        <TableCell><Typography variant="body2">{new Date(rep.requestedAt).toLocaleDateString()}</Typography></TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="contained" color="success" onClick={() => handleApproveReplacement(rep)}>Approve</Button>
                            <Button size="small" variant="outlined" color="error" onClick={() => { const reps = getAllReplacements(); saveAllReplacements(reps.map(r => r.id === rep.id ? { ...r, status: 'rejected' as const, processedAt: new Date().toISOString() } : r)); refresh(); }}>Reject</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        )}

        {/* All Cards */}
        {tab === 2 && (
          <>
            <Card sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth size="small" placeholder="Search by name, account, card number..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="frozen">Frozen</MenuItem>
                      <MenuItem value="blocked">Blocked</MenuItem>
                      <MenuItem value="expired">Expired</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)}>
                      <MenuItem value="all">All Types</MenuItem>
                      <MenuItem value="debit">Debit</MenuItem>
                      <MenuItem value="credit">Credit</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Card</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Network / Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Limits</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCards.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No cards found</Typography></TableCell></TableRow>
                  ) : filteredCards.map(card => (
                    <TableRow key={card.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{getUserName(card.userId)}</Typography>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">{card.accountNumber}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" fontFamily="monospace">**** **** **** {card.number.slice(12)}</Typography></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Chip size="small" label={card.network.toUpperCase()} sx={{ fontWeight: 600 }} />
                          <Chip size="small" label={card.type} color={card.type === 'credit' ? 'secondary' : 'primary'} variant="outlined" />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" display="block">Daily: ৳{card.dailyLimit.toLocaleString()}</Typography>
                        <Typography variant="caption" color="text.secondary">Per-txn: ৳{card.perTxnLimit.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell><CardStatusBadge status={card.status} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          <Tooltip title="View Details"><IconButton size="small" onClick={() => setSelectedCard(card)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Transaction History"><IconButton size="small" onClick={() => setTxnHistoryCard(card)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
                          {card.status === 'active' && (
                            <Tooltip title="Freeze Card">
                              <IconButton size="small" color="warning" onClick={() => handleFreezeToggle(card)}><LockIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                          {card.status === 'frozen' && (
                            <Tooltip title="Unfreeze Card">
                              <IconButton size="small" color="success" onClick={() => handleFreezeToggle(card)}><LockOpenIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                          {card.status !== 'pending' && card.status !== 'expired' && (
                            <Button size="small" variant="outlined" color={card.status === 'active' ? 'error' : 'success'}
                              onClick={() => handleCardStatus(card, card.status === 'active' ? 'blocked' : 'active')}>
                              {card.status === 'active' ? 'Block' : 'Activate'}
                            </Button>
                          )}
                          <Button size="small" variant="outlined" onClick={() => handleOpenLimits(card)}>Limits</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => setDeleteConfirmCard(card)}>Delete</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

        {/* Audit Log */}
        {tab === 3 && (
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Date/Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Card</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Channel</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Merchant</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allTxnRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No transactions recorded</Typography></TableCell></TableRow>
                ) : allTxnRecords.slice().reverse().slice(0, 100).map(r => (
                  <TableRow key={r.id} hover>
                    <TableCell><Typography variant="caption">{new Date(r.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600}>{r.customerName}</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontFamily="monospace">****{r.cardLast4}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{r.txnType.replace(/_/g, ' ')}</Typography></TableCell>
                    <TableCell><Chip label={r.channel} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                    <TableCell><Typography variant="caption">{r.merchant}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="caption">৳{r.amount.toLocaleString()}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="caption" fontWeight={700}>৳{r.totalDeducted.toLocaleString()}</Typography></TableCell>
                    <TableCell><Chip label={r.status} size="small" color={r.status === 'success' ? 'success' : r.status === 'failed' ? 'error' : 'default'} sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }} /></TableCell>
                    <TableCell><Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>{r.referenceId}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Showing latest 100 of {allTxnRecords.length} transactions</Typography></Box>
          </Card>
        )}

        {/* Suspicious Activity */}
        {tab === 4 && suspiciousTxns.length > 0 && (
          <Card sx={{ border: '1px solid', borderColor: 'error.main', boxShadow: 'none' }}>
            <Alert severity="error" sx={{ borderRadius: 0 }}>
              <Typography variant="subtitle2" fontWeight={700}>Suspicious Activity Detected</Typography>
              <Typography variant="caption">{suspiciousTxns.length} transaction(s) flagged for fraud detection</Typography>
            </Alert>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'error.50' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Date/Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Card</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suspiciousTxns.map(r => (
                  <TableRow key={r.id} hover>
                    <TableCell><Typography variant="caption">{new Date(r.date).toLocaleString()}</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={600}>{r.customerName}</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontFamily="monospace">****{r.cardLast4}</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700} color="error.main">৳{r.amount.toLocaleString()}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="error.main">{r.failureReason}</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>{r.referenceId}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </Box>

      <CardDetailsModal open={selectedCard !== null} onClose={() => setSelectedCard(null)} card={selectedCard} showActions={false} transactionsOnly />

      <Dialog open={deleteConfirmCard !== null} onClose={() => setDeleteConfirmCard(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Delete Card</DialogTitle>
        <DialogContent>
          {deleteConfirmCard && (
            <Box>
              <Typography variant="body1" mb={1}>Are you sure you want to permanently delete this card?</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Card: <strong>**** **** **** {deleteConfirmCard.number.slice(12)}</strong> ({deleteConfirmCard.network.toUpperCase()} {deleteConfirmCard.type})<br />
                Holder: <strong>{getUserName(deleteConfirmCard.userId)}</strong>
              </Typography>
              <Typography variant="body2" color="error.main" fontWeight={600}>This action is irreversible. The card will be permanently removed.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteConfirmCard(null)} fullWidth>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteCard} fullWidth>Delete Card</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectDialog !== null} onClose={() => setRejectDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Card Application</DialogTitle>
        <DialogContent>
          {rejectDialog && (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Rejecting application for {getUserName(rejectDialog.userId)} ({rejectDialog.network} {rejectDialog.cardType}).
              </Typography>
              <TextField fullWidth label="Rejection Reason (optional)" value={rejectReason}
                onChange={e => setRejectReason(e.target.value)} multiline rows={2} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => { setRejectDialog(null); setRejectReason(''); }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectApplication}>Reject Application</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={limitsCard !== null} onClose={() => setLimitsCard(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Configure Transaction Limits</DialogTitle>
        <DialogContent>
          {limitsCard && (
            <Stack spacing={2} mt={1}>
              <Typography variant="body2" color="text.secondary">
                Card: ****{limitsCard.number.slice(-4)} · {limitsCard.holderName}
              </Typography>
              <TextField fullWidth label="Daily Transaction Limit (৳)" type="number" value={limitsData.dailyLimit}
                onChange={e => setLimitsData({ ...limitsData, dailyLimit: parseInt(e.target.value) || 0 })}
                InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} />
              <TextField fullWidth label="Per-Transaction Limit (৳)" type="number" value={limitsData.perTxnLimit}
                onChange={e => setLimitsData({ ...limitsData, perTxnLimit: parseInt(e.target.value) || 0 })}
                InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setLimitsCard(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveLimits}>Save Limits</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={txnHistoryCard !== null} onClose={() => setTxnHistoryCard(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Card Transactions — {txnHistoryCard && `**** ${txnHistoryCard.number.slice(-4)}`}
        </DialogTitle>
        <DialogContent>
          {txnHistoryCard && (
            <Card variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Channel</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Merchant</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Reference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cardTxnRecords.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No transactions</Typography></TableCell></TableRow>
                  ) : cardTxnRecords.map(r => (
                    <TableRow key={r.id} hover>
                      <TableCell><Typography variant="caption">{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</Typography></TableCell>
                      <TableCell><Typography variant="caption" fontWeight={600}>{r.txnType.replace(/_/g, ' ')}</Typography></TableCell>
                      <TableCell><Chip label={r.channel} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                      <TableCell><Typography variant="caption">{r.merchant}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="caption">৳{r.amount.toLocaleString()}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="caption" fontWeight={700}>৳{r.totalDeducted.toLocaleString()}</Typography></TableCell>
                      <TableCell><Chip label={r.status} size="small" color={r.status === 'success' ? 'success' : r.status === 'failed' ? 'error' : 'default'} sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }} /></TableCell>
                      <TableCell><Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>{r.referenceId}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setTxnHistoryCard(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
