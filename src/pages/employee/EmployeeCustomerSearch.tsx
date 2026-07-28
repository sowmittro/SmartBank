import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box, Card, CardContent, Grid, Stack, TextField, Typography, Chip, Divider, Avatar, Button,
} from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EmployeeLayout from '../../components/EmployeeLayout';
import { getUsers } from '../../utils/localStorageDB';
import type { User } from '../../utils/localStorageDB';

export default function EmployeeCustomerSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<User | null>(null);

  const customers = getUsers().filter(u => u.role === 'user');
  const filtered = query.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.accountNumber.includes(query) ||
        c.mobile.includes(query) ||
        c.email.toLowerCase().includes(query.toLowerCase()) ||
        c.nidNumber.includes(query)
      )
    : customers;

  return (
    <EmployeeLayout title="Customer Search">
      <Box>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Customer Search</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Search for customers by name, account number, mobile, email, or NID.</Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2} px={1}>
                  <PersonSearchIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={700}>Search Customers</Typography>
                </Stack>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by name, account, mobile..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  sx={{ mb: 2, px: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ px: 1, display: 'block', mb: 1 }}>
                  {filtered.length} customer{filtered.length !== 1 ? 's' : ''} found
                </Typography>
                <Stack spacing={0.5} sx={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                  {filtered.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <Typography color="text.secondary" variant="body2">No customers found</Typography>
                    </Box>
                  ) : filtered.map(c => (
                    <Box
                      key={c.id}
                      onClick={() => setSelected(c)}
                      sx={{
                        p: 1.5, borderRadius: 2, cursor: 'pointer',
                        border: '1px solid', borderColor: selected?.id === c.id ? 'primary.main' : 'divider',
                        bgcolor: selected?.id === c.id ? 'primary.50' : 'background.paper',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}>
                          {c.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Typography variant="body2" fontWeight={600} noWrap>{c.name}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{c.accountNumber}</Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          {!c.isApproved && <Chip label="Pending" size="small" color="warning" sx={{ height: 18, fontSize: '0.6rem' }} />}
                          {!c.isActive && <Chip label="Frozen" size="small" color="error" sx={{ height: 18, fontSize: '0.6rem' }} />}
                          {c.kycStatus === 'verified' && <Chip label="KYC" size="small" color="success" sx={{ height: 18, fontSize: '0.6rem' }} />}
                        </Stack>
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
                        <Chip label={selected.isApproved ? 'Approved' : 'Pending'} size="small" color={selected.isApproved ? 'success' : 'warning'} />
                        <Chip label={selected.isActive ? 'Active' : 'Frozen'} size="small" color={selected.isActive ? 'success' : 'error'} />
                        {selected.kycStatus && <Chip label={`KYC: ${selected.kycStatus}`} size="small" color={selected.kycStatus === 'verified' ? 'success' : selected.kycStatus === 'rejected' ? 'error' : 'warning'} />}
                      </Stack>
                    </Box>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => navigate(`/employee/customer-detail/${selected.id}`)}
                    sx={{ mb: 2 }}
                  >
                    View Full Dashboard
                  </Button>
                  <Grid container spacing={2}>
                    {[
                      { label: 'Account Number', value: selected.accountNumber },
                      { label: 'Balance', value: `৳${selected.balance.toLocaleString()}` },
                      { label: 'NID Number', value: selected.nidNumber },
                      { label: 'Date of Birth', value: selected.dob ? new Date(selected.dob).toLocaleDateString() : 'N/A' },
                      { label: 'Gender', value: selected.gender },
                      { label: 'Mobile', value: selected.mobile },
                      { label: "Father's Name", value: selected.fatherName || 'N/A' },
                      { label: "Mother's Name", value: selected.motherName || 'N/A' },
                      { label: 'Address', value: selected.address || 'N/A' },
                      { label: 'Registered On', value: new Date(selected.createdAt).toLocaleDateString() },
                      ...(selected.loanStatus === 'active' ? [
                        { label: 'Loan Amount', value: `৳${(selected.loanAmount ?? 0).toLocaleString()}` },
                        { label: 'Interest Rate', value: `${selected.loanInterestRate ?? 0}% p.m.` },
                        { label: 'Loan Due Date', value: selected.loanDueDate ? new Date(selected.loanDueDate).toLocaleDateString() : 'N/A' },
                      ] : []),
                    ].map(item => (
                      <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" display="block">{item.label}</Typography>
                          <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <PersonSearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Select a customer from the list to view their details.</Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    </EmployeeLayout>
  );
}
