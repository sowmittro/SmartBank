import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import { CustomThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import VerificationGuard from './components/VerificationGuard';
import Forbidden from './pages/Forbidden';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Transfer = lazy(() => import('./pages/Transfer'));
const Profile = lazy(() => import('./pages/Profile'));
const Cards = lazy(() => import('./pages/Cards'));
const FixedDeposit = lazy(() => import('./pages/FixedDeposit'));
const Loans = lazy(() => import('./pages/Loans'));
const Support = lazy(() => import('./pages/Support'));
const PayBills = lazy(() => import('./pages/PayBills'));
const Verification = lazy(() => import('./pages/Verification'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminCustomerDetail = lazy(() => import('./pages/AdminCustomerDetail'));
const CustomerDetailDashboard = lazy(() => import('./pages/CustomerDetailDashboard'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const AdminSupport = lazy(() => import('./pages/AdminSupport'));
const AdminCards = lazy(() => import('./pages/AdminCards'));
const AdminEmployees = lazy(() => import('./pages/AdminEmployees'));
const AdminAudit = lazy(() => import('./pages/AdminAudit'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));

const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const EmployeeRegistration = lazy(() => import('./pages/employee/EmployeeRegistration'));
const EmployeeOpenAccount = lazy(() => import('./pages/employee/EmployeeOpenAccount'));
const EmployeeKyc = lazy(() => import('./pages/employee/EmployeeKyc'));
const EmployeeDeposit = lazy(() => import('./pages/employee/EmployeeDeposit'));
const EmployeeWithdrawal = lazy(() => import('./pages/employee/EmployeeWithdrawal'));
const EmployeeTransfer = lazy(() => import('./pages/employee/EmployeeTransfer'));
const EmployeeLoanProcessing = lazy(() => import('./pages/employee/EmployeeLoanProcessing'));
const EmployeeCustomerSearch = lazy(() => import('./pages/employee/EmployeeCustomerSearch'));
const EmployeeTransactions = lazy(() => import('./pages/employee/EmployeeTransactions'));
const EmployeeNotifications = lazy(() => import('./pages/employee/EmployeeNotifications'));
const EmployeeProfile = lazy(() => import('./pages/employee/EmployeeProfile'));
const EmployeeCardApplication = lazy(() => import('./pages/employee/EmployeeCardApplication'));
const EmployeeSupport = lazy(() => import('./pages/employee/EmployeeSupport'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: 2, bgcolor: '#f5f7fa' }}>
    <CircularProgress size={48} thickness={4} />
  </Box>
);

function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<ProtectedRoute role="user"><VerificationGuard><Dashboard /></VerificationGuard></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute role="user"><VerificationGuard><Transactions /></VerificationGuard></ProtectedRoute>} />
                <Route path="/transfer" element={<ProtectedRoute role="user"><VerificationGuard><Transfer /></VerificationGuard></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute role="user"><VerificationGuard><Profile /></VerificationGuard></ProtectedRoute>} />
                <Route path="/cards" element={<ProtectedRoute role="user"><VerificationGuard><Cards /></VerificationGuard></ProtectedRoute>} />
                <Route path="/fixed-deposit" element={<ProtectedRoute role="user"><VerificationGuard><FixedDeposit /></VerificationGuard></ProtectedRoute>} />
                <Route path="/loans" element={<ProtectedRoute role="user"><VerificationGuard><Loans /></VerificationGuard></ProtectedRoute>} />
                <Route path="/support" element={<ProtectedRoute role="user"><VerificationGuard><Support /></VerificationGuard></ProtectedRoute>} />
                <Route path="/pay-bills" element={<ProtectedRoute role="user"><VerificationGuard><PayBills /></VerificationGuard></ProtectedRoute>} />
                <Route path="/verification" element={<ProtectedRoute role="user"><Verification /></ProtectedRoute>} />
                <Route path="/forbidden" element={<Forbidden />} />
                <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/customer/:id" element={<ProtectedRoute role="admin"><AdminCustomerDetail /></ProtectedRoute>} />
                <Route path="/admin/customer-detail/:id" element={<ProtectedRoute role="admin"><CustomerDetailDashboard /></ProtectedRoute>} />
                <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />
                <Route path="/admin/support" element={<ProtectedRoute role="admin"><AdminSupport /></ProtectedRoute>} />
                <Route path="/admin/cards" element={<ProtectedRoute role="admin"><AdminCards /></ProtectedRoute>} />
                <Route path="/admin/employees" element={<ProtectedRoute role="admin"><AdminEmployees /></ProtectedRoute>} />
                <Route path="/admin/audit" element={<ProtectedRoute role="admin"><AdminAudit /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />
                <Route path="/admin/profile" element={<ProtectedRoute role="admin"><AdminProfile /></ProtectedRoute>} />
                <Route path="/admin/customers" element={<Navigate to="/admin?tab=customers" replace />} />
                <Route path="/admin/approvals" element={<Navigate to="/admin?tab=approvals" replace />} />
                <Route path="/admin/transactions" element={<Navigate to="/admin?tab=transactions" replace />} />
                <Route path="/admin/loans" element={<Navigate to="/admin?tab=loans" replace />} />
                <Route path="/admin/deposits" element={<Navigate to="/admin?tab=transactions" replace />} />
                <Route path="/employee" element={<ProtectedRoute role="employee"><EmployeeDashboard /></ProtectedRoute>} />
                <Route path="/employee/registration" element={<ProtectedRoute role="employee"><EmployeeRegistration /></ProtectedRoute>} />
                <Route path="/employee/open-account" element={<ProtectedRoute role="employee"><EmployeeOpenAccount /></ProtectedRoute>} />
                <Route path="/employee/kyc" element={<ProtectedRoute role="employee"><EmployeeKyc /></ProtectedRoute>} />
                <Route path="/employee/deposit" element={<ProtectedRoute role="employee"><EmployeeDeposit /></ProtectedRoute>} />
                <Route path="/employee/withdrawal" element={<ProtectedRoute role="employee"><EmployeeWithdrawal /></ProtectedRoute>} />
                <Route path="/employee/transfer" element={<ProtectedRoute role="employee"><EmployeeTransfer /></ProtectedRoute>} />
                <Route path="/employee/loan-processing" element={<ProtectedRoute role="employee"><EmployeeLoanProcessing /></ProtectedRoute>} />
                <Route path="/employee/customer-search" element={<ProtectedRoute role="employee"><EmployeeCustomerSearch /></ProtectedRoute>} />
                <Route path="/employee/customer-detail/:id" element={<ProtectedRoute role="employee"><CustomerDetailDashboard /></ProtectedRoute>} />
                <Route path="/employee/transactions" element={<ProtectedRoute role="employee"><EmployeeTransactions /></ProtectedRoute>} />
                <Route path="/employee/notifications" element={<ProtectedRoute role="employee"><EmployeeNotifications /></ProtectedRoute>} />
                <Route path="/employee/profile" element={<ProtectedRoute role="employee"><EmployeeProfile /></ProtectedRoute>} />
                <Route path="/employee/card-application" element={<ProtectedRoute role="employee"><EmployeeCardApplication /></ProtectedRoute>} />
                <Route path="/employee/support" element={<ProtectedRoute role="employee"><EmployeeSupport /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
