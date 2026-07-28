import { useState, useRef } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Stack, TextField,
  Typography, Alert, Avatar, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Tab, Tabs,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import BadgeIcon from '@mui/icons-material/Badge';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CustomerLayout from '../components/CustomerLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateUser } from '../utils/localStorageDB';
import { validatePassword, validatePin, validateMobile } from '../utils/validators';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [name, setName] = useState(user?.name ?? '');
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [profileError, setProfileError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [nomOpen, setNomOpen] = useState(false);
  const [nomForm, setNomForm] = useState({
    name: user?.nominee?.name ?? '',
    relationship: user?.nominee?.relationship ?? '',
    mobile: user?.nominee?.mobile ?? '',
    address: user?.nominee?.address ?? '',
  });
  const [nomErrors, setNomErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

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

  const handlePinChange = () => {
    setPinError('');
    if (currentPin !== user.pin) { setPinError('Current PIN is incorrect'); return; }
    const err = validatePin(newPin);
    if (err) { setPinError(err); return; }
    if (newPin !== confirmNewPin) { setPinError('PINs do not match'); return; }
    updateUser(user.id, { pin: newPin });
    refreshUser();
    setCurrentPin(''); setNewPin(''); setConfirmNewPin('');
    toast.showSuccess('PIN changed!');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setProfileError('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
    };
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
    setPhotoDialogOpen(false);
    setPhotoPreview(null);
  };

  const saveNominee = () => {
    const errs: Record<string, string> = {};
    if (!nomForm.name.trim()) errs.name = 'Nominee name is required';
    if (!nomForm.relationship.trim()) errs.relationship = 'Relationship is required';
    if (!/^01\d{9}$/.test(nomForm.mobile)) errs.mobile = 'Enter a valid mobile number (01XXXXXXXXX)';
    if (!nomForm.address.trim()) errs.address = 'Address is required';
    setNomErrors(errs);
    if (Object.keys(errs).length > 0) return;

    updateUser(user.id, {
      nominee: {
        name: nomForm.name.trim(),
        relationship: nomForm.relationship.trim(),
        mobile: nomForm.mobile.trim(),
        address: nomForm.address.trim(),
        addedAt: user.nominee?.addedAt ?? new Date().toISOString(),
      },
    });
    refreshUser();
    setNomOpen(false);
    toast.showSuccess('Nominee information updated!');
  };

  const avatar = user.profilePhoto
    ? <Avatar src={user.profilePhoto} sx={{ width: 96, height: 96, border: '3px solid', borderColor: 'primary.light' }} />
    : <Avatar sx={{ width: 96, height: 96, bgcolor: 'primary.main', fontSize: '2.5rem', fontWeight: 700 }}>{user.name.charAt(0).toUpperCase()}</Avatar>;

  return (
    <CustomerLayout>
      <Box>
        {/* Profile Header */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                {avatar}
                <IconButton
                  size="small"
                  onClick={() => { setPhotoPreview(null); setPhotoDialogOpen(true); }}
                  sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                >
                  <PhotoCameraIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
              <Box flex={1}>
                <Typography variant="h5" fontWeight={700}>{user.name}</Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>{user.email}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  <Chip label={user.kycStatus === 'verified' ? 'Verified' : user.kycStatus === 'pending' ? 'KYC Pending' : 'Not Verified'} color={user.kycStatus === 'verified' ? 'success' : 'warning'} size="small" icon={<VerifiedUserIcon sx={{ fontSize: 16 }} />} />
                  <Chip label={user.accountType} color="primary" size="small" variant="outlined" />
                  <Chip label={user.isActive ? 'Active' : 'Frozen'} color={user.isActive ? 'success' : 'error'} size="small" variant="outlined" />
                </Stack>
              </Box>
              <Box sx={{ textAlign: { sm: 'right' } }}>
                <Typography variant="caption" color="text.secondary">Current Balance</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.dark">৳{user.balance.toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary" fontFamily="monospace">{user.accountNumber}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Personal Info" />
          <Tab label="KYC & Nominee" />
          <Tab label="Settings" />
        </Tabs>

        {/* Tab 0: Personal Info */}
        {tab === 0 && (
          <Stack spacing={3}>
            {/* Personal Information */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <AccountCircleIcon color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={700}>Personal Information</Typography>
                </Stack>
                <Grid container spacing={2}>
                  {[
                    { label: 'Full Name', value: user.name },
                    { label: "Father's Name", value: user.fatherName || 'N/A' },
                    { label: "Mother's Name", value: user.motherName || 'N/A' },
                    { label: 'Date of Birth', value: user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A' },
                    { label: 'Gender', value: user.gender },
                    { label: 'NID Number', value: user.nidNumber },
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

            {/* Contact Information */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <PersonIcon color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={700}>Contact Information</Typography>
                </Stack>
                <Grid container spacing={2}>
                  {[
                    { label: 'Email', value: user.email },
                    { label: 'Mobile', value: user.mobile },
                    { label: 'Address', value: user.address || 'N/A' },
                    { label: 'Account Number', value: user.accountNumber },
                    { label: 'Account Type', value: user.accountType },
                    { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString() },
                  ].map(item => (
                    <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block">{item.label}</Typography>
                        <Typography variant="body2" fontWeight={600} noWrap={item.label === 'Email'}>{item.value}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Edit Profile Details */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <PersonIcon color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={700}>Edit Profile Details</Typography>
                </Stack>
                {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Full Name" value={name} onChange={e => setName(e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} />
                  </Grid>
                  <Grid size={12}>
                    <TextField fullWidth label="Address" value={address} onChange={e => setAddress(e.target.value)} multiline rows={2} />
                  </Grid>
                </Grid>
                <Button variant="contained" sx={{ mt: 2 }} onClick={handleProfileSave}>Save Changes</Button>
              </CardContent>
            </Card>
          </Stack>
        )}

        {/* Tab 1: KYC & Nominee */}
        {tab === 1 && (
          <Stack spacing={3}>
            {/* KYC Status */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <VerifiedUserIcon color="primary" fontSize="small" />
                    <Typography variant="h6" fontWeight={700}>KYC Status</Typography>
                  </Stack>
                  <Chip
                    label={user.kycStatus === 'verified' ? 'Verified' : user.kycStatus === 'pending' ? 'Pending Review' : user.kycStatus === 'rejected' ? 'Rejected' : 'Not Submitted'}
                    color={user.kycStatus === 'verified' ? 'success' : user.kycStatus === 'rejected' ? 'error' : 'warning'}
                  />
                </Stack>
                {user.kycData ? (
                  <Grid container spacing={2}>
                    {[
                      { label: 'NID / Passport', value: user.kycData.nidPassport },
                      { label: 'Occupation', value: user.kycData.occupation },
                      { label: 'Source of Income', value: user.kycData.sourceOfIncome },
                      { label: 'Monthly Income', value: `৳${user.kycData.monthlyIncome.toLocaleString()}` },
                      { label: 'Present Address', value: user.kycData.presentAddress, full: true },
                      { label: 'Permanent Address', value: user.kycData.permanentAddress, full: true },
                      { label: 'Submitted On', value: new Date(user.kycData.submittedAt).toLocaleDateString() },
                      ...(user.kycVerifiedAt ? [{ label: 'Verified On', value: new Date(user.kycVerifiedAt).toLocaleDateString() }] : []),
                    ].map(item => (
                      <Grid key={item.label} size={{ xs: 12, sm: 6, md: item.full ? 12 : 4 }}>
                        <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" display="block">{item.label}</Typography>
                          <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="info">
                    KYC information not yet submitted. Please complete your <a href="/verification" style={{ fontWeight: 600 }}>account verification</a>.
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Nominee Information */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PersonAddIcon color="primary" fontSize="small" />
                    <Typography variant="h6" fontWeight={700}>Nominee Information</Typography>
                  </Stack>
                  {user.nominee && (
                    <Button variant="outlined" size="small" startIcon={<PersonIcon />} onClick={() => { setNomForm({ name: user.nominee!.name, relationship: user.nominee!.relationship, mobile: user.nominee!.mobile, address: user.nominee!.address }); setNomErrors({}); setNomOpen(true); }}>
                      Edit
                    </Button>
                  )}
                </Stack>
                {user.nominee ? (
                  <Grid container spacing={2}>
                    {[
                      { label: 'Nominee Name', value: user.nominee.name },
                      { label: 'Relationship', value: user.nominee.relationship },
                      { label: 'Mobile Number', value: user.nominee.mobile },
                      { label: 'Address', value: user.nominee.address, full: true },
                    ].map(item => (
                      <Grid key={item.label} size={{ xs: 12, sm: 6, md: item.full ? 12 : 4 }}>
                        <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" display="block">{item.label}</Typography>
                          <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="info">
                    No nominee added yet. Please complete your <a href="/verification" style={{ fontWeight: 600 }}>account verification</a> to add a nominee.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Stack>
        )}

        {/* Tab 2: Settings */}
        {tab === 2 && (
          <Stack spacing={3}>
            {/* Profile Photo */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <PhotoCameraIcon color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={700}>Profile Photo</Typography>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                  {avatar}
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Upload a profile photo (JPG/PNG, max 2MB). This will be shown in your dashboard and navigation.
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" size="small" startIcon={<PhotoCameraIcon />} onClick={() => { setPhotoPreview(null); setPhotoDialogOpen(true); }}>
                        {user.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                      {user.profilePhoto && (
                        <Button variant="outlined" size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={removePhoto}>
                          Remove
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card sx={{ borderRadius: 3 }}>
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

            {/* Change PIN */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <BadgeIcon color="secondary" fontSize="small" />
                  <Typography variant="h6" fontWeight={700}>Change PIN</Typography>
                </Stack>
                {pinError && <Alert severity="error" sx={{ mb: 2 }}>{pinError}</Alert>}
                <Stack spacing={2}>
                  <TextField fullWidth label="Current PIN" type="password" value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputProps={{ inputMode: 'numeric' }} />
                  <TextField fullWidth label="New PIN" type="password" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))} helperText="4 or 6 digits" inputProps={{ inputMode: 'numeric' }} />
                  <TextField fullWidth label="Confirm New PIN" type="password" value={confirmNewPin} onChange={e => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputProps={{ inputMode: 'numeric' }} />
                </Stack>
                <Button variant="contained" color="secondary" sx={{ mt: 2 }} onClick={handlePinChange}>Change PIN</Button>
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Profile Photo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Avatar
              src={photoPreview ?? undefined}
              sx={{ width: 120, height: 120, bgcolor: 'primary.main', fontSize: '3rem', fontWeight: 700, border: '3px solid', borderColor: 'primary.light' }}
            >
              {!photoPreview && user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Button variant="outlined" startIcon={<PhotoCameraIcon />} onClick={() => fileInputRef.current?.click()}>
              Select Image
            </Button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" hidden onChange={handlePhotoSelect} />
            <Typography variant="caption" color="text.secondary">JPG or PNG, max 2MB</Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setPhotoDialogOpen(false)} fullWidth>Cancel</Button>
          <Button variant="contained" onClick={savePhoto} fullWidth disabled={!photoPreview}>Save Photo</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Nominee Dialog */}
      <Dialog open={nomOpen} onClose={() => setNomOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Nominee Information</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Nominee Full Name" value={nomForm.name} onChange={e => { setNomForm(f => ({ ...f, name: e.target.value })); setNomErrors(p => ({ ...p, name: '' })); }} error={!!nomErrors.name} helperText={nomErrors.name} />
            <TextField fullWidth label="Relationship with Customer" value={nomForm.relationship} onChange={e => { setNomForm(f => ({ ...f, relationship: e.target.value })); setNomErrors(p => ({ ...p, relationship: '' })); }} error={!!nomErrors.relationship} helperText={nomErrors.relationship} />
            <TextField fullWidth label="Mobile Number" value={nomForm.mobile} onChange={e => { setNomForm(f => ({ ...f, mobile: e.target.value })); setNomErrors(p => ({ ...p, mobile: '' })); }} error={!!nomErrors.mobile} helperText={nomErrors.mobile} placeholder="01XXXXXXXXX" inputProps={{ inputMode: 'numeric' }} />
            <TextField fullWidth label="Address" value={nomForm.address} onChange={e => { setNomForm(f => ({ ...f, address: e.target.value })); setNomErrors(p => ({ ...p, address: '' })); }} error={!!nomErrors.address} helperText={nomErrors.address} multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setNomOpen(false)} fullWidth>Cancel</Button>
          <Button variant="contained" onClick={saveNominee} fullWidth>Save Nominee</Button>
        </DialogActions>
      </Dialog>
    </CustomerLayout>
  );
}
