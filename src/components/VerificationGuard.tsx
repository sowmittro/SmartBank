import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
}

export default function VerificationGuard({ children }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  // Only enforce for customers, not admin/employee
  if (user.role !== 'user') return <>{children}</>;

  // If not approved yet, redirect to a holding page (they shouldn't access banking)
  if (!user.isApproved) return <Navigate to="/verification" replace />;

  // If approved but KYC not verified or nominee not added, redirect to verification
  if (user.kycStatus !== 'verified' || !user.nominee) {
    return <Navigate to="/verification" replace />;
  }

  return <>{children}</>;
}
