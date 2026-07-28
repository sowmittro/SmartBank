import { useState, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Grid, TextField, Button,
  Divider, Alert, Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  Paper, Chip, IconButton,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedIcon from '@mui/icons-material/Verified';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateUser, getUsers } from '../utils/localStorageDB';
import { validateEmail, validateMobile, validatePassword } from '../utils/validators';

export default function AdminProfile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    mobile: user?.mobile ?? '',
  });

  const handleSave = () => {
    const errs: string[] = [];
    if (!form.name.trim()) errs.push('Name is required');
    const emailErr = validateEmail(form.email); if (emailErr) errs.push(emailErr);
    if (form.mobile) { const mobileErr = validateMobile(form.mobile); if (mobileErr) errs.push(mobileErr); }
    if (errs.length > 0) { setError(errs.join('. ')); return; }

    if (getUsers().some(u => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== user?.id)) {
      setError('Email already in use');
      return;
    }

    setError('');
    if (user) {
      updateUser(user.id, { name: form.name, email: form.email, mobile: form.mobile });
      refreshUser();
    }
    setEditMode(false);
    toast.showSuccess('Profile updated successfully!');
  };

  const handlePasswordChange = () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setPasswordError('All fields are required');
      return;
    }
    if (!user || user.password !== passwordData.current) {
      setPasswordError('Current password is incorrect');
      return;
    }
    const pwErr = validatePassword(passwordData.new);
    if (pwErr) {
      setPasswordError(pwErr);
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (user) {
      updateUser(user.id, { password: passwordData.new });
    }
    setPasswordOpen(false);
    setPasswordData({ current: '', new: '', confirm: '' });
    setPasswordError('');
    toast.showSuccess('Password changed successfully!');
  };

  return (
    <AdminLayout title="My Profile">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>My Profile</Typography>
            <Typography variant="body2" color="text.secondary">Manage your administrator account settings</Typography>
          </Box>
          {!editMode && (
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditMode(true)}>Edit Profile</Button>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', textAlign: 'center', p: 3 }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'primary.main',
                    fontSize: '3rem',
                    fontWeight: 700,
                    mx: 'auto',
                  }}
                >
                  {user?.name.charAt(0).toUpperCase()}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
                <input type="file" ref={fileInputRef} hidden accept="image/*" />
              </Box>
              <Typography variant="h6" fontWeight={700}>{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary" mb={1.5}>{user?.email}</Typography>
              <Chip
                icon={<AdminPanelSettingsIcon sx={{ fontSize: '0.75rem !important' }} />}
                label="Administrator"
                color="primary"
                variant="outlined"
                size="small"
              />
              <Divider sx={{ my: 2.5 }} />
              <Stack spacing={1.5}>
                <Paper sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Account Number</Typography>
                  <Typography variant="body2" fontWeight={600} fontFamily="monospace">{user?.accountNumber}</Typography>
                </Paper>
                <Paper sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Member Since</Typography>
                  <Typography variant="body2" fontWeight={600}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</Typography>
                </Paper>
                <Paper sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    <Chip icon={<VerifiedIcon sx={{ fontSize: '0.65rem !important' }} />} label="Verified" color="success" size="small" />
                  </Typography>
                </Paper>
              </Stack>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<LockIcon />}
                fullWidth
                sx={{ mt: 2.5 }}
                onClick={() => setPasswordOpen(true)}
              >
                Change Password
              </Button>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={3}>Account Information</Typography>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      disabled={!editMode}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      disabled={!editMode}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Mobile Number"
                      value={form.mobile}
                      onChange={e => setForm({ ...form, mobile: e.target.value })}
                      disabled={!editMode}
                      placeholder="01XXXXXXXXX"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Role"
                      value="Administrator"
                      disabled
                    />
                  </Grid>
                </Grid>
                {editMode && (
                  <Stack direction="row" justifyContent="flex-end" spacing={1.5} mt={3}>
                    <Button variant="outlined" onClick={() => {
                      setForm({ name: user?.name ?? '', email: user?.email ?? '', mobile: user?.mobile ?? '' });
                      setEditMode(false);
                      setError('');
                    }}>Cancel</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>Save Changes</Button>
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', mt: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Security Activity</Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  {[
                    { action: 'Last login', time: 'Today at 10:30 AM', status: 'success' },
                    { action: 'Password changed', time: '30 days ago', status: 'info' },
                    { action: 'Profile updated', time: '7 days ago', status: 'info' },
                  ].map((item, i) => (
                    <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, px: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2">{item.action}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">{item.time}</Typography>
                        <Chip label={item.status} size="small" color={item.status as 'success' | 'info'} sx={{ fontSize: '0.65rem', height: 18 }} />
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={passwordOpen} onClose={() => { setPasswordOpen(false); setPasswordError(''); setPasswordData({ current: '', new: '', confirm: '' }); }} maxWidth="xs" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {passwordError && <Alert severity="error">{passwordError}</Alert>}
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={passwordData.current}
              onChange={e => { setPasswordData({ ...passwordData, current: e.target.value }); setPasswordError(''); }}
              autoFocus
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwordData.new}
              onChange={e => { setPasswordData({ ...passwordData, new: e.target.value }); setPasswordError(''); }}
              helperText="At least 6 characters"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={passwordData.confirm}
              onChange={e => { setPasswordData({ ...passwordData, confirm: e.target.value }); setPasswordError(''); }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => { setPasswordOpen(false); setPasswordError(''); setPasswordData({ current: '', new: '', confirm: '' }); }} fullWidth>Cancel</Button>
          <Button variant="contained" color="warning" startIcon={<LockIcon />} onClick={handlePasswordChange} fullWidth>Change Password</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
