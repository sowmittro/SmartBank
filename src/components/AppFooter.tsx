import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import BrandLogo from './BrandLogo';

export default function AppFooter() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        py: { xs: '12px', sm: '14px' },
        px: 2,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
        <BrandLogo variant="navbar" height={24} clickable={false} />
        <Typography
          variant="caption"
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
            color: 'text.secondary',
            fontWeight: 400,
            letterSpacing: 0.1,
          }}
        >
          © 2026 Smart Bank. All rights reserved.
        </Typography>
      </Stack>
    </Box>
  );
}
