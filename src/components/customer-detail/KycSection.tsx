import { Box, Card, CardContent, Stack, Typography, Chip, Grid, Divider, type ChipProps } from '@mui/material';
import {
  Verified as VerifiedIcon, Pending as PendingIcon, Cancel as CancelIcon,
  Badge as BadgeIcon, Person as PersonIcon, Event as EventIcon, CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { User } from '../../utils/localStorageDB';
import { InfoRow, InfoSection } from './InfoRow';

export function KycSection({ user }: { user: User }) {
  const status = user.kycStatus ?? 'pending';
  const kycData = user.kycData;

  const statusColor: ChipProps['color'] = status === 'verified' ? 'success' : status === 'rejected' ? 'error' : 'warning';
  const StatusIcon = status === 'verified' ? VerifiedIcon : status === 'rejected' ? CancelIcon : PendingIcon;

  const timeline = [
    { label: 'Account Created', date: user.createdAt, done: true },
    { label: 'KYC Submitted', date: kycData?.submittedAt, done: !!kycData?.submittedAt },
    { label: 'KYC Verified', date: user.kycVerifiedAt, done: status === 'verified' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Grid container spacing={3}>
        {/* Status banner */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', bgcolor: statusColor === 'success' ? 'success.50' : statusColor === 'error' ? 'error.50' : 'warning.50' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{
                  bgcolor: statusColor === 'success' ? 'success.main' : statusColor === 'error' ? 'error.main' : 'warning.main',
                  borderRadius: '50%', p: 1.25, color: '#fff', display: 'flex',
                }}>
                  <StatusIcon />
                </Box>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    {status === 'verified' ? 'KYC Verified' : status === 'rejected' ? 'KYC Rejected' : 'KYC Pending Review'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {status === 'verified'
                      ? `Verified on ${user.kycVerifiedAt ? new Date(user.kycVerifiedAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}`
                      : status === 'rejected'
                        ? 'KYC verification was rejected. Please contact support.'
                        : 'KYC documents are pending review by the compliance team.'}
                  </Typography>
                </Box>
                <Chip
                  label={status === 'verified' ? 'Verified' : status === 'rejected' ? 'Rejected' : 'Pending'}
                  color={statusColor}
                  icon={<StatusIcon />}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* KYC Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <InfoSection title="Identity Documents" icon={<BadgeIcon fontSize="small" />}>
                <InfoRow label="National ID / Passport" value={user.nidNumber || '—'} icon={<BadgeIcon fontSize="small" />} />
                <InfoRow label="Full Name (as per NID)" value={user.name || '—'} icon={<PersonIcon fontSize="small" />} />
                <InfoRow label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString() : '—'} icon={<EventIcon fontSize="small" />} />
                <InfoRow label="Gender" value={user.gender || '—'} />
                <Divider sx={{ my: 1 }} />
                <InfoRow label="Present Address" value={kycData?.presentAddress || user.address || '—'} />
                <InfoRow label="Permanent Address" value={kycData?.permanentAddress || '—'} />
              </InfoSection>
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Info */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <InfoSection title="Financial Information" icon={<PersonIcon fontSize="small" />}>
                <InfoRow label="Occupation" value={kycData?.occupation || '—'} />
                <InfoRow label="Source of Income" value={kycData?.sourceOfIncome || '—'} />
                <InfoRow label="Monthly Income" value={kycData?.monthlyIncome ? `৳${kycData.monthlyIncome.toLocaleString()}` : '—'} />
                <Divider sx={{ my: 1 }} />
                <InfoRow label="Verified By" value={user.kycVerifiedBy || '—'} icon={<CheckCircleIcon fontSize="small" />} />
                <InfoRow label="Verification Date" value={user.kycVerifiedAt ? new Date(user.kycVerifiedAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} icon={<EventIcon fontSize="small" />} />
                <InfoRow label="Approval Status" value={
                  <Chip
                    size="small"
                    label={status === 'verified' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending'}
                    color={statusColor}
                    variant="outlined"
                  />
                } />
              </InfoSection>
            </CardContent>
          </Card>
        </Grid>

        {/* Verification Timeline */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Verification Timeline</Typography>
              <Stack spacing={0}>
                {timeline.map((item, i) => (
                  <Stack key={i} direction="row" spacing={2} sx={{ position: 'relative', pb: 2 }}>
                    <Stack alignItems="center" sx={{ flexShrink: 0 }}>
                      <Box sx={{
                        width: 12, height: 12, borderRadius: '50%',
                        bgcolor: item.done ? 'success.main' : 'grey.400',
                        mt: 0.5,
                      }} />
                      {i < timeline.length - 1 && (
                        <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', mt: 0.5, minHeight: 24 }} />
                      )}
                    </Stack>
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={600} color={item.done ? 'text.primary' : 'text.disabled'}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.date ? new Date(item.date).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </motion.div>
  );
}
