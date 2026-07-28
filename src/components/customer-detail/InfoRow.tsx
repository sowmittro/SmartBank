import { Stack, Typography, Box } from '@mui/material';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1.25 }}>
      {icon && <Box sx={{ color: 'text.secondary', mt: 0.25, display: 'flex' }}>{icon}</Box>}
      <Box flex={1} minWidth={0}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ wordBreak: 'break-word', mt: 0.25 }}>
          {value || '—'}
        </Typography>
      </Box>
    </Stack>
  );
}

interface InfoSectionProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function InfoSection({ title, icon, action, children }: InfoSectionProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">{title}</Typography>
        </Stack>
        {action}
      </Stack>
      {children}
    </Box>
  );
}
