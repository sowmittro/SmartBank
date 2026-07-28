import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Stack, Typography, Chip, Divider, Avatar,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmployeeLayout from '../../components/EmployeeLayout';
import { useAuth } from '../../context/AuthContext';
import { getPendingKyc, updateUser, addNotification } from '../../utils/localStorageDB';
import type { User } from '../../utils/localStorageDB';
import { useToast } from '../../context/ToastContext';

export default function EmployeeKyc() {
  const toast = useToast();
  const { user } = useAuth();
  const [, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<User | null>(null);

  const pending = getPendingKyc();

  const handleVerify = (u: User) => {
    updateUser(u.id, { kycStatus: 'verified', kycVerifiedBy: user?.id, kycVerifiedAt: new Date().toISOString() });
    addNotification({
      accountNumber: u.accountNumber,
      message: 'Your KYC verification has been approved. Your account is now fully verified.',
      type: 'success',
    });
    toast.showSuccess(`KYC verified for ${u.name}`);
    setSelected(null);
    setRefreshKey(k => k + 1);
  };

  const handleReject = (u: User) => {
    updateUser(u.id, { kycStatus: 'rejected', kycVerifiedBy: user?.id, kycVerifiedAt: new Date().toISOString() });
    addNotification({
      accountNumber: u.accountNumber,
      message: 'Your KYC verification has been rejected. Please contact your branch for more information.',
      type: 'error',
    });
    toast.showSuccess(`KYC rejected for ${u.name}`);
    setSelected(null);
    setRefreshKey(k => k + 1);
  };

  return (
    <EmployeeLayout title="KYC Verification">
      <Box>
        <Typography variant="h5" fontWeight={700} mb={0.5}>KYC Verification</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Review and verify customer identity documents.</Typography>

        {pending.length === 0 ? (
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" fontWeight={600}>All Clear</Typography>
              <Typography variant="body2" color="text.secondary">No pending KYC verifications.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem', mb: 1.5, px: 1 }}>
                    Pending KYC ({pending.length})
                  </Typography>
                  <Stack spacing={1}>
                    {pending.map(u => (
                      <Box
                        key={u.id}
                        onClick={() => setSelected(u)}
                        sx={{
                          p: 1.5, borderRadius: 2, cursor: 'pointer',
                          border: '1px solid', borderColor: selected?.id === u.id ? 'primary.main' : 'divider',
                          bgcolor: selected?.id === u.id ? 'primary.50' : 'background.paper',
                          '&:hover': { borderColor: 'primary.main' },
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}>
                            {u.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box flex={1} minWidth={0}>
                            <Typography variant="body2" fontWeight={600} noWrap>{u.name}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>{u.accountNumber}</Typography>
                          </Box>
                          <Chip label="Pending" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              {selected ? (
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: '1.2rem', fontWeight: 700 }}>
                        {selected.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>{selected.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{selected.email}</Typography>
                        <Stack direction="row" spacing={1} mt={0.5}>
                          <Chip label={selected.accountType} size="small" variant="outlined" color="primary" />
                          <Chip label={`Balance ৳${selected.balance.toLocaleString()}`} size="small" variant="outlined" />
                        </Stack>
                      </Box>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {[
                        { label: 'Account Number', value: selected.accountNumber },
                        { label: 'NID / Passport', value: selected.kycData?.nidPassport ?? selected.nidNumber },
                        { label: 'Date of Birth', value: selected.dob ? new Date(selected.dob).toLocaleDateString() : 'N/A' },
                        { label: 'Gender', value: selected.gender },
                        { label: 'Mobile', value: selected.mobile },
                        { label: 'Email', value: selected.email },
                        { label: "Father's Name", value: selected.fatherName || 'N/A' },
                        { label: "Mother's Name", value: selected.motherName || 'N/A' },
                        { label: 'Occupation', value: selected.kycData?.occupation ?? 'N/A' },
                        { label: 'Source of Income', value: selected.kycData?.sourceOfIncome ?? 'N/A' },
                        { label: 'Monthly Income', value: selected.kycData ? `৳${selected.kycData.monthlyIncome.toLocaleString()}` : 'N/A' },
                        { label: 'Submitted On', value: selected.kycData ? new Date(selected.kycData.submittedAt).toLocaleDateString() : 'N/A' },
                        { label: 'Present Address', value: selected.kycData?.presentAddress ?? selected.address ?? 'N/A', full: true },
                        { label: 'Permanent Address', value: selected.kycData?.permanentAddress ?? 'N/A', full: true },
                      ].map(item => (
                        <Grid key={item.label} size={{ xs: 12, sm: 6, md: item.full ? 12 : 4 }}>
                          <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" display="block">{item.label}</Typography>
                            <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    <Stack direction="row" spacing={2} mt={3}>
                      <Button variant="contained" color="success" startIcon={<VerifiedUserIcon />} onClick={() => handleVerify(selected)}>
                        Verify KYC
                      </Button>
                      <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => handleReject(selected)}>
                        Reject
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ) : (
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', py: 8 }}>
                    <VerifiedUserIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Select a customer from the list to review their KYC details.</Typography>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        )}
      </Box>
    </EmployeeLayout>
  );
}
