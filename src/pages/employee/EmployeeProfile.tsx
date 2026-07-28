import { useState, useRef } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Stack, TextField, Typography, Alert, Avatar, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import BadgeIcon from '@mui/icons-material/Badge';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import EmployeeLayout from '../../components/EmployeeLayout';
import { useAuth } from '../../context/AuthContext';
import { updateUser } from '../../utils/localStorageDB';
import { validatePassword, validateMobile } from '../../utils/validators';
import { useToast } from '../../context/ToastContext';

export default function EmployeeProfile() {
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [profileError, setProfileError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setProfileError('Photo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const savePhoto = () => {
    if (photoPreview) {
      updateUser(user.id, { profilePhoto: photoPreview });
      refreshUser();
      toast.showSuccess('Profile photo updated!');
    }
    setPhotoDialogOpen(false);
    setPhotoPreview(null);
  };

  const removePhoto = () => {
    updateUser(user.id, { profilePhoto: undefined });
    refreshUser();
    toast.showSuccess('Profile photo removed.');
  };

  const handleProfileSave = () => {
    setProfileError('');
    const mobileErr = validateMobile(mobile);
    if (mobileErr) { setProfileError(mobileErr); return; }
    if (!name.trim()) { setProfileError('Name is required'); return; }
    updateUser(user.id, { name, mobile, address });
    refreshUser();
    toast.showSuccess('Profile updated!');
  };

  const handlePasswordChange = () => {
    setPasswordError('');
    if (oldPassword !== user.password) { setPasswordError('Current password is incorrect'); return; }
    const err = validatePassword(newPassword);
    if (err) { setPasswordError(err); return; }
    if (newPassword !== confirmNewPassword) { setPasswordError('Passwords do not match'); return; }
    updateUser(user.id, { password: newPassword });
    refreshUser();
    setOldPassword(''); setNewPassword(''); setConfirmNewPassword('');
    toast.showSuccess('Password changed!');
  };

  const avatar = user.profilePhoto
    ? <Avatar src={user.profilePhoto} sx={{ width: 80, height: 80, border: '3px solid', borderColor: 'primary.light', mx: 'auto', mb: 2 }} />
    : <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem', fontWeight: 700, mx: 'auto', mb: 2 }}>{user.name.charAt(0).toUpperCase()}</Avatar>;

  return (
    <EmployeeLayout title="Profile">
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>My Profile</Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                {avatar}
                <Typography variant="h6" fontWeight={700}>{user.name}</Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>{user.email}</Typography>
                <Stack direction="row" spacing={1} justifyContent="center" mb={2}>
                  <Chip label={user.designation ?? 'Employee'} color="primary" size="small" />
                  <Chip label={user.branch ?? 'Main Branch'} variant="outlined" size="small" />
                </Stack>
                <Chip icon={<BadgeIcon sx={{ fontSize: '0.75rem !important' }} />} label={user.employeeId ?? 'EMP'} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.7rem' }} />
                <Stack direction="row" spacing={1} justifyContent="center" mt={2}>
                  <Button variant="outlined" size="small" startIcon={<PhotoCameraIcon />} onClick={() => { setPhotoPreview(null); setPhotoDialogOpen(true); }}>
                    {user.profilePhoto ? 'Change' : 'Upload'}
                  </Button>
                  {user.profilePhoto && (
                    <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />} onClick={removePhoto}>
                      Remove
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <AccountCircleIcon color="primary" fontSize="small" />
                    <Typography variant="h6" fontWeight={700}>Employee Details</Typography>
                  </Stack>
                  <Grid container spacing={2}>
                    {[
                      { label: 'Employee ID', value: user.employeeId ?? 'N/A' },
                      { label: 'Designation', value: user.designation ?? 'N/A' },
                      { label: 'Branch', value: user.branch ?? 'N/A' },
                      { label: 'Account Number', value: user.accountNumber },
                      { label: 'Mobile', value: user.mobile },
                      { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString() },
                    ].map(item => (
                      <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" display="block">{item.label}</Typography>
                          <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <PersonIcon color="primary" fontSize="small" />
                    <Typography variant="h6" fontWeight={700}>Edit Profile</Typography>
                  </Stack>
                  {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Full Name" value={name} onChange={e => setName(e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="01XXXXXXXXX" />
                    </Grid>
                    <Grid size={12}>
                      <TextField fullWidth label="Address" value={address} onChange={e => setAddress(e.target.value)} multiline rows={2} />
                    </Grid>
                  </Grid>
                  <Button variant="contained" sx={{ mt: 2 }} onClick={handleProfileSave}>Save Changes</Button>
                </CardContent>
              </Card>

              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                    <LockIcon color="primary" fontSize="small" />
                    <Typography variant="h6" fontWeight={700}>Change Password</Typography>
                  </Stack>
                  {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
                  <Stack spacing={2}>
                    <TextField fullWidth label="Current Password" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                    <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} helperText="At least 6 characters" />
                    <TextField fullWidth label="Confirm New Password" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
                  </Stack>
                  <Button variant="contained" sx={{ mt: 2 }} onClick={handlePasswordChange}>Change Password</Button>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Profile Photo</DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={2}>
            <Avatar
              src={photoPreview ?? user.profilePhoto}
              sx={{ width: 100, height: 100, mx: 'auto', mb: 2, border: '3px solid', borderColor: 'primary.light', fontSize: '2rem', fontWeight: 700 }}
            >
              {!photoPreview && !user.profilePhoto && user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Button variant="outlined" startIcon={<PhotoCameraIcon />} onClick={() => fileInputRef.current?.click()} sx={{ mb: 1 }}>
              Select Photo
            </Button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" hidden onChange={handlePhotoSelect} />
            <Typography variant="caption" color="text.secondary" display="block">JPG or PNG, max 2MB</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setPhotoDialogOpen(false)} fullWidth>Cancel</Button>
          <Button variant="contained" onClick={savePhoto} fullWidth disabled={!photoPreview}>Save Photo</Button>
        </DialogActions>
      </Dialog>
    </EmployeeLayout>
  );
}
