import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box, Tabs, Tab, Alert, Button, Stack,
} from '@mui/material';
import {
  Person as PersonIcon, CreditCard as CreditCardIcon, Receipt as ReceiptIcon,
  VerifiedUser as VerifiedUserIcon, People as PeopleIcon, AccountBalance as AccountBalanceIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import type { User } from '../utils/localStorageDB';
import { getUserById, updateUser, addNotification, generatePin } from '../utils/localStorageDB';
import { useToast } from '../context/ToastContext';
import AdminLayout from '../components/AdminLayout';
import EmployeeLayout from '../components/EmployeeLayout';
import { ProfileOverview } from '../components/customer-detail/ProfileOverview';
import { CardsSection } from '../components/customer-detail/CardsSection';
import { TransactionsSection } from '../components/customer-detail/TransactionsSection';
import { KycSection } from '../components/customer-detail/KycSection';
import { NomineeSection } from '../components/customer-detail/NomineeSection';
import { LoanSection } from '../components/customer-detail/LoanSection';

type TabValue = 'profile' | 'cards' | 'transactions' | 'kyc' | 'nominee' | 'loan';

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ReactElement;
}

const TABS: TabConfig[] = [
  { value: 'profile', label: 'Profile', icon: <PersonIcon fontSize="small" /> },
  { value: 'cards', label: 'Cards', icon: <CreditCardIcon fontSize="small" /> },
  { value: 'transactions', label: 'Transactions', icon: <ReceiptIcon fontSize="small" /> },
  { value: 'kyc', label: 'KYC', icon: <VerifiedUserIcon fontSize="small" /> },
  { value: 'nominee', label: 'Nominee', icon: <PeopleIcon fontSize="small" /> },
  { value: 'loan', label: 'Loan', icon: <AccountBalanceIcon fontSize="small" /> },
];

export default function CustomerDetailDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<TabValue>('profile');
  const [, forceRefresh] = useState(0);
  const [newPin, setNewPin] = useState('');

  const viewerRole = (() => {
    const session = localStorage.getItem('sb_session');
    if (!session) return 'admin';
    const { userId } = JSON.parse(session);
    const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
    const u = users.find((x: User) => x.id === userId);
    return u?.role ?? 'admin';
  })();

  const Layout = viewerRole === 'employee' ? EmployeeLayout : AdminLayout;
  const backPath = viewerRole === 'employee' ? '/employee/customer-search' : '/admin?tab=customers';

  const user = id ? getUserById(id) : null;

  if (!user) {
    return (
      <Layout title="Customer Not Found">
        <Alert severity="error" action={<Button onClick={() => navigate(backPath)} startIcon={<ArrowBackIcon />}>Go Back</Button>}>
          Customer not found.
        </Alert>
      </Layout>
    );
  }

  const handleFreezeToggle = () => {
    updateUser(user.id, { isActive: !user.isActive });
    addNotification({
      accountNumber: user.accountNumber,
      message: !user.isActive ? 'Account reactivated.' : 'Account suspended.',
      type: !user.isActive ? 'success' : 'error',
    });
    toast.showSuccess(`Account ${!user.isActive ? 'reactivated' : 'suspended'}.`);
    forceRefresh(k => k + 1);
  };

  const handleResetPin = () => {
    const pin = generatePin();
    updateUser(user.id, { pin });
    setNewPin(pin);
    toast.showSuccess('PIN reset successfully.');
    forceRefresh(k => k + 1);
  };

  return (
    <Layout title={`Customer: ${user.name}`}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Back button + action buttons */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(backPath)}
            sx={{ color: 'text.secondary' }}
          >
            Back to {viewerRole === 'employee' ? 'Search' : 'Customers'}
          </Button>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" color={user.isActive ? 'error' : 'success'} onClick={handleFreezeToggle}>
              {user.isActive ? 'Suspend' : 'Reactivate'}
            </Button>
            <Button size="small" variant="outlined" onClick={handleResetPin}>
              Reset PIN
            </Button>
          </Stack>
        </Stack>

        {newPin && (
          <Alert severity="info" sx={{ mb: 2 }} onClose={() => setNewPin('')}>
            New PIN for {user.name}: <strong>{newPin}</strong> — Please share securely with the customer.
          </Alert>
        )}

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            mb: 3,
            '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontWeight: 600 },
          }}
        >
          {TABS.map(t => (
            <Tab key={t.value} value={t.value} icon={t.icon} iconPosition="start" label={t.label} />
          ))}
        </Tabs>

        {/* Tab Content */}
        <Box>
          {tab === 'profile' && <ProfileOverview user={user} />}
          {tab === 'cards' && <CardsSection userId={user.id} />}
          {tab === 'transactions' && <TransactionsSection user={user} />}
          {tab === 'kyc' && <KycSection user={user} />}
          {tab === 'nominee' && <NomineeSection user={user} />}
          {tab === 'loan' && <LoanSection user={user} />}
        </Box>
      </Box>
    </Layout>
  );
}
