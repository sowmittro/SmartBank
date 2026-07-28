import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography,
  Box, Grid, TextField, InputAdornment, Alert, Chip, IconButton,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Globe, Banknote, QrCode, Smartphone,
  Building2, CreditCard, Zap, Wifi, Repeat, Plane, ArrowLeft, Lock,
} from 'lucide-react';
import { type BankCard, formatMaskedNumber } from '../utils/mockCardsData';
import { type CardTxnType, TXN_LABELS, TXN_FEES, TXN_CHANNELS } from '../utils/cardTransactionService';
import CardTransactionModal from './CardTransactionModal';

interface NewCardTransactionDialogProps {
  open: boolean;
  card: BankCard | null;
  onClose: () => void;
  onCompleted: () => void;
}

interface TxnTypeConfig {
  id: CardTxnType;
  label: string;
  icon: React.ReactNode;
  color: string;
  merchantPlaceholder: string;
  defaultMerchant: string;
}

const TXN_TYPES: TxnTypeConfig[] = [
  { id: 'atm_withdrawal', label: 'ATM Withdrawal', icon: <Banknote size={22} />, color: '#FFB300', merchantPlaceholder: 'ATM Location', defaultMerchant: 'ATM Booth' },
  { id: 'atm_deposit', label: 'ATM Deposit', icon: <Banknote size={22} />, color: '#00C853', merchantPlaceholder: 'ATM Location', defaultMerchant: 'ATM Booth' },
  { id: 'pos_purchase', label: 'POS Purchase', icon: <ShoppingBag size={22} />, color: '#2563EB', merchantPlaceholder: 'e.g. Agora Supermarket', defaultMerchant: 'POS Terminal' },
  { id: 'contactless_payment', label: 'Contactless / NFC', icon: <Wifi size={22} />, color: '#7C3AED', merchantPlaceholder: 'e.g. Coffee Shop', defaultMerchant: 'Contactless Terminal' },
  { id: 'online_payment', label: 'Online Payment', icon: <Globe size={22} />, color: '#7C3AED', merchantPlaceholder: 'e.g. Daraz BD', defaultMerchant: 'Online Store' },
  { id: 'qr_payment', label: 'QR Code Payment', icon: <QrCode size={22} />, color: '#00897B', merchantPlaceholder: 'e.g. Merchant QR', defaultMerchant: 'QR Merchant' },
  { id: 'merchant_payment', label: 'Merchant Payment', icon: <Building2 size={22} />, color: '#5C6BC0', merchantPlaceholder: 'e.g. Restaurant', defaultMerchant: 'Merchant' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: <Building2 size={22} />, color: '#0F4C81', merchantPlaceholder: 'Recipient Account No.', defaultMerchant: 'Bank Transfer' },
  { id: 'card_to_card_transfer', label: 'Card-to-Card', icon: <CreditCard size={22} />, color: '#D81B60', merchantPlaceholder: 'Recipient Card Number', defaultMerchant: 'Card Transfer' },
  { id: 'utility_bill', label: 'Utility Bill', icon: <Zap size={22} />, color: '#F59E0B', merchantPlaceholder: 'e.g. DESCO Electricity', defaultMerchant: 'Utility Bill' },
  { id: 'mobile_recharge', label: 'Mobile Recharge', icon: <Smartphone size={22} />, color: '#00C853', merchantPlaceholder: 'e.g. Grameenphone', defaultMerchant: 'Mobile Recharge' },
  { id: 'subscription', label: 'Subscription', icon: <Repeat size={22} />, color: '#8E24AA', merchantPlaceholder: 'e.g. Netflix', defaultMerchant: 'Subscription' },
  { id: 'international_payment', label: 'International', icon: <Plane size={22} />, color: '#455A64', merchantPlaceholder: 'e.g. Amazon US', defaultMerchant: 'International Merchant' },
];

const PIN_REQUIRED_TYPES: CardTxnType[] = [
  'atm_withdrawal', 'atm_deposit', 'pos_purchase', 'bank_transfer', 'card_to_card_transfer',
];
const CVV_REQUIRED_TYPES: CardTxnType[] = ['online_payment', 'subscription', 'international_payment'];
const RECIPIENT_REQUIRED_TYPES: CardTxnType[] = ['bank_transfer', 'card_to_card_transfer'];

export default function NewCardTransactionDialog({ open, card, onClose, onCompleted }: NewCardTransactionDialogProps) {
  const [step, setStep] = useState<'type' | 'details' | 'security' | 'confirm'>('type');
  const [txnType, setTxnType] = useState<CardTxnType | null>(null);
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [pin, setPin] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');

  if (!card) return null;

  const reset = () => {
    setStep('type'); setTxnType(null); setAmount(''); setMerchant('');
    setDescription(''); setRecipientAccount(''); setPin(''); setCvv(''); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleTypeSelect = (type: CardTxnType) => {
    const config = TXN_TYPES.find(t => t.id === type)!;
    setTxnType(type);
    setMerchant(config.defaultMerchant);
    setStep('details');
  };

  const handleDetailsNext = () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setError('Enter a valid amount'); return; }
    if (amt < 10) { setError('Minimum transaction amount is ৳10'); return; }
    if (!merchant.trim()) { setError('Enter a merchant or description'); return; }
    if (RECIPIENT_REQUIRED_TYPES.includes(txnType!) && !recipientAccount.trim()) {
      setError('Enter the recipient account/card number'); return;
    }
    setError('');
    const needsPin = PIN_REQUIRED_TYPES.includes(txnType!);
    const needsCvv = CVV_REQUIRED_TYPES.includes(txnType!);
    if (needsPin || needsCvv) setStep('security');
    else setStep('confirm');
  };

  const handleSecurityNext = () => {
    if (PIN_REQUIRED_TYPES.includes(txnType!) && pin.length !== 4) { setError('Enter a 4-digit PIN'); return; }
    if (CVV_REQUIRED_TYPES.includes(txnType!) && cvv.length !== 3) { setError('Enter a 3-digit CVV'); return; }
    setError('');
    setStep('confirm');
  };

  const needsPin = txnType ? PIN_REQUIRED_TYPES.includes(txnType) : false;
  const needsCvv = txnType ? CVV_REQUIRED_TYPES.includes(txnType) : false;
  const fee = txnType ? TXN_FEES[txnType] : 0;
  const total = (parseFloat(amount) || 0) + fee;

  return (
    <>
      <Dialog open={open && step !== 'confirm'} onClose={handleClose} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', display: 'flex', alignItems: 'center', gap: 1 }}>
          {step !== 'type' && (
            <IconButton size="small" onClick={() => setStep(step === 'security' ? 'details' : 'type')} sx={{ mr: 1 }}>
              <ArrowLeft size={18} />
            </IconButton>
          )}
          New Card Transaction
        </DialogTitle>
        <DialogContent>
          <Box sx={{ bgcolor: 'rgba(15,76,129,0.04)', borderRadius: 2, p: 1.5, mb: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary">Using Card</Typography>
                <Typography variant="body2" fontWeight={600} fontFamily="monospace">{formatMaskedNumber(card.number)}</Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary">Linked Account</Typography>
                <Typography variant="body2" fontWeight={600} fontFamily="monospace">{card.accountNumber}</Typography>
              </Box>
            </Stack>
          </Box>

          <AnimatePresence mode="wait">
            {step === 'type' && (
              <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Typography variant="body2" color="text.secondary" mb={2}>Select transaction type</Typography>
                <Grid container spacing={1.5}>
                  {TXN_TYPES.map((t, i) => (
                    <Grid key={t.id} size={{ xs: 6, sm: 4 }}>
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <Box
                          onClick={() => handleTypeSelect(t.id)}
                          sx={{
                            cursor: 'pointer', p: 1.5, borderRadius: 3, border: '2px solid', borderColor: 'divider',
                            textAlign: 'center', transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${t.color}30`, borderColor: t.color },
                          }}
                        >
                          <Box sx={{ color: t.color, display: 'flex', justifyContent: 'center', mb: 0.5 }}>{t.icon}</Box>
                          <Typography variant="caption" fontWeight={600}>{t.label}</Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            )}

            {step === 'details' && txnType && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>TRANSACTION TYPE</Typography>
                    <Typography variant="body1" fontWeight={600}>{TXN_LABELS[txnType]}</Typography>
                    <Chip label={TXN_CHANNELS[txnType]} size="small" sx={{ mt: 0.5 }} />
                  </Box>

                  <TextField
                    fullWidth label="Merchant / Description" value={merchant}
                    onChange={e => { setMerchant(e.target.value); setError(''); }}
                    placeholder={TXN_TYPES.find(t => t.id === txnType)?.merchantPlaceholder}
                    error={!!error && !merchant.trim()}
                  />

                  {RECIPIENT_REQUIRED_TYPES.includes(txnType) && (
                    <TextField
                      fullWidth label={txnType === 'bank_transfer' ? 'Recipient Account Number' : 'Recipient Card Number'}
                      value={recipientAccount}
                      onChange={e => { setRecipientAccount(e.target.value); setError(''); }}
                      placeholder={txnType === 'bank_transfer' ? 'e.g. 1234567890' : 'e.g. 4532XXXXXXXX9012'}
                      error={!!error && !recipientAccount.trim()}
                    />
                  )}

                  <TextField
                    fullWidth label="Notes (optional)" value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Additional transaction notes"
                  />

                  <Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>AMOUNT (BDT)</Typography>
                    <TextField
                      fullWidth type="number" value={amount}
                      onChange={e => { setAmount(e.target.value); setError(''); }}
                      error={!!error && !!amount}
                      helperText={error || 'Enter the transaction amount'}
                      inputProps={{ min: 10 }}
                      InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
                    />
                  </Box>

                  <Grid container spacing={1}>
                    {[500, 1000, 2000, 5000].map(amt => (
                      <Grid key={amt} size={{ xs: 3 }}>
                        <Button
                          variant={parseFloat(amount) === amt ? 'contained' : 'outlined'}
                          size="small" fullWidth
                          onClick={() => { setAmount(String(amt)); setError(''); }}
                          sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                          ৳{amt >= 1000 ? `${amt / 1000}k` : amt}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>

                  {fee > 0 && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Typography variant="caption">Service charge: ৳{fee}. Total deduction: ৳{total.toLocaleString()}</Typography>
                    </Alert>
                  )}
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="caption">Amount will be deducted from the account linked to this card ({card.accountNumber}).</Typography>
                  </Alert>
                </Stack>
              </motion.div>
            )}

            {step === 'security' && txnType && (
              <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Lock size={20} color="#0F4C81" />
                    <Typography variant="subtitle1" fontWeight={700}>Security Verification</Typography>
                  </Box>

                  {needsPin && (
                    <TextField
                      fullWidth label="Card PIN" type="password" value={pin}
                      onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                      placeholder="4-digit PIN"
                      inputProps={{ maxLength: 4, inputMode: 'numeric' }}
                      error={!!error && pin.length !== 4}
                      InputProps={{ startAdornment: <InputAdornment position="start"><Lock size={16} /></InputAdornment> }}
                    />
                  )}

                  {needsCvv && (
                    <TextField
                      fullWidth label="CVV" type="password" value={cvv}
                      onChange={e => { setCvv(e.target.value.replace(/\D/g, '').slice(0, 3)); setError(''); }}
                      placeholder="3-digit CVV"
                      inputProps={{ maxLength: 3, inputMode: 'numeric' }}
                      error={!!error && cvv.length !== 3}
                      InputProps={{ startAdornment: <InputAdornment position="start"><Lock size={16} /></InputAdornment> }}
                    />
                  )}

                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <Typography variant="caption">Your PIN/CVV is verified securely and never stored in the transaction record.</Typography>
                  </Alert>
                </Stack>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>

        {step === 'details' && (
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" fullWidth onClick={handleClose}>Cancel</Button>
            <Button variant="contained" fullWidth disabled={!amount || !merchant.trim()} onClick={handleDetailsNext}>
              {needsPin || needsCvv ? 'Verify Security' : 'Proceed to Confirm'}
            </Button>
          </DialogActions>
        )}
        {step === 'security' && (
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" fullWidth onClick={handleClose}>Cancel</Button>
            <Button variant="contained" fullWidth onClick={handleSecurityNext}>Proceed to Confirm</Button>
          </DialogActions>
        )}
      </Dialog>

      <CardTransactionModal
        open={open && step === 'confirm'}
        card={card}
        txnType={txnType}
        amount={parseFloat(amount) || 0}
        merchant={merchant}
        category={txnType ? TXN_LABELS[txnType] : ''}
        description={description}
        pin={pin}
        cvv={cvv}
        recipientAccount={recipientAccount}
        onClose={() => { reset(); onClose(); }}
        onCompleted={onCompleted}
      />
    </>
  );
}
