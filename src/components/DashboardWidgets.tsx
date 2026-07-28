import { Box, Card, CardContent, Stack, Typography, Chip, Divider, type ChipProps } from '@mui/material';

interface SummaryCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  color?: string;
  bg?: string;
}

export function SummaryCard({ label, value, sub, icon, color, bg }: SummaryCardProps) {
  return (
    <Card sx={{
      height: '100%',
      '&:hover': { boxShadow: '0 8px 16px -4px rgba(15,23,42,0.08), 0 4px 8px -4px rgba(15,23,42,0.04)', transform: 'translateY(-2px)' },
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.75}>
          {icon && (
            <Box sx={{
              bgcolor: bg ?? 'rgba(37,99,235,0.10)',
              borderRadius: 2.5,
              p: 1.25,
              color: color ?? 'primary.main',
              display: 'flex',
              minWidth: 52,
              height: 52,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {icon}
            </Box>
          )}
          <Box minWidth={0}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.4, fontSize: '0.7rem' }}>{label}</Typography>
            <Typography variant="h5" fontWeight={700} color={color ?? 'text.primary'} sx={{ lineHeight: 1.2, mt: 0.3 }}>{value}</Typography>
            {sub && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{sub}</Typography>}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  type?: 'success' | 'warning' | 'error' | 'info' | 'primary';
}

const typeColor = (t?: ActivityItem['type']) => {
  switch (t) {
    case 'success': return 'success.main';
    case 'warning': return 'warning.main';
    case 'error': return 'error.main';
    case 'info': return 'info.main';
    default: return 'primary.main';
  }
};

export function ActivityTimeline({ items, emptyText = 'No recent activity' }: { items: ActivityItem[]; emptyText?: string }) {
  if (items.length === 0) {
    return <Box sx={{ py: 4, textAlign: 'center' }}><Typography color="text.secondary" variant="body2">{emptyText}</Typography></Box>;
  }
  return (
    <Stack divider={<Divider />} sx={{ py: 0 }}>
      {items.map((item, i) => (
        <Stack key={item.id ?? i} direction="row" spacing={1.75} sx={{ py: 1.5, alignItems: 'flex-start' }}>
          <Box sx={{
            width: 10, height: 10, borderRadius: '50%',
            bgcolor: typeColor(item.type), mt: 0.75, flexShrink: 0,
            boxShadow: `0 0 0 4px ${typeColor(item.type).replace('main', 'main')}15`,
          }} />
          <Box flex={1} minWidth={0}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Typography variant="body2" fontWeight={600} color="text.primary">{item.title}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{new Date(item.date).toLocaleDateString()}</Typography>
            </Stack>
            {item.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{item.description}</Typography>}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

export function QuickActionGrid({ actions }: { actions: { label: string; icon: React.ReactNode; onClick: () => void; color?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'; disabled?: boolean }[] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.5 }}>
      {actions.map(a => (
        <Box key={a.label}>
          <Box
            onClick={a.disabled ? undefined : a.onClick}
            sx={{
              p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
              bgcolor: 'background.paper', cursor: a.disabled ? 'default' : 'pointer',
              opacity: a.disabled ? 0.5 : 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, height: '100%',
              transition: 'all 0.15s',
              '&:hover': a.disabled ? {} : { borderColor: `${a.color ?? 'primary'}.main`, bgcolor: `${a.color ?? 'primary'}.50` },
            }}
          >
            <Box sx={{ color: `${a.color ?? 'primary'}.main`, display: 'flex' }}>{a.icon}</Box>
            <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ textAlign: 'center' }}>{a.label}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function NotificationList({ items, emptyText = 'No notifications' }: { items: { id: string; message: string; date: string; type?: 'info' | 'warning' | 'success' | 'error'; read?: boolean }[]; emptyText?: string }) {
  if (items.length === 0) {
    return <Box sx={{ py: 3, textAlign: 'center' }}><Typography color="text.secondary" variant="body2">{emptyText}</Typography></Box>;
  }
  const chipColor = (t?: string): ChipProps['color'] => t === 'error' ? 'error' : t === 'warning' ? 'warning' : t === 'success' ? 'success' : 'info';
  return (
    <Stack divider={<Divider />} sx={{ py: 0 }}>
      {items.map(n => (
        <Stack key={n.id} direction="row" spacing={1.5} sx={{ py: 1.5, alignItems: 'flex-start' }}>
          <Chip size="small" color={chipColor(n.type)} label={n.type ?? 'info'} sx={{ height: 20, fontSize: '0.65rem', flexShrink: 0, mt: 0.25 }} />
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }} color="text.primary">{n.message}</Typography>
            <Typography variant="caption" color="text.secondary">{new Date(n.date).toLocaleString()}</Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
