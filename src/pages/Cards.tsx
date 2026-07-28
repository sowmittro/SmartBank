import { useState, useMemo } from 'react';
import {
  Box, Card, Typography, Button, Chip, Stack, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Divider,
  FormControl, InputLabel, Select, MenuItem, Paper, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import HistoryIcon from '@mui/icons-material/History';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PaymentsIcon from '@mui/icons-material/Payments';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import CustomerLayout from '../components/CustomerLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CardVisual, CardStatusBadge, CardDetailsModal, CardApplicationForm } from '../components/CardComponents';
import NewCardTransactionDialog from '../components/NewCardTransactionDialog';
import {
  type BankCard, type CardApplication, type CardReplacement,
  getCardsByUser, saveAllApplications,
  getAllApplications, saveAllReplacements, getAllReplacements,
  isAnnualFeeDue, getDaysUntilFeeDue, chargeAnnualFee,
  freezeCard, unfreezeCard,
} from '../utils/mockCardsData';
import { addNotification } from '../utils/localStorageDB';
import { getCardTxnRecordsByCard } from '../utils/cardTransactionService';

export default function Cards() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<BankCard | null>(null);
  const [replacementOpen, setReplacementOpen] = useState(false);
  const [replacementReason, setReplacementReason] = useState<CardReplacement['reason']>('lost');
  const [txnDialogCard, setTxnDialogCard] = useState<BankCard | null>(null);
  const [historyCard, setHistoryCard] = useState<BankCard | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const refresh = () => { setRefreshKey(k => k + 1); refreshUser(); };

  const cards = user ? getCardsByUser(user.id) : [];
  const allApplications = getAllApplications();
  const pendingApps = allApplications.filter(a => a.userId === user?.id && a.status === 'pending');

  const activeDebitCards = cards.filter(c => c.type === 'debit' && c.status === 'active');
  const activeCreditCards = cards.filter(c => c.type === 'credit' && c.status === 'active');
  const frozenCards = cards.filter(c => c.status === 'frozen' || c.status === 'blocked');

  const handleApplyForCard = (data: { cardType: 'debit' | 'credit'; network: 'visa' | 'mastercard'; creditLimit?: number }) => {
    if (!user) return;
    const app: CardApplication = {
      id: 'APP' + Date.now(),
      userId: user.id,
      accountNumber: user.accountNumber,
      cardType: data.cardType,
      network: data.network,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      creditLimit: data.creditLimit,
    };
    saveAllApplications([app, ...getAllApplications()]);
    addNotification({
      accountNumber: user.accountNumber,
      message: `${data.network.toUpperCase()} ${data.cardType} card application submitted for approval.`,
      type: 'info',
    });
    toast.showSuccess(`${data.network.toUpperCase()} ${data.cardType} card application submitted!`);
    refresh();
  };

  const handleRequestReplacement = () => {
    if (!user || !selectedCard) return;
    const rep: CardReplacement = {
      id: 'REP' + Date.now(),
      cardId: selectedCard.id,
      reason: replacementReason,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    saveAllReplacements([rep, ...getAllReplacements()]);
    addNotification({
      accountNumber: user.accountNumber,
      message: `Card replacement request submitted. Reason: ${replacementReason}.`,
      type: 'info',
    });
    toast.showSuccess('Card replacement request submitted!');
    setReplacementOpen(false);
    setSelectedCard(null);
    refresh();
  };

  const handlePayAnnualFee = (cardId: string) => {
    const result = chargeAnnualFee(cardId);
    if (result.success) {
      toast.showSuccess(result.message);
    } else {
      toast.showError(result.message);
    }
    refresh();
  };

  const handleFreezeToggle = (card: BankCard) => {
    if (card.status === 'active') {
      if (freezeCard(card.id)) {
        toast.showSuccess('Card frozen successfully. You can unfreeze it anytime.');
        addNotification({ accountNumber: card.accountNumber, message: `Your card ****${card.number.slice(-4)} has been frozen.`, type: 'warning' });
      }
    } else if (card.status === 'frozen') {
      if (unfreezeCard(card.id)) {
        toast.showSuccess('Card unfrozen successfully.');
        addNotification({ accountNumber: card.accountNumber, message: `Your card ****${card.number.slice(-4)} has been unfrozen.`, type: 'success' });
      }
    }
    refresh();
  };

  const historyRecords = useMemo(() => {
    if (!historyCard) return [];
    let records = getCardTxnRecordsByCard(historyCard.id);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      records = records.filter(r =>
        r.merchant.toLowerCase().includes(q) ||
        r.txnType.toLowerCase().includes(q) ||
        r.referenceId.toLowerCase().includes(q) ||
        r.channel.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      records = records.filter(r => r.status === statusFilter);
    }
    records.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return records;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey intentionally busts the cache after card actions mutate localStorage-backed data
  }, [historyCard, searchQuery, statusFilter, sortOrder, refreshKey]);

  const handleDownloadStatement = () => {
    if (!historyCard || historyRecords.length === 0) return;
    const lines = [
      'SmartBank - Card Transaction Statement',
      '==========================================',
      `Card Holder: ${historyCard.holderName}`,
      `Card Number: **** **** **** ${historyCard.number.slice(-4)}`,
      `Linked Account: ${historyCard.accountNumber}`,
      `Card Type: ${historyCard.type.toUpperCase()}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      '------------------------------------------',
      'Date | Type | Channel | Merchant | Amount | Fee | Total | Status | Reference',
      '------------------------------------------',
    ];
    historyRecords.forEach(r => {
      lines.push([
        new Date(r.date).toLocaleString(),
        r.txnType.replace(/_/g, ' '),
        r.channel,
        r.merchant,
        `৳${r.amount}`,
        `৳${r.fee}`,
        `৳${r.totalDeducted}`,
        r.status,
        r.referenceId,
      ].join(' | '));
    });
    lines.push('', `Total Transactions: ${historyRecords.length}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement_card_${historyCard.number.slice(-4)}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.showSuccess('Statement downloaded successfully.');
  };

  return (
    <CustomerLayout>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>My Cards</Typography>
            <Typography variant="body2" color="text.secondary">
              {cards.length} card{cards.length !== 1 ? 's' : ''} · {activeDebitCards.length} active debit · {activeCreditCards.length} credit
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<CreditCardIcon />} onClick={() => setApplyOpen(true)}>
            Apply for Card
          </Button>
        </Stack>

        {cards.filter(c => c.type === 'debit' && c.status === 'active').some(c => isAnnualFeeDue(c)) && (
          <Alert severity="warning" sx={{ mb: 3 }} icon={<PaymentsIcon />}>
            <Typography variant="body2" fontWeight={600}>Annual Card Fee Due</Typography>
            <Typography variant="caption">One or more of your debit cards have an annual fee of ৳300 due.</Typography>
          </Alert>
        )}

        {pendingApps.length > 0 && (
          <Alert severity="info" sx={{ mb: 3 }} icon={<HistoryIcon />}>
            You have {pendingApps.length} pending card application{pendingApps.length !== 1 ? 's' : ''} awaiting approval.
          </Alert>
        )}

        {cards.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider', boxShadow: 'none' }}>
            <CreditCardIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>No cards yet</Typography>
            <Typography variant="body2" color="text.disabled" mb={3}>Apply for a Visa or MasterCard debit or credit card</Typography>
            <Button variant="contained" startIcon={<CreditCardIcon />} onClick={() => setApplyOpen(true)}>
              Apply for Card
            </Button>
          </Card>
        ) : (
          <Stack spacing={4}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="text.secondary" mb={2}>Active Cards</Typography>
              <Grid container spacing={3}>
                {cards.filter(c => c.status === 'active').map(card => {
                  const feeDue = isAnnualFeeDue(card);
                  const daysUntilDue = getDaysUntilFeeDue(card);
                  const recentTxns = getCardTxnRecordsByCard(card.id).slice(-3).reverse();
                  return (
                    <Grid key={card.id} size={{ xs: 12, md: 6 }}>
                      <Box sx={{ cursor: 'pointer', maxWidth: 340 }} onClick={() => setSelectedCard(card)}>
                        <CardVisual card={card} showCvv />
                      </Box>
                      <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap" useFlexGap>
                        <Chip size="small" label={card.network.toUpperCase()} sx={{ fontWeight: 600 }} />
                        <Chip size="small" label={card.type === 'credit' ? 'Credit' : 'Debit'} variant="outlined" />
                        <CardStatusBadge status="active" />
                      </Stack>

                      <Stack direction="row" spacing={1} mt={1.5}>
                        <Button
                          size="small" variant="outlined"
                          startIcon={<HistoryIcon />}
                          onClick={(e) => { e.stopPropagation(); setHistoryCard(card); }}
                        >
                          History
                        </Button>
                      </Stack>

                      {card.type === 'debit' && card.annualFee > 0 && (
                        <Paper sx={{ mt: 1.5, p: 1.5, bgcolor: feeDue ? 'warning.50' : 'grey.50', border: '1px solid', borderColor: feeDue ? 'warning.200' : 'divider' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Annual Fee: ৳{card.annualFee}/year
                              </Typography>
                              {feeDue ? (
                                <Typography variant="caption" color="warning.main" display="block" fontWeight={700}>Fee due now</Typography>
                              ) : daysUntilDue > 0 ? (
                                <Typography variant="caption" color="text.secondary" display="block">Due in {daysUntilDue} days</Typography>
                              ) : (
                                <Typography variant="caption" color="success.main" display="block">
                                  {card.feeStatus === 'waived' ? 'Waived' : 'Paid'}
                                </Typography>
                              )}
                            </Box>
                            {feeDue && (
                              <Button size="small" variant="contained" color="warning" onClick={(e) => { e.stopPropagation(); handlePayAnnualFee(card.id); }}>
                                Pay Now
                              </Button>
                            )}
                          </Stack>
                        </Paper>
                      )}

                      {recentTxns.length > 0 && (
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                            Recent Card Transactions
                          </Typography>
                          {recentTxns.map(r => (
                            <Stack key={r.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
                              <Box>
                                <Typography variant="caption" fontWeight={600}>{r.merchant}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                  {new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · {r.txnType.replace(/_/g, ' ')}
                                </Typography>
                              </Box>
                              <Box textAlign="right">
                                <Typography variant="caption" fontWeight={700} color={r.status === 'success' ? 'success.main' : 'error.main'}>
                                  {r.status === 'success' ? '-' : ''}৳{r.totalDeducted.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" color={r.status === 'success' ? 'success.main' : r.status === 'failed' ? 'error.main' : 'text.secondary'} sx={{ display: 'block', fontSize: '0.65rem', textTransform: 'capitalize' }}>
                                  {r.status}
                                </Typography>
                              </Box>
                            </Stack>
                          ))}
                        </Box>
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            {frozenCards.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="text.secondary" mb={2}>Frozen / Blocked Cards</Typography>
                <Grid container spacing={3}>
                  {frozenCards.map(card => (
                    <Grid key={card.id} size={{ xs: 12, md: 6 }}>
                      <Box sx={{ cursor: 'pointer', maxWidth: 340 }} onClick={() => setSelectedCard(card)}>
                        <CardVisual card={card} showCvv />
                      </Box>
                      <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap" useFlexGap>
                        <CardStatusBadge status={card.status} />
                        <Chip size="small" label={card.network.toUpperCase()} />
                        <Chip size="small" label={card.type === 'credit' ? 'Credit' : 'Debit'} variant="outlined" />
                      </Stack>
                      {card.status === 'frozen' && (
                        <Button
                          size="small" variant="outlined" color="success"
                          startIcon={<LockOpenIcon />}
                          sx={{ mt: 1 }}
                          onClick={(e) => { e.stopPropagation(); handleFreezeToggle(card); }}
                        >
                          Unfreeze
                        </Button>
                      )}
                      {card.status === 'blocked' && (
                        <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                          This card is blocked. Contact admin to reactivate.
                        </Typography>
                      )}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {cards.filter(c => c.status === 'pending').length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="text.secondary" mb={2}>Pending Approval</Typography>
                <Grid container spacing={3}>
                  {cards.filter(c => c.status === 'pending').map(card => (
                    <Grid key={card.id} size={{ xs: 12, md: 6 }}>
                      <Box sx={{ maxWidth: 340 }}>
                        <CardVisual card={card} showCvv />
                      </Box>
                      <Stack direction="row" mt={1.5}>
                        <CardStatusBadge status="pending" />
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Stack>
        )}

        {cards.length > 0 && (
          <Card sx={{ mt: 4, p: 2.5, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200', boxShadow: 'none' }}>
            <Typography variant="subtitle2" fontWeight={700} color="success.dark" mb={1}>Card Security Tips</Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Grid container spacing={1}>
              {[
                'Never share your CVV or card number with anyone.',
                'Freeze your card instantly if you suspect fraud.',
                'Monitor transactions regularly for unauthorized use.',
                'Report lost/stolen cards immediately to your branch.',
              ].map((tip, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="success.dark">• {tip}</Typography>
                </Grid>
              ))}
            </Grid>
          </Card>
        )}
      </Box>

      <CardApplicationForm
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSubmit={handleApplyForCard}
        existingCards={cards}
      />

      <CardDetailsModal
        open={selectedCard !== null && !replacementOpen}
        onClose={() => setSelectedCard(null)}
        card={selectedCard}
        showActions={false}
        onRequestReplacement={() => setReplacementOpen(true)}
      />

      <NewCardTransactionDialog
        open={txnDialogCard !== null}
        card={txnDialogCard}
        onClose={() => setTxnDialogCard(null)}
        onCompleted={refresh}
      />

      <Dialog open={historyCard !== null} onClose={() => { setHistoryCard(null); setSearchQuery(''); setStatusFilter('all'); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>
          Transaction History — {historyCard && `**** ${historyCard.number.slice(-4)}`}
        </DialogTitle>
        <DialogContent>
          {historyCard && (
            <Box>
              <Stack direction="row" spacing={2} mb={2} flexWrap="wrap" useFlexGap>
                <TextField
                  size="small" placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  sx={{ flexGrow: 1, minWidth: 200 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort</InputLabel>
                  <Select value={sortOrder} label="Sort" onChange={e => setSortOrder(e.target.value)}>
                    <MenuItem value="newest">Newest First</MenuItem>
                    <MenuItem value="oldest">Oldest First</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  size="small" variant="outlined" startIcon={<DownloadIcon />}
                  onClick={handleDownloadStatement}
                  disabled={historyRecords.length === 0}
                >
                  Download
                </Button>
              </Stack>

              <Card variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Channel</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Merchant</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Amount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Fee</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Reference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyRecords.length === 0 ? (
                      <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No transactions found</Typography></TableCell></TableRow>
                    ) : historyRecords.map(r => (
                      <TableRow key={r.id} hover>
                        <TableCell><Typography variant="caption">{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</Typography></TableCell>
                        <TableCell><Typography variant="caption" fontWeight={600}>{r.txnType.replace(/_/g, ' ')}</Typography></TableCell>
                        <TableCell><Chip label={r.channel} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                        <TableCell><Typography variant="caption">{r.merchant}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="caption" fontWeight={600}>৳{r.amount.toLocaleString()}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="caption" color="text.secondary">{r.fee > 0 ? `৳${r.fee}` : '—'}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="caption" fontWeight={700}>৳{r.totalDeducted.toLocaleString()}</Typography></TableCell>
                        <TableCell>
                          <Chip label={r.status} size="small"
                            color={r.status === 'success' ? 'success' : r.status === 'failed' ? 'error' : 'default'}
                            sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell><Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>{r.referenceId}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {historyRecords.length} transaction{historyRecords.length !== 1 ? 's' : ''} found
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => { setHistoryCard(null); setSearchQuery(''); setStatusFilter('all'); }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={replacementOpen} onClose={() => { setReplacementOpen(false); setReplacementReason('lost'); }} maxWidth="xs" fullWidth>
        <DialogTitle>Request Card Replacement</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Request a replacement for your {selectedCard?.network} {selectedCard?.type} card.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Reason for Replacement</InputLabel>
            <Select value={replacementReason} label="Reason for Replacement" onChange={e => setReplacementReason(e.target.value as CardReplacement['reason'])}>
              <MenuItem value="lost"><ReportProblemIcon sx={{ mr: 1, color: 'error.main' }} />Lost</MenuItem>
              <MenuItem value="stolen"><ReportProblemIcon sx={{ mr: 1, color: 'error.main' }} />Stolen</MenuItem>
              <MenuItem value="damaged"><ReportProblemIcon sx={{ mr: 1, color: 'warning.main' }} />Damaged</MenuItem>
              <MenuItem value="expired"><ReportProblemIcon sx={{ mr: 1, color: 'info.main' }} />Expired</MenuItem>
            </Select>
          </FormControl>
          {replacementReason === 'stolen' && (
            <Alert severity="error" sx={{ mt: 2 }}>Your card will be blocked immediately. A new card will be issued upon approval.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => { setReplacementOpen(false); setReplacementReason('lost'); }}>Cancel</Button>
          <Button variant="contained" color="warning" startIcon={<SwapHorizIcon />} onClick={handleRequestReplacement}>Request Replacement</Button>
        </DialogActions>
      </Dialog>
    </CustomerLayout>
  );
}
