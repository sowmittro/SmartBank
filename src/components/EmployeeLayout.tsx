import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem,
  Divider, useMediaQuery, useTheme, Stack, Chip, Badge,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BrandLogo from './BrandLogo';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import BadgeIcon from '@mui/icons-material/Badge';
import CreditCardIconNav from '@mui/icons-material/CreditCard';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AppFooter from './AppFooter';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { getNotificationsByAccount, markAllNotificationsRead, getPendingKyc } from '../utils/localStorageDB';
import { getAllTickets } from '../utils/ticketService';

const DRAWER_WIDTH = 256;

const mainNav = [
  { path: '/employee', icon: <DashboardIcon />, label: 'Dashboard' },
  { path: '/employee/registration', icon: <PersonAddIcon />, label: 'Customer Registration' },
  { path: '/employee/open-account', icon: <AccountBalanceIcon />, label: 'Open Account' },
  { path: '/employee/kyc', icon: <VerifiedUserIcon />, label: 'KYC Verification' },
];

const opsNav = [
  { path: '/employee/deposit', icon: <AddIcon />, label: 'Deposit' },
  { path: '/employee/withdrawal', icon: <RemoveIcon />, label: 'Withdrawal' },
  { path: '/employee/transfer', icon: <SwapHorizIcon />, label: 'Fund Transfer' },
  { path: '/employee/loan-processing', icon: <CreditScoreIcon />, label: 'Loan Processing' },
  { path: '/employee/card-application', icon: <CreditCardIconNav />, label: 'Card Applications' },
];

const serviceNav = [
  { path: '/employee/customer-search', icon: <PersonSearchIcon />, label: 'Customer Search' },
  { path: '/employee/transactions', icon: <ReceiptLongIcon />, label: 'Transaction History' },
  { path: '/employee/support', icon: <SupportAgentIcon />, label: 'Support Tickets' },
  { path: '/employee/notifications', icon: <NotificationsIcon />, label: 'Notifications' },
  { path: '/employee/profile', icon: <PersonIcon />, label: 'Profile' },
];

interface EmployeeLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function EmployeeLayout({ children, title }: EmployeeLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();

  const notifications = user ? getNotificationsByAccount(user.accountNumber) : [];
  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingKyc = getPendingKyc().length;
  const openTickets = getAllTickets().filter(t => t.status === 'open' || t.status === 'in-progress').length;
  const pendingCardsCount = (() => { try { return (JSON.parse(localStorage.getItem('smart_cards_all') || '[]') as { status: string }[]).filter(c => c.status === 'pending').length; } catch { return 0; } })();

  const handleLogout = () => { setLogoutOpen(true); };
  const confirmLogout = () => { logout(); setLogoutOpen(false); navigate('/login'); };
  const handleNotifOpen = (e: React.MouseEvent<HTMLElement>) => {
    if (user) markAllNotificationsRead(user.accountNumber);
    setNotifAnchor(e.currentTarget);
  };

  const renderNavSection = (sectionTitle: string, items: { path: string; icon: React.ReactNode; label: string; badge?: number }[]) => (
    <>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1, px: 2, py: 1, display: 'block', fontWeight: 600 }}>
        {sectionTitle}
      </Typography>
      <List sx={{ px: 1, py: 0 }}>
        {items.map(item => {
          const isActive = item.path === '/employee' ? location.pathname === '/employee' : location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  color: 'text.primary',
                  '&.Mui-selected': { color: 'primary.main', bgcolor: 'primary.light' },
                  '&.Mui-selected:hover': { bgcolor: 'primary.light' },
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }} />
                ) : null}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
        <BrandLogo variant="sidebar" height={78} clickable />
      </Box>
      <Divider />

      {user && (
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 700 }}>
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" color="text.primary" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>{user.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 160 }}>{user.designation ?? 'Employee'}</Typography>
            </Box>
          </Stack>
          <Chip icon={<BadgeIcon sx={{ fontSize: '0.75rem !important', color: '#93C5FD !important' }} />} label={user.employeeId ?? 'EMP'} size="small" variant="outlined" sx={{ mt: 1.5, fontSize: '0.7rem', height: 22, color: '#93C5FD', borderColor: 'rgba(37,99,235,0.4)' }} />
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {renderNavSection('Main', mainNav)}
        {renderNavSection('Operations', opsNav.map(n => n.path === '/employee/card-application' ? { ...n, badge: pendingCardsCount || undefined } : n))}
        {renderNavSection('Services', serviceNav.map(s => {
          if (s.path === '/employee/support') return { ...s, badge: openTickets || undefined };
          return s;
        }))}
      </Box>

      <Divider />
      <Box sx={{ p: 1 }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: 'error.main', '&:hover': { bgcolor: 'error.light' } }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  const allNav = [...mainNav, ...opsNav, ...serviceNav];
  const currentLabel = allNav.find(n => n.path === location.pathname)?.label ?? title ?? 'Employee Portal';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && (
        <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', borderRight: '1px solid', borderColor: 'divider' } }}>
          {drawerContent}
        </Drawer>
      )}
      {isMobile && (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawerContent}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="sticky" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: 60 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isMobile && (
                <IconButton onClick={() => setMobileOpen(true)} edge="start" size="small"><MenuIcon /></IconButton>
              )}
              {isMobile ? (
                <BrandLogo variant="navbar" height={32} />
              ) : (
                <Typography variant="h6" color="text.primary" fontWeight={700}>{currentLabel}</Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {pendingKyc > 0 && <Chip label={`${pendingKyc} KYC`} size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />}
              <IconButton onClick={toggleMode} title="Toggle theme" size="small">
                {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
              </IconButton>
              <IconButton onClick={handleNotifOpen} size="small">
                <Badge badgeContent={unreadCount} color="error"><NotificationsIcon fontSize="small" /></Badge>
              </IconButton>
              <IconButton onClick={e => setAnchorEl(e.currentTarget)} size="small" sx={{ p: 0.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: '0.9rem', fontWeight: 700 }}>{user?.name.charAt(0).toUpperCase()}</Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={() => setNotifAnchor(null)} PaperProps={{ sx: { maxWidth: 360, maxHeight: 400 } }}>
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
          </Box>
          {notifications.length === 0 ? (
            <MenuItem disabled><Typography variant="body2">No notifications</Typography></MenuItem>
          ) : (
            [...notifications].reverse().slice(0, 10).map(n => (
              <MenuItem key={n.id} sx={{ whiteSpace: 'normal', py: 1.5, px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }}>{n.message}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(n.date).toLocaleString()}</Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => { navigate('/employee/profile'); setAnchorEl(null); }}>Profile</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>

        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
          {children}
        </Box>
        <AppFooter />
      </Box>

      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1e2130', color: '#fff', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography fontWeight={700} fontSize="1.1rem">Logout</Typography>
          <IconButton size="small" onClick={() => setLogoutOpen(false)} sx={{ color: 'grey.400' }}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography variant="body2" sx={{ color: 'grey.300' }}>Are you sure you want to sign out?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1, borderTop: '1px solid rgba(255,255,255,0.08)', pt: 2 }}>
          <Button variant="outlined" onClick={() => setLogoutOpen(false)} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: '#fff' } }}>Cancel</Button>
          <Button variant="contained" onClick={confirmLogout} sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}>Sign Out</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
