import { useState } from 'react';
import {
  Box, Card, CardContent, Stack, Typography, Chip, Divider, Button, type ChipProps,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import EmployeeLayout from '../../components/EmployeeLayout';
import { useAuth } from '../../context/AuthContext';
import { getNotificationsByAccount, markAllNotificationsRead, markNotificationRead } from '../../utils/localStorageDB';

export default function EmployeeNotifications() {
  const { user } = useAuth();
  const [, setRefreshKey] = useState(0);

  if (!user) return null;

  const notifications = [...getNotificationsByAccount(user.accountNumber)].reverse();

  const handleMarkAllRead = () => {
    markAllNotificationsRead(user.accountNumber);
    setRefreshKey(k => k + 1);
  };

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    setRefreshKey(k => k + 1);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const chipColor = (t?: string): ChipProps['color'] => t === 'error' ? 'error' : t === 'warning' ? 'warning' : t === 'success' ? 'success' : 'info';

  return (
    <EmployeeLayout title="Notifications">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Notifications</Typography>
            <Typography variant="body2" color="text.secondary">{notifications.length} total · {unreadCount} unread</Typography>
          </Box>
          {unreadCount > 0 && (
            <Button variant="outlined" startIcon={<DoneAllIcon />} onClick={handleMarkAllRead}>Mark All Read</Button>
          )}
        </Stack>

        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: 0 }}>
            {notifications.length === 0 ? (
              <Box textAlign="center" py={6}>
                <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">No notifications</Typography>
              </Box>
            ) : (
              <Stack divider={<Divider />} sx={{ py: 0 }}>
                {notifications.map(n => (
                  <Box
                    key={n.id}
                    onClick={() => !n.read && handleMarkRead(n.id)}
                    sx={{
                      px: 3, py: 2, cursor: n.read ? 'default' : 'pointer',
                      bgcolor: n.read ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: n.read ? 'action.hover' : 'action.selected' },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Chip size="small" color={chipColor(n.type)} label={n.type ?? 'info'} sx={{ height: 20, fontSize: '0.65rem', flexShrink: 0, mt: 0.25 }} />
                      <Box flex={1} minWidth={0}>
                        <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }} color="text.primary">{n.message}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(n.date).toLocaleString()}</Typography>
                      </Box>
                      {!n.read && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 1, flexShrink: 0 }} />}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </EmployeeLayout>
  );
}
