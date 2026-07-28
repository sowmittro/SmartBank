import { Box, Card, CardContent, Stack, Typography, Chip, Grid, Divider, LinearProgress } from '@mui/material';
import {
  People as PeopleIcon, Person as PersonIcon, Phone as PhoneIcon,
  LocationOn as LocationOnIcon, Percent as PercentIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { User } from '../../utils/localStorageDB';
import { InfoRow, InfoSection } from './InfoRow';

export function NomineeSection({ user }: { user: User }) {
  const nominee = user.nominee;

  if (!nominee) {
    return (
      <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary" variant="body2">No nominee has been registered for this account.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <InfoSection title="Nominee Details" icon={<PeopleIcon fontSize="small" />}>
                <InfoRow label="Nominee Name" value={nominee.name || '—'} icon={<PersonIcon fontSize="small" />} />
                <InfoRow label="Relationship" value={nominee.relationship || '—'} icon={<PeopleIcon fontSize="small" />} />
                <InfoRow label="Phone Number" value={nominee.mobile || '—'} icon={<PhoneIcon fontSize="small" />} />
                <InfoRow label="Address" value={nominee.address || '—'} icon={<LocationOnIcon fontSize="small" />} />
              </InfoSection>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <InfoSection title="Allocation & Status" icon={<PercentIcon fontSize="small" />}>
                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Allocation Percentage</Typography>
                    <Typography variant="h6" fontWeight={800} color="primary.main">100%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={100} sx={{ height: 8, borderRadius: 4 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Full allocation assigned to nominee.
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <InfoRow label="Nominee Status" value={
                  <Chip size="small" label="Active" color="success" variant="outlined" />
                } />
                <InfoRow label="Registered On" value={nominee.addedAt ? new Date(nominee.addedAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
              </InfoSection>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </motion.div>
  );
}
