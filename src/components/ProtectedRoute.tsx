import React from 'react';
import { Navigate } from 'react-router';
import { Box, CircularProgress } from '@mui/material';
import Forbidden from '../pages/Forbidden';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'admin' | 'user' | 'employee';
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Forbidden />;
  return <>{children}</>;
}
