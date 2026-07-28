import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem,
  Divider, useMediaQuery, useTheme, Stack, Chip, Button, Badge,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ErrorIcon from '@mui/icons-material/Error';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import BrandLogo from './BrandLogo';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import PaymentsIcon from '@mui/icons-material/Payments';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CreditCardIconNav from '@mui/icons-material/CreditCard';
import BadgeIcon from '@mui/icons-material/Badge';
import SettingsIcon from '@mui/icons-material/Settings';
import ShieldIcon from '@mui/icons-material/Security';
import AuditIcon from '@mui/icons-material/Policy';
import PersonIcon from '@mui/icons-material/Person';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AppFooter from './AppFooter';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { getPendingAccountApprovals, getPendingTransactions, getUsers, getAdminAlerts } from '../utils/localStorageDB';
import { getAllTickets } from '../utils/ticketService';

const DRAWER_WIDTH = 256;

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
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

  const adminAlerts = getAdminAlerts();
  const alertIcon = (t: string) => t === 'error' ? <ErrorIcon fontSize="small" color="error" /> : t === 'warning' ? <WarningAmberIcon fontSize="small" color="warning" /> : <InfoIcon fontSize="small" color="info" />;

  const pendingApprovals = getPendingAccountApprovals();
  const pendingTxns = getPendingTransactions();
  const approvedUsers = getUsers().filter(u => u.role === 'user' && u.isApproved);
  const totalLoans = approvedUsers.filter(u => u.loanStatus === 'active').length;
  const openTickets = getAllTickets().filter(t => t.status === 'open' || t.status === 'in-progress').length;
  const pendingCardApplications = (() => { try { return (JSON.parse(localStorage.getItem('smart_cards_all') || '[]') as { status: string }[]).filter(c => c.status === 'pending').length; } catch { return 0; } })();
  const totalPending = pendingApprovals.length + pendingTxns.length;



  const handleLogout = () => {
    setLogoutOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setLogoutOpen(false);
    navigate('/login');
  };

  const renderNavGroup = (title: string, items: { path: string; icon: React.ReactNode; label: string; badge: number }[]) => (
    <>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1, px: 2, mb: 1, mt: 2, display: 'block', fontWeight: 600 }}>
        {title}
      </Typography>
      <List dense disablePadding sx={{ px: 1 }}>
        {items.map(item => {
          const isActive = item.path === '/admin' ? location.pathname === '/admin' : location.pathname === item.path;
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                  color: 'text.primary',
                  '&.Mui-selected': { color: 'primary.main', bgcolor: 'primary.light' },
                  '&.Mui-selected:hover': { bgcolor: 'primary.light' },
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 500 }} />
                {item.badge > 0 && (
                  <Box sx={{ bgcolor: 'error.main', color: 'white', borderRadius: 10, px: 0.75, py: 0.1, fontSize: '0.65rem', fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
                    {item.badge}
                  </Box>
                )}
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

      {user && (
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38, fontSize: '0.9rem', fontWeight: 700 }}>
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" color="text.primary" fontWeight={600} noWrap>{user.name}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }} noWrap>{user.email}</Typography>
            </Box>
          </Stack>
          <Chip
            icon={<ShieldIcon sx={{ fontSize: '0.75rem !important', color: '#93C5FD !important' }} />}
            label="Administrator"
            size="small"
            variant="outlined"
            sx={{ mt: 1.5, fontSize: '0.65rem', height: 20, color: '#93C5FD', borderColor: 'rgba(37,99,235,0.4)' }}
          />
        </Box>
      )}

      <Box sx={{ flex: 1, px: 1, py: 1, overflowY: 'auto' }}>
        {renderNavGroup('Main Menu', [
          { path: '/admin', icon: <DashboardIcon fontSize="small" />, label: 'Dashboard', badge: 0 },
          { path: '/admin/reports', icon: <AssessmentIcon fontSize="small" />, label: 'Reports', badge: 0 },
          { path: '/admin/audit', icon: <AuditIcon fontSize="small" />, label: 'Audit Logs', badge: 0 },
        ])}
        {renderNavGroup('Customer Management', [
          { path: '/admin/customers', icon: <PeopleIcon fontSize="small" />, label: 'All Customers', badge: 0 },
          { path: '/admin/approvals', icon: <HowToRegIcon fontSize="small" />, label: 'Pending Approvals', badge: pendingApprovals.length },
          { path: '/admin/employees', icon: <BadgeIcon fontSize="small" />, label: 'Employee Management', badge: 0 },
          { path: '/admin/support', icon: <SupportAgentIcon fontSize="small" />, label: 'Support Tickets', badge: openTickets },
        ])}
        {renderNavGroup('Banking Operations', [
          { path: '/admin/transactions', icon: <ReceiptLongIcon fontSize="small" />, label: 'Transactions', badge: 0 },
          { path: '/admin/loans', icon: <CreditScoreIcon fontSize="small" />, label: 'Loan Management', badge: totalLoans },
          { path: '/admin/deposits', icon: <PaymentsIcon fontSize="small" />, label: 'Deposit Requests', badge: pendingTxns.length },
          { path: '/admin/cards', icon: <CreditCardIconNav fontSize="small" />, label: 'Card Management', badge: pendingCardApplications },
        ])}
        {renderNavGroup('System', [
          { path: '/admin/settings', icon: <SettingsIcon fontSize="small" />, label: 'Settings', badge: 0 },
          { path: '/admin/profile', icon: <PersonIcon fontSize="small" />, label: 'My Profile', badge: 0 },
        ])}
      </Box>

      {totalPending > 0 && (
        <Box sx={{ mx: 2, mb: 1.5, p: 1.5, bgcolor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" sx={{ color: '#FBBF24', fontSize: '0.75rem' }}>
              {totalPending} item{totalPending !== 1 ? 's' : ''} need attention
            </Typography>
            <Box sx={{ bgcolor: '#F59E0B', color: 'white', borderRadius: 10, px: 0.75, fontSize: '0.65rem', fontWeight: 700 }}>
              {totalPending}
            </Box>
          </Stack>
        </Box>
      )}

      <Box sx={{ px: 1.5, pb: 1.5, borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: 2, color: 'error.main', '&:hover': { bgcolor: 'error.light' } }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
      {isMobile && (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawerContent}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="sticky" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: 60 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {isMobile && (
                <IconButton onClick={() => setMobileOpen(true)} edge="start" size="small"><MenuIcon /></IconButton>
              )}
              {isMobile ? (
                <BrandLogo variant="navbar" height={32} />
              ) : (
                <Box>
                  <Typography variant="subtitle1" color="text.primary" fontWeight={700} lineHeight={1.2}>
                    {title ?? 'Admin Dashboard'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                </Box>
              )}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.25}>
              {totalPending > 0 && (
                <Chip
                  label={`${totalPending} pending`}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
              <IconButton onClick={toggleMode} title="Toggle theme" size="small">
                {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
              </IconButton>
              <IconButton onClick={e => setNotifAnchor(e.currentTarget)} size="small" title="Alerts">
                <Badge badgeContent={adminAlerts.length} color="error">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
              <Chip
                label="Admin"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
              />
              <IconButton size="small" onClick={e => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.85rem', fontWeight: 700 }}>
                  {user?.name.charAt(0).toUpperCase()}
                </Avatar>
                <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary', ml: 0.25 }} />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={() => setNotifAnchor(null)}
          PaperProps={{ sx: { mt: 1, maxWidth: 380, maxHeight: 420 } }}>
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={700}>System Alerts</Typography>
            <Typography variant="caption" color="text.secondary">
              {adminAlerts.length > 0 ? `${adminAlerts.length} item${adminAlerts.length !== 1 ? 's' : ''} need attention` : 'All caught up'}
            </Typography>
          </Box>
          {adminAlerts.length === 0 ? (
            <MenuItem disabled><Typography variant="body2">No alerts right now</Typography></MenuItem>
          ) : (
            adminAlerts.map(a => (
              <MenuItem
                key={a.id}
                onClick={() => { setNotifAnchor(null); navigate(a.path); }}
                sx={{ whiteSpace: 'normal', py: 1.25, px: 2, gap: 1.25, borderBottom: '1px solid', borderColor: 'divider', alignItems: 'flex-start' }}
              >
                <Box sx={{ mt: 0.25 }}>{alertIcon(a.type)}</Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{a.message}</Typography>
              </MenuItem>
            ))
          )}
        </Menu>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { mt: 1, minWidth: 180 } }}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" fontWeight={600}>{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main', gap: 1 }}>
            <LogoutIcon fontSize="small" /> Sign Out
          </MenuItem>
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
