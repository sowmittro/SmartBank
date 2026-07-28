import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem, Badge,
  Divider, useMediaQuery, useTheme, Chip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import BrandLogo from './BrandLogo';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SavingsIcon from '@mui/icons-material/Savings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AppFooter from './AppFooter';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { getNotificationsByAccount, markAllNotificationsRead } from '../utils/localStorageDB';

const DRAWER_WIDTH = 256;

const mainNavItems = [
  { path: '/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
  { path: '/transactions', icon: <ReceiptLongIcon />, label: 'Transactions' },
  { path: '/transfer', icon: <SwapHorizIcon />, label: 'Transfer' },
];

const bankingNavItems = [
  { path: '/cards', icon: <CreditCardIcon />, label: 'Cards' },
  { path: '/pay-bills', icon: <ReceiptLongIcon />, label: 'Pay Bills' },
  { path: '/fixed-deposit', icon: <SavingsIcon />, label: 'Fixed Deposit' },
  { path: '/loans', icon: <AccountBalanceWalletIcon />, label: 'Loans' },
];

const serviceNavItems = [
  { path: '/support', icon: <SupportAgentIcon />, label: 'Support' },
  { path: '/profile', icon: <PersonIcon />, label: 'Profile & Settings' },
];

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
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

  const handleLogout = () => {
    setLogoutOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setLogoutOpen(false);
    navigate('/login');
  };

  const handleNotifOpen = (e: React.MouseEvent<HTMLElement>) => {
    if (user) markAllNotificationsRead(user.accountNumber);
    setNotifAnchor(e.currentTarget);
  };

  const renderNavSection = (title: string, items: typeof mainNavItems) => (
    <>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1, px: 2, py: 1, display: 'block', fontWeight: 600 }}>
        {title}
      </Typography>
      <List sx={{ px: 1, py: 0 }}>
        {items.map(item => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
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
            </ListItemButton>
          </ListItem>
        ))}
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
            <Avatar src={user.profilePhoto} sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 700 }}>
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" color="text.primary" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 160 }}>
                {user.accountNumber}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={user.isActive ? 'Active' : 'Frozen'}
            size="small"
            color={user.isActive ? 'success' : 'error'}
            variant="outlined"
            sx={{ mt: 1.5, fontSize: '0.7rem' }}
          />
        </Box>
      )}

      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {renderNavSection('Main', mainNavItems)}
        {renderNavSection('Banking', bankingNavItems)}
        {renderNavSection('Services', serviceNavItems)}
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && (
        <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', borderRight: '1px solid', borderColor: 'divider' } }}>
          {drawerContent}
        </Drawer>
      )}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="sticky" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: 60 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isMobile && (
                <IconButton onClick={() => setMobileOpen(true)} edge="start" size="small">
                  <MenuIcon />
                </IconButton>
              )}
              {isMobile ? (
                <BrandLogo variant="navbar" height={32} />
              ) : (
                <Typography variant="h6" color="text.primary" fontWeight={700}>
                  {[...mainNavItems, ...bankingNavItems, ...serviceNavItems].find(n => n.path === location.pathname)?.label ?? 'Smart Bank'}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <IconButton onClick={toggleMode} title="Toggle theme" size="small">
                {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
              </IconButton>
              <IconButton onClick={handleNotifOpen} size="small">
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
              <IconButton onClick={e => setAnchorEl(e.currentTarget)} size="small" sx={{ p: 0.5 }}>
                <Avatar src={user?.profilePhoto} sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: '0.9rem', fontWeight: 700 }}>
                  {user?.name.charAt(0).toUpperCase()}
                </Avatar>
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
          <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>Profile & Settings</MenuItem>
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
