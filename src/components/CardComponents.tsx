// Reusable Card UI Components

import { useState } from 'react';
import {
  Box, Typography, Stack, Chip, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Grid, Table, TableBody, TableCell,
  TableHead, TableRow, TableContainer, MenuItem, FormControl, InputLabel, Select,
  ToggleButtonGroup, ToggleButton, Alert,
} from '@mui/material';
import { Eye, EyeOff, Copy, Check, Wifi, Snowflake, Lock } from 'lucide-react';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import type { BankCard, CardTransaction } from '../utils/mockCardsData';
import { formatMaskedNumber, formatFullNumber, getCardStatusColor, getCardTransactions, isAnnualFeeDue } from '../utils/mockCardsData';

// ============ Status Badge ============
interface StatusBadgeProps {
  status: BankCard['status'];
  size?: 'small' | 'medium';
}

export function CardStatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  const getIcon = () => {
    switch (status) {
      case 'active': return <CheckCircleIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
      case 'pending': return <HourglassEmptyIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
      case 'frozen': case 'blocked': return <BlockIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
      case 'expired': return <WarningIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
      default: return <ErrorIcon fontSize={size === 'small' ? 'small' : 'medium'} />;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'frozen': return 'Frozen';
      case 'blocked': return 'Blocked';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  return (
    <Chip
      icon={getIcon()}
      label={getLabel()}
      color={getCardStatusColor(status)}
      size={size}
      variant="outlined"
    />
  );
}

// ============ Card Visual Preview ============
interface CardVisualProps {
  card: BankCard;
  showDetails?: boolean;
  compact?: boolean;
  onClick?: () => void;
  showCvv?: boolean;
}

export function CardVisual({ card, showDetails = false, compact = false, onClick, showCvv = false }: CardVisualProps) {
  const [revealed, setRevealed] = useState(showDetails);
  const [copied, setCopied] = useState(false);

  const isFrozen = card.status === 'frozen' || card.status === 'blocked';
  const isPending = card.status === 'pending';
  const isExpired = card.status === 'expired';

  const gradient = isFrozen
    ? 'linear-gradient(135deg, #475569 0%, #334155 50%, #1E293B 100%)'
    : isExpired
      ? 'linear-gradient(135deg, #78350F 0%, #451A03 100%)'
      : card.network === 'visa'
        ? 'linear-gradient(135deg, #0F4C81 0%, #1B6CA8 40%, #072842 100%)'
        : 'linear-gradient(135deg, #7F1D1D 0%, #B91C1C 40%, #450A0A 100%)';

  const width = compact ? 260 : '100%';
  const aspectRatio = '1.586 / 1';
  const minHeight = compact ? 164 : 180;

  const copyNumber = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(card.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        width,
        aspectRatio,
        minHeight,
        borderRadius: compact ? '14px' : '18px',
        overflow: 'hidden',
        background: gradient,
        boxShadow: isFrozen
          ? '0 8px 24px rgba(71,85,105,0.30)'
          : '0 10px 30px rgba(0,0,0,0.25)',
        color: 'white',
        p: compact ? 1.5 : 2.5,
        cursor: onClick ? 'pointer' : 'default',

        '&::before': {
          content: '""',
          position: 'absolute',
          top: -80,
          right: -80,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -100,
          left: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        },
      }}
    >
      {/* Glassmorphism overlay */}
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.06) 100%)',
        backdropFilter: 'blur(2px)',
        pointerEvents: 'none',
        borderRadius: compact ? '16px' : '20px',
      }} />

      {/* Status badge */}
      {(isPending || isFrozen || isExpired) && (
        <Chip
          label={card.status.charAt(0).toUpperCase() + card.status.slice(1)}
          size="small"
          sx={{
            position: 'absolute', top: 12, right: 12, zIndex: 2,
            bgcolor: isFrozen ? 'rgba(59,130,246,0.25)' : isExpired ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.15)',
            color: 'white', fontSize: '0.6rem', height: 20, fontWeight: 700,
            backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)',
          }}
        />
      )}

      <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top row */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>
              Smart Bank
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.6rem', display: 'block', textTransform: 'capitalize' }}>
              {card.type} · {card.network}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Contactless icon */}
            <Wifi size={18} style={{ transform: 'rotate(90deg)', opacity: 0.7 }} />
            {/* Realistic chip */}
            <Box sx={{
              width: 42, height: 32,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #F5D061 0%, #D4A017 50%, #B8860B 100%)',
              position: 'relative',
              border: '1px solid rgba(255,215,0,0.3)',
              '&::before': {
                content: '""', position: 'absolute', inset: 4,
                borderRadius: 1,
                border: '1.5px solid rgba(0,0,0,0.15)',
              },
              '&::after': {
                content: '""', position: 'absolute', left: '50%', top: 4, bottom: 4,
                width: 2, bgcolor: 'rgba(0,0,0,0.12)', transform: 'translateX(-50%)',
              },
            }} />
          </Stack>
        </Stack>

        {/* Card number */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ my: compact ? 1 : 1.5 }}>
          <Typography
            variant={compact ? 'body2' : 'h6'}
            fontFamily="'Courier New', monospace"
            fontWeight={700}
            letterSpacing={2.5}
            sx={{ fontSize: compact ? '0.85rem' : '1.1rem' }}
          >
            {revealed ? formatFullNumber(card.number) : formatMaskedNumber(card.number)}
          </Typography>
          {!compact && (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title={revealed ? 'Hide number' : 'Show number'}>
                <IconButton
                  size="small"
                  onClick={e => { e.stopPropagation(); setRevealed(r => !r); }}
                  sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }, p: 0.5 }}
                >
                  {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              </Tooltip>
              <Tooltip title={copied ? 'Copied!' : 'Copy number'}>
                <IconButton
                  size="small"
                  onClick={copyNumber}
                  sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }, p: 0.5 }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>

        {/* Bottom row: Cardholder name (left), Expiry + Network (right) */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Card Holder</Typography>
            <Typography variant={compact ? 'caption' : 'body2'} fontWeight={700} sx={{ color: '#fff', textTransform: 'uppercase', fontSize: compact ? '0.65rem' : '0.8rem', lineHeight: 1.2, wordBreak: 'break-word', maxWidth: 160 }}>
              {card.holderName}
            </Typography>
          </Box>
          <Stack direction="row" spacing={compact ? 1.5 : 2} alignItems="center">
            {!compact && showCvv && (
              <Box textAlign="center">
                <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.5rem', textTransform: 'uppercase' }}>CVV</Typography>
                <Typography variant="body2" fontWeight={700} fontFamily="monospace" sx={{ fontSize: '0.75rem', letterSpacing: 2 }}>
                  {revealed ? (card.cvv ?? '•••') : '•••'}
                </Typography>
              </Box>
            )}
            <Box textAlign="right">
              <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.55rem', textTransform: 'uppercase' }}>Expires</Typography>
              <Typography variant={compact ? 'caption' : 'body2'} fontWeight={600} fontFamily="monospace" sx={{ fontSize: compact ? '0.65rem' : '0.75rem' }}>{card.expiry}</Typography>
            </Box>
            {card.network === 'visa' ? (
              <Typography sx={{
                fontWeight: 900, fontSize: compact ? '1.1rem' : '1.4rem',
                fontStyle: 'italic', letterSpacing: -1.5,
                color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}>VISA</Typography>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: '#EB001B', opacity: 0.9 }} />
                <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: '#F79E1B', opacity: 0.9, ml: -1.5 }} />
              </Box>
            )}
          </Stack>
        </Stack>

        {/* Frozen overlay */}
        {isFrozen && (
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            bgcolor: 'rgba(59,130,246,0.20)', backdropFilter: 'blur(4px)',
            borderRadius: 3, px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1,
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <Snowflake size={16} color="white" />
            <Typography variant="caption" fontWeight={700} color="white">
              {card.status === 'blocked' ? 'BLOCKED' : 'FROZEN'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ============ Card Details Modal ============
interface CardDetailsModalProps {
  open: boolean;
  onClose: () => void;
  card: BankCard | null;
  onToggleStatus?: () => void;
  onRequestReplacement?: () => void;
  showActions?: boolean;
  transactionsOnly?: boolean;
}

export function CardDetailsModal({ open, onClose, card, onToggleStatus, onRequestReplacement, showActions = true, transactionsOnly = false }: CardDetailsModalProps) {
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [tab, setTab] = useState<'details' | 'transactions'>(transactionsOnly ? 'transactions' : 'details');

  if (!card) return null;

  const transactions = getCardTransactions(card.id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>{card.type === 'credit' ? 'Credit' : 'Debit'} Card Details</Typography>
          <CardStatusBadge status={card.status} />
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box sx={{ maxWidth: 340, width: '100%' }}>
            <CardVisual card={card} showDetails={showCardDetails} />
          </Box>
        </Box>

        {!transactionsOnly && (
        <ToggleButtonGroup
          value={tab}
          exclusive
          onChange={(_, v) => v && setTab(v)}
          size="small"
          sx={{ mb: 2 }}
        >
          <Button value="details">Card Info</Button>
          <Button value="transactions">Transactions ({transactions.length})</Button>
        </ToggleButtonGroup>
        )}

        {tab === 'details' && !transactionsOnly ? (
          <Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={showCardDetails ? <EyeOff size={16} /> : <Eye size={16} />}
              onClick={() => setShowCardDetails(s => !s)}
              sx={{ mb: 2 }}
            >
              {showCardDetails ? 'Hide Card Details' : 'Show Full Card Details'}
            </Button>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Card Number</Typography>
                  <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                    {showCardDetails ? formatFullNumber(card.number) : formatMaskedNumber(card.number)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Network</Typography>
                  <Typography variant="body2" fontWeight={600}>{card.network.toUpperCase()}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2" fontWeight={600}>{card.type === 'credit' ? 'Credit Card' : 'Debit Card'}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Expiry Date</Typography>
                  <Typography variant="body2" fontWeight={600} fontFamily="monospace">{card.expiry}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">CVV</Typography>
                  <Typography variant="body2" fontWeight={700} fontFamily="monospace" letterSpacing={2}>
                    {showCardDetails ? (card.cvv ?? '•••') : '•••'}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Issued</Typography>
                  <Typography variant="body2" fontWeight={600}>{new Date(card.createdAt).toLocaleDateString()}</Typography>
                </Box>
              </Grid>
              {card.type === 'credit' && card.creditLimit && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Credit Limit</Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.dark">৳{card.creditLimit.toLocaleString()}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Current Balance</Typography>
                      <Typography variant="body2" fontWeight={700} color="warning.dark">৳{(card.currentBalance ?? 0).toLocaleString()}</Typography>
                    </Box>
                  </Grid>
                </>
              )}
              {/* Annual Fee for Debit Cards */}
              {card.type === 'debit' && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: isAnnualFeeDue(card) ? 'warning.50' : 'grey.50', borderRadius: 2, border: isAnnualFeeDue(card) ? '1px solid' : 'none', borderColor: 'warning.200' }}>
                      <Typography variant="caption" color="text.secondary">Annual Fee</Typography>
                      <Typography variant="body2" fontWeight={700} color={isAnnualFeeDue(card) ? 'warning.dark' : 'text.primary'}>৳{card.annualFee ?? 300}/year</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: isAnnualFeeDue(card) ? 'error.50' : 'success.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Fee Status</Typography>
                      {isAnnualFeeDue(card) ? (
                        <Typography variant="body2" fontWeight={700} color="error.dark">Fee Due Now</Typography>
                      ) : card.feeStatus === 'waived' ? (
                        <Typography variant="body2" fontWeight={700} color="info.dark">Waived</Typography>
                      ) : (
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="success.dark">Paid</Typography>
                          {card.lastFeeChargedAt && (
                            <Typography variant="caption" color="text.secondary">
                              Last: {new Date(card.lastFeeChargedAt).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        ) : (
          <CardTransactionTable transactions={transactions} />
        )}
      </DialogContent>
      {showActions && (
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          {onRequestReplacement && card.status === 'active' && (
            <Button variant="outlined" color="warning" startIcon={<CreditCardIcon />} onClick={onRequestReplacement}>
              Request Replacement
            </Button>
          )}
          {onToggleStatus && card.status !== 'pending' && card.status !== 'expired' && (
            <Button
              variant="contained"
              color={card.status === 'frozen' ? 'success' : 'error'}
              startIcon={card.status === 'frozen' ? <Lock size={16} /> : <BlockIcon />}
              onClick={onToggleStatus}
            >
              {card.status === 'frozen' ? 'Unfreeze Card' : 'Freeze Card'}
            </Button>
          )}
          <Button variant="outlined" onClick={onClose}>Close</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

// ============ Card Transaction Table ============
interface CardTransactionTableProps {
  transactions: CardTransaction[];
  compact?: boolean;
}

export function CardTransactionTable({ transactions, compact = false }: CardTransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">No transactions yet</Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Date</TableCell>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Merchant</TableCell>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Type</TableCell>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="right">Amount</TableCell>
          {!compact && <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {transactions.map(txn => (
          <TableRow key={txn.id} hover>
            <TableCell>
              <Typography variant={compact ? 'caption' : 'body2'}>{new Date(txn.date).toLocaleDateString()}</Typography>
            </TableCell>
            <TableCell>
              <Box>
                <Typography variant={compact ? 'caption' : 'body2'} fontWeight={600}>{txn.merchant}</Typography>
                <Typography variant="caption" color="text.secondary">{txn.category}</Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Chip label={txn.type} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
            </TableCell>
            <TableCell align="right">
              <Typography
                variant={compact ? 'caption' : 'body2'}
                fontWeight={700}
                color={txn.type === 'refund' || txn.type === 'payment' ? 'success.main' : 'text.primary'}
              >
                {txn.type === 'refund' || txn.type === 'payment' ? '+' : ''}{txn.amount.toLocaleString()}
              </Typography>
            </TableCell>
            {!compact && (
              <TableCell>
                <Chip label={txn.status} size="small" color={txn.status === 'completed' ? 'success' : txn.status === 'pending' ? 'warning' : 'error'} sx={{ fontSize: '0.6rem', height: 18 }} />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </TableContainer>
  );
}

// ============ Card Application Form ============
interface CardApplicationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { cardType: 'debit' | 'credit'; network: 'visa' | 'mastercard'; creditLimit?: number }) => void;
  existingCards?: BankCard[];
}

export function CardApplicationForm({ open, onClose, onSubmit, existingCards = [] }: CardApplicationFormProps) {
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
  const [network, setNetwork] = useState<'visa' | 'mastercard'>('visa');
  const [creditLimit, setCreditLimit] = useState('25000');
  const [error, setError] = useState('');

  const hasDebitCard = existingCards.some(c => c.type === 'debit' && c.status !== 'blocked');

  const handleSubmit = () => {
    if (cardType === 'debit' && hasDebitCard) {
      setError('You already have an active debit card.');
      return;
    }
    if (cardType === 'credit' && (!creditLimit || parseInt(creditLimit) < 5000)) {
      setError('Credit limit must be at least 5,000 BDT.');
      return;
    }
    setError('');
    onSubmit({
      cardType,
      network,
      creditLimit: cardType === 'credit' ? parseInt(creditLimit) : undefined,
    });
    onClose();
    setCardType('debit');
    setNetwork('visa');
    setCreditLimit('25000');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Apply for Card</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="body2" color="text.secondary" mb={2}>
          Choose your card type and network. Authority approval required.
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Card Type</InputLabel>
          <Select value={cardType} label="Card Type" onChange={e => setCardType(e.target.value as 'debit' | 'credit')}>
            <MenuItem value="debit" disabled={hasDebitCard}>
              Debit Card {hasDebitCard && '(Already Issued)'}
            </MenuItem>
            <MenuItem value="credit">Credit Card</MenuItem>
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={network}
          exclusive
          onChange={(_, v) => v && setNetwork(v)}
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton value="visa" sx={{ py: 1.5 }}>
            <Stack alignItems="center" spacing={0.5}>
              <Typography fontWeight={900} fontSize="1.1rem" fontStyle="italic">VISA</Typography>
              <Typography variant="caption">Visa {cardType === 'credit' ? 'Credit' : 'Debit'}</Typography>
            </Stack>
          </ToggleButton>
          <ToggleButton value="mastercard" sx={{ py: 1.5 }}>
            <Stack alignItems="center" spacing={0.5}>
              <Stack direction="row">
                <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: '#eb001b' }} />
                <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: '#f79e1b', ml: -1 }} />
              </Stack>
              <Typography variant="caption">MasterCard {cardType === 'credit' ? 'Credit' : 'Debit'}</Typography>
            </Stack>
          </ToggleButton>
        </ToggleButtonGroup>

        {cardType === 'credit' && (
          <FormControl fullWidth>
            <InputLabel>Requested Credit Limit</InputLabel>
            <Select
              value={creditLimit}
              label="Requested Credit Limit"
              onChange={e => setCreditLimit(e.target.value)}
            >
              <MenuItem value="5000">৳5,000</MenuItem>
              <MenuItem value="10000">৳10,000</MenuItem>
              <MenuItem value="25000">৳25,000</MenuItem>
              <MenuItem value="50000">৳50,000</MenuItem>
              <MenuItem value="100000">৳100,000</MenuItem>
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>Submit Application</Button>
      </DialogActions>
    </Dialog>
  );
}
