import { useState } from 'react';
import { Card, CardContent, Stack, Typography, Grid, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { getCardsByUser } from '../../utils/mockCardsData';
import { CardVisual, CardStatusBadge } from '../CardComponents';

export function CardsSection({ userId }: { userId: string }) {
  const [revealStates, setRevealStates] = useState<Record<string, boolean>>({});
  const cards = getCardsByUser(userId);

  if (cards.length === 0) {
    return (
      <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary" variant="body2">No cards issued for this customer.</Typography>
        </CardContent>
      </Card>
    );
  }

  const toggleReveal = (cardId: string) => {
    setRevealStates(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  return (
    <Grid container spacing={3}>
      {cards.map((card, idx) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.id}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08, duration: 0.3 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
              <CardContent>
                <CardVisual card={card} showDetails={revealStates[card.id] ?? false} onClick={() => toggleReveal(card.id)} />

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, mb: 1.5 }}>
                  <CardStatusBadge status={card.status} size="small" />
                  <Chip size="small" label={card.network === 'visa' ? 'Visa' : 'Mastercard'} variant="outlined" />
                </Stack>

                <Stack spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Card Type</Typography>
                    <Typography variant="caption" fontWeight={600} color="text.primary">{card.type === 'credit' ? 'Credit' : 'Debit'}</Typography>
                  </Stack>
                  {card.type === 'credit' && card.creditLimit !== undefined && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Credit Limit</Typography>
                      <Typography variant="caption" fontWeight={600} color="text.primary">৳{card.creditLimit.toLocaleString()}</Typography>
                    </Stack>
                  )}
                  {card.type === 'credit' && card.currentBalance !== undefined && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Current Usage</Typography>
                      <Typography variant="caption" fontWeight={600} color="text.primary">৳{card.currentBalance.toLocaleString()}</Typography>
                    </Stack>
                  )}
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Annual Fee</Typography>
                    <Typography variant="caption" fontWeight={600} color="text.primary">{card.annualFee > 0 ? `৳${card.annualFee}` : 'Waived'}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Fee Status</Typography>
                    <Typography variant="caption" fontWeight={600} color={card.feeStatus === 'pending' ? 'error.main' : 'text.primary'}>{card.feeStatus}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
}
