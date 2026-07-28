import { Box, Typography, Button, Paper, Container } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

export default function Forbidden() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goHome = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin');
    } else if (user.role === 'employee') {
      navigate('/employee');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <BrandLogo variant="auth" height={70} clickable={false} />
          </Box>
          <Box sx={{ bgcolor: 'error.light', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <BlockIcon sx={{ fontSize: 48, color: 'error.dark' }} />
          </Box>
          <Typography variant="h3" fontWeight={800} color="error.main" gutterBottom>403</Typography>
          <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>Access Denied</Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            You don't have permission to access this page.
            {user ? (
              <> This area is restricted to <strong>{user.role === 'admin' ? 'administrators' : user.role === 'employee' ? 'employees' : 'customers'}</strong> only.</>
            ) : (
              <> Please log in to access this resource.</>
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button variant="contained" startIcon={<HomeIcon />} onClick={goHome}>
              {user ? 'Go to Dashboard' : 'Go to Login'}
            </Button>
          </Box>
        </Paper>
        <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 2 }}>
          If you believe this is an error, please contact your administrator.
        </Typography>
      </Container>
    </Box>
  );
}
