import { Box, Card, CardContent, Stack, Typography, Chip, Avatar, Grid, Divider, type ChipProps } from '@mui/material';
import {
  Person as PersonIcon, Badge as BadgeIcon, AccountBalance as AccountBalanceIcon,
  LocationOn as LocationOnIcon, Phone as PhoneIcon, Email as EmailIcon,
  CalendarToday as CalendarIcon, Work as WorkIcon, Wc as WcIcon,
  People as PeopleIcon, Home as HomeIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { User } from '../../utils/localStorageDB';
import { InfoRow, InfoSection } from './InfoRow';

const statusColor = (status: string): ChipProps['color'] => {
  if (status === 'active' || status === 'verified') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'suspended' || status === 'rejected' || status === 'blocked') return 'error';
  if (status === 'closed' || status === 'expired') return 'default';
  return 'info';
};

const accountStatus = (u: User) => {
  if (!u.isApproved) return 'pending';
  if (!u.isActive) return 'suspended';
  return 'active';
};

export function ProfileOverview({ user }: { user: User }) {
  const fmtCur = (n: number) => `৳${(n ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const status = accountStatus(user);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Hero profile card */}
      <Card sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Box sx={{
          height: 100,
          background: 'linear-gradient(135deg, #0F4C81 0%, #1B6CA8 50%, #072842 100%)',
        }} />
        <CardContent sx={{ pt: 0, mt: '-40px' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
            <Avatar
              src={user.profilePhoto}
              sx={{
                width: 80, height: 80, border: '4px solid', borderColor: 'background.paper',
                bgcolor: 'primary.light', fontSize: '2rem', fontWeight: 700, flexShrink: 0,
              }}
            >
              {user.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#fff' }}>{user.name}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  size="small"
                  label={status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Suspended'}
                  color={statusColor(status)}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={user.kycStatus === 'verified' ? 'KYC Verified' : user.kycStatus === 'rejected' ? 'KYC Rejected' : 'KYC Pending'}
                  color={statusColor(user.kycStatus ?? 'pending')}
                  variant="outlined"
                />
                <Chip size="small" label={user.accountType || 'Savings'} color="primary" variant="outlined" />
              </Stack>
            </Box>
          </Stack>

          {/* Balance cards */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Balance</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ mt: 0.5 }}>{fmtCur(user.balance)}</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Available Balance</Typography>
                <Typography variant="h5" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>{fmtCur(user.balance - (user.pendingInterest ?? 0))}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Account & Identity */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <InfoSection title="Account Information" icon={<AccountBalanceIcon fontSize="small" />}>
                <InfoRow label="Account Number" value={user.accountNumber} icon={<BadgeIcon fontSize="small" />} />
                <InfoRow label="Account Type" value={user.accountType || 'Savings'} />
                <InfoRow label="Branch" value={user.branch || 'Smart Bank Main Branch, Dhaka'} icon={<HomeIcon fontSize="small" />} />
                <InfoRow label="Customer ID" value={user.id} icon={<BadgeIcon fontSize="small" />} />
                <InfoRow label="Account Status" value={
                  <Chip size="small" label={status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Suspended'} color={statusColor(status)} variant="outlined" />
                } />
              </InfoSection>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <InfoSection title="Personal Information" icon={<PersonIcon fontSize="small" />}>
                <InfoRow label="Full Name" value={user.name} icon={<PersonIcon fontSize="small" />} />
                <InfoRow label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString() : '—'} icon={<CalendarIcon fontSize="small" />} />
                <InfoRow label="Gender" value={user.gender || '—'} icon={<WcIcon fontSize="small" />} />
                <InfoRow label="Father's Name" value={user.fatherName || '—'} icon={<PeopleIcon fontSize="small" />} />
                <InfoRow label="Mother's Name" value={user.motherName || '—'} icon={<PeopleIcon fontSize="small" />} />
              </InfoSection>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <InfoSection title="Contact Information" icon={<PhoneIcon fontSize="small" />}>
                <InfoRow label="Phone Number" value={user.mobile || '—'} icon={<PhoneIcon fontSize="small" />} />
                <InfoRow label="Email Address" value={user.email} icon={<EmailIcon fontSize="small" />} />
                <InfoRow label="Address" value={user.address || user.kycData?.presentAddress || '—'} icon={<LocationOnIcon fontSize="small" />} />
              </InfoSection>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <CardContent>
              <InfoSection title="KYC & Occupation" icon={<WorkIcon fontSize="small" />}>
                <InfoRow label="National ID / Passport" value={user.nidNumber || '—'} icon={<BadgeIcon fontSize="small" />} />
                <InfoRow label="Occupation" value={user.kycData?.occupation || '—'} icon={<WorkIcon fontSize="small" />} />
                <InfoRow label="Source of Income" value={user.kycData?.sourceOfIncome || '—'} />
                <InfoRow label="Monthly Income" value={user.kycData?.monthlyIncome ? `৳${user.kycData.monthlyIncome.toLocaleString()}` : '—'} />
                <InfoRow label="Permanent Address" value={user.kycData?.permanentAddress || '—'} icon={<HomeIcon fontSize="small" />} />
              </InfoSection>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="caption" color="text.secondary">
        Account opened on {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
      </Typography>
    </motion.div>
  );
}
