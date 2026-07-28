import { useState } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import EmployeeLayout from '../../components/EmployeeLayout';
import { CardStatusBadge, CardDetailsModal } from '../../components/CardComponents';
import {
  getAllCards, getAllApplications, getAllReplacements, updateCard,
  updateApplication, saveAllReplacements, createCard,
  type BankCard, type CardApplication, type CardReplacement,
} from '../../utils/mockCardsData';
import { getUserById, getUsers, addNotification } from '../../utils/localStorageDB';
import { useToast } from '../../context/ToastContext';

export default function EmployeeCardApplication() {
  const toast = useToast();
  const [, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<BankCard | null>(null);
  const [rejectDialog, setRejectDialog] = useState<CardApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const refresh = () => setRefreshKey(k => k + 1);

  const users = getUsers();
  const allCards = getAllCards();
  const allApplications = getAllApplications();
  const allReplacements = getAllReplacements();

  const pendingApplications = allApplications.filter(a => a.status === 'pending');
  const pendingReplacements = allReplacements.filter(r => r.status === 'pending');

  const filteredCards = allCards.filter(c => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch = !search ||
      c.holderName.toLowerCase().includes(search.toLowerCase()) ||
      c.accountNumber.includes(search) ||
      c.number.includes(search);
    return matchesStatus && matchesSearch;
  });

  const getUserName = (userId: string) => getUserById(userId)?.name ?? users.find(u => u.id === userId)?.name ?? userId;

  const handleApproveApplication = (app: CardApplication) => {
    const user = getUserById(app.userId);
    createCard({
      userId: app.userId,
      accountNumber: app.accountNumber,
      network: app.network,
      type: app.cardType,
      holderName: (user?.name ?? 'CARDHOLDER').toUpperCase(),
      creditLimit: app.creditLimit,
      approvedBy: 'employee',
    });
    updateApplication(app.id, { status: 'approved', processedAt: new Date().toISOString(), processedBy: 'employee' });
    addNotification({
      accountNumber: app.accountNumber,
      message: `Your ${app.network} ${app.cardType} card application has been approved!`,
      type: 'success',
    });
    toast.showSuccess(`Card approved and issued for ${getUserName(app.userId)}.`);
    refresh();
  };

  const handleRejectApplication = () => {
    if (!rejectDialog) return;
    updateApplication(rejectDialog.id, {
      status: 'rejected',
      processedAt: new Date().toISOString(),
      processedBy: 'employee',
      notes: rejectReason,
    });
    addNotification({
      accountNumber: rejectDialog.accountNumber,
      message: `Your ${rejectDialog.network} ${rejectDialog.cardType} card application was rejected.`,
      type: 'error',
    });
    toast.showSuccess(`Card application rejected.`);
    setRejectDialog(null);
    setRejectReason('');
    refresh();
  };

  const handleBlockCard = (card: BankCard) => {
    updateCard(card.id, { status: 'blocked' });
    addNotification({
      accountNumber: card.accountNumber,
      message: `Your ${card.network} ${card.type} card has been blocked.`,
      type: 'error',
    });
    toast.showSuccess(`Card blocked.`);
    refresh();
  };

  const handleUnblockCard = (card: BankCard) => {
    updateCard(card.id, { status: 'active' });
    addNotification({
      accountNumber: card.accountNumber,
      message: `Your ${card.network} ${card.type} card has been unblocked.`,
      type: 'success',
    });
    toast.showSuccess(`Card unblocked.`);
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
      approvedBy: 'employee',
    });
    updateCard(oldCard.id, { status: 'blocked' });
    const reps = getAllReplacements();
    const idx = reps.findIndex(r => r.id === rep.id);
    if (idx >= 0) {
      reps[idx] = { ...reps[idx], status: 'completed', processedAt: new Date().toISOString(), newCardId: newCard.id };
      saveAllReplacements(reps);
    }
    addNotification({
      accountNumber: oldCard.accountNumber,
      message: `Your card replacement request has been approved. A new card has been issued.`,
      type: 'success',
    });
    toast.showSuccess('Replacement approved. New card issued.');
    refresh();
  };

  return (
    <EmployeeLayout title="Card Applications">
      <Box>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Card Application Processing</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Review and process debit/credit card applications and replacement requests.</Typography>

        {/* Pending Applications */}
        <Typography variant="h6" fontWeight={600} mb={1.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCardIcon fontSize="small" color="warning" />
          Pending Card Applications
          {pendingApplications.length > 0 && <Chip label={pendingApplications.length} size="small" color="warning" />}
        </Typography>
        <Card sx={{ mb: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Account</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Card Type</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Network</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Credit Limit</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Applied</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingApplications.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No pending applications</Typography></TableCell></TableRow>
              ) : pendingApplications.map(app => (
                <TableRow key={app.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{getUserName(app.userId)}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontFamily="monospace">{app.accountNumber}</Typography></TableCell>
                  <TableCell><Chip size="small" label={app.cardType} variant="outlined" /></TableCell>
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

        {/* Replacement Requests */}
        {pendingReplacements.length > 0 && (
          <>
            <Typography variant="h6" fontWeight={600} mb={1.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BlockIcon fontSize="small" color="warning" />
              Card Replacement Requests
              <Chip label={pendingReplacements.length} size="small" color="warning" />
            </Typography>
            <Card sx={{ mb: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Card</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Requested</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Actions</TableCell>
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
            </Card>
          </>
        )}

        {/* Card Management */}
        <Typography variant="h6" fontWeight={600} mb={1.5}>Issue / Block Cards</Typography>
        <Card sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth size="small"
                placeholder="Search by name, account, card number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="frozen">Frozen</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Card</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Network / Type</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Expiry</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Actions</TableCell>
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
                  <TableCell><Typography variant="body2" fontFamily="monospace">****{card.number.slice(12)}</Typography></TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Chip size="small" label={card.network.toUpperCase()} sx={{ fontWeight: 600 }} />
                      <Chip size="small" label={card.type} variant="outlined" />
                    </Stack>
                  </TableCell>
                  <TableCell><Typography variant="body2" fontFamily="monospace">{card.expiry}</Typography></TableCell>
                  <TableCell><CardStatusBadge status={card.status} /></TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Button size="small" variant="outlined" onClick={() => setSelectedCard(card)}>Details</Button>
                      {card.status === 'active' && (
                        <Button size="small" variant="outlined" color="error" startIcon={<BlockIcon />} onClick={() => handleBlockCard(card)}>Block</Button>
                      )}
                      {card.status === 'blocked' && (
                        <Button size="small" variant="contained" color="success" onClick={() => handleUnblockCard(card)}>Unblock</Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Box>

      {/* Card Details Modal */}
      <CardDetailsModal
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        card={selectedCard}
        showActions={false}
        transactionsOnly
      />

      {/* Reject Dialog */}
      <Dialog open={rejectDialog !== null} onClose={() => setRejectDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Card Application</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Rejecting application for {rejectDialog?.network} {rejectDialog?.cardType} card.
          </Typography>
          <TextField fullWidth label="Reason (optional)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => { setRejectDialog(null); setRejectReason(''); }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectApplication}>Reject</Button>
        </DialogActions>
      </Dialog>
    </EmployeeLayout>
  );
}
