import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography,
  Box, Divider, Alert, CircularProgress, Chip, useTheme,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ShieldCheck, CreditCard as CreditCardIcon } from 'lucide-react';
import { type BankCard, formatMaskedNumber } from '../utils/mockCardsData';
import {
  type CardTxnType, type CardTransactionResult,
  processCardTransaction, cancelCardTransaction, TXN_LABELS, TXN_FEES, TXN_CHANNELS,
} from '../utils/cardTransactionService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface CardTransactionModalProps {
  open: boolean;
  card: BankCard | null;
  txnType: CardTxnType | null;
  amount: number;
  merchant: string;
  category: string;
  description?: string;
  pin?: string;
  cvv?: string;
  recipientAccount?: string;
  onClose: () => void;
  onCompleted: () => void;
}

type Phase = 'confirm' | 'processing' | 'result';

export default function CardTransactionModal({
  open, card, txnType, amount, merchant, category, description, pin, cvv, recipientAccount, onClose, onCompleted,
}: CardTransactionModalProps) {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const theme = useTheme();
  const [phase, setPhase] = useState<Phase>('confirm');
  const [result, setResult] = useState<CardTransactionResult | null>(null);

  if (!card || !txnType) return null;

  const fee = TXN_FEES[txnType];
  const total = amount + fee;
  const channel = TXN_CHANNELS[txnType];

  const handleConfirm = () => {
    setPhase('processing');
    setTimeout(() => {
      const res = processCardTransaction({
        cardId: card.id,
        type: txnType,
        amount,
        merchant,
        category,
        description,
        channel,
        pin,
        cvv,
        recipientAccount,
      });
      setResult(res);
      setPhase('result');
      if (res.success) {
        toast.showSuccess(res.message);
        refreshUser();
      } else if (res.status === 'failed') {
        toast.showError(res.message);
      }
    }, 1200);
  };

  const handleCancel = () => {
    if (phase === 'confirm') {
      cancelCardTransaction({
        cardId: card.id, type: txnType, amount, merchant, category, description, channel,
      });
      toast.showInfo('Transaction cancelled.');
    }
    handleClose();
  };

  const handleClose = () => {
    setPhase('confirm');
    setResult(null);
    onClose();
    if (result?.success) onCompleted();
  };

  const maskedNumber = formatMaskedNumber(card.number);

  return (
    <Dialog open={open} onClose={phase === 'processing' ? undefined : handleClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShieldCheck size={20} color={theme.palette.primary.main} />
        Transaction Confirmation
      </DialogTitle>
      <DialogContent>
        <AnimatePresence mode="wait">
          {phase === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="caption">Please review the transaction details below before proceeding.</Typography>
              </Alert>

              <Box sx={{ bgcolor: 'rgba(15,76,129,0.04)', borderRadius: 3, p: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Card Holder</Typography>
                    <Typography variant="body2" fontWeight={600}>{card.holderName}</Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Card Number</Typography>
                    <Typography variant="body2" fontWeight={600} fontFamily="monospace">{maskedNumber}</Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Transaction Type</Typography>
                    <Chip label={TXN_LABELS[txnType]} size="small" color="primary" variant="outlined" />
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Channel</Typography>
                    <Typography variant="body2" fontWeight={600}>{channel}</Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Merchant</Typography>
                    <Typography variant="body2" fontWeight={600}>{merchant}</Typography>
                  </Stack>

                  {recipientAccount && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Recipient</Typography>
                      <Typography variant="body2" fontWeight={600} fontFamily="monospace">{recipientAccount}</Typography>
                    </Stack>
                  )}

                  <Divider />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Transaction Amount</Typography>
                    <Typography variant="body2" fontWeight={600}>৳{amount.toLocaleString()}</Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Service Charge</Typography>
                    <Typography variant="body2" fontWeight={600}>{fee > 0 ? `৳${fee.toLocaleString()}` : 'Free'}</Typography>
                  </Stack>

                  <Divider />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" fontWeight={700}>Total to Deduct</Typography>
                    <Typography variant="subtitle2" fontWeight={700} color="primary.main">৳{total.toLocaleString()}</Typography>
                  </Stack>
                </Stack>
              </Box>

              <Stack direction="row" spacing={1} mt={2} alignItems="center">
                <CreditCardIcon size={14} color={theme.palette.text.secondary} />
                <Typography variant="caption" color="text.secondary">
                  Linked account: {card.accountNumber} · {card.type === 'credit' ? 'Credit Card' : 'Debit Card'}
                </Typography>
              </Stack>
            </motion.div>
          )}

          {phase === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Box textAlign="center" py={5}>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="body1" fontWeight={600}>Processing transaction...</Typography>
                <Typography variant="caption" color="text.secondary">
                  Verifying card status, PIN, balance & limits
                </Typography>
              </Box>
            </motion.div>
          )}

          {phase === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Box textAlign="center" py={2}>
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  {result.success ? (
                    <CheckCircle2 size={56} color={theme.palette.success.main} style={{ marginBottom: 12 }} />
                  ) : (
                    <XCircle size={56} color={result.status === 'cancelled' ? theme.palette.text.secondary : theme.palette.error.main} style={{ marginBottom: 12 }} />
                  )}
                </motion.div>

                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {result.success ? 'Transaction Successful!' : result.status === 'cancelled' ? 'Transaction Cancelled' : 'Transaction Failed'}
                </Typography>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {result.message}
                </Typography>

                {result.success && (
                  <Box sx={{ bgcolor: 'rgba(15,76,129,0.04)', borderRadius: 3, p: 2, border: '1px solid', borderColor: 'divider', textAlign: 'left' }}>
                    <Stack spacing={0.75}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
                        <Typography variant="caption" fontWeight={700} fontFamily="monospace">{result.transactionId}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Reference No.</Typography>
                        <Typography variant="caption" fontWeight={600} fontFamily="monospace">{result.referenceId}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Amount</Typography>
                        <Typography variant="caption" fontWeight={600}>৳{result.deductedAmount?.toLocaleString()}</Typography>
                      </Stack>
                      {(result.fee ?? 0) > 0 && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">Service Charge</Typography>
                          <Typography variant="caption" fontWeight={600}>৳{result.fee?.toLocaleString()}</Typography>
                        </Stack>
                      )}
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Total Deducted</Typography>
                        <Typography variant="caption" fontWeight={600}>৳{((result.deductedAmount ?? 0) + (result.fee ?? 0)).toLocaleString()}</Typography>
                      </Stack>
                      {result.previousBalance !== undefined && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">Previous Balance</Typography>
                          <Typography variant="caption" fontWeight={600}>৳{result.previousBalance.toLocaleString()}</Typography>
                        </Stack>
                      )}
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">{card.type === 'credit' ? 'Card Balance' : 'Remaining Balance'}</Typography>
                        <Typography variant="caption" fontWeight={700} color="success.main">৳{result.remainingBalance?.toLocaleString()}</Typography>
                      </Stack>
                    </Stack>
                  </Box>
                )}

                {result.success && (
                  <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }} icon={<CheckCircle2 size={18} />}>
                    <Typography variant="caption">Balance updated instantly. Transaction saved to history.</Typography>
                  </Alert>
                )}

                {result.failureReason && !result.success && result.status === 'failed' && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                    <Typography variant="caption" fontWeight={600}>{result.failureReason}</Typography>
                  </Alert>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {phase === 'confirm' && (
          <>
            <Button variant="outlined" fullWidth onClick={handleCancel}>Cancel</Button>
            <Button variant="contained" color="success" fullWidth onClick={handleConfirm}>Confirm</Button>
          </>
        )}
        {phase === 'result' && (
          <Button variant="contained" fullWidth onClick={handleClose}>Done</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
