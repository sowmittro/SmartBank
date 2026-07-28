import { Box, Typography, Button, Paper, Container } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

export default function NotFound() {
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
          <Box sx={{ bgcolor: 'grey.200', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <SearchOffIcon sx={{ fontSize: 48, color: 'grey.600' }} />
          </Box>
          <Typography variant="h3" fontWeight={800} color="grey.700" gutterBottom>404</Typography>
          <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>Page Not Found</Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            The page you're looking for doesn't exist or has been moved.
            <br />
            <Typography component="span" variant="body2" color="text.disabled">
              Check the URL or navigate back to a valid page.
            </Typography>
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
          Smart Bank - If you need assistance, please contact support.
        </Typography>
      </Container>
    </Box>
  );
}
