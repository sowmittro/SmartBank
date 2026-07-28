import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Grid, TextField, Button,
  Divider, Switch, MenuItem, Select,
  FormControl, InputLabel, Paper, Chip, Tab, Tabs,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import BankIcon from '@mui/icons-material/AccountBalance';
import LanguageIcon from '@mui/icons-material/Language';
import PaletteIcon from '@mui/icons-material/Palette';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AdminLayout from '../components/AdminLayout';
import { useThemeMode } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface SettingsPanelProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SettingsPanel({ title, icon, children }: SettingsPanelProps) {
  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <Box sx={{ bgcolor: 'primary.50', borderRadius: 1.5, p: 1, color: 'primary.main', display: 'flex' }}>
            {icon}
          </Box>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

export default function AdminSettings() {
  const { mode, setMode } = useThemeMode();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [bankInfo, setBankInfo] = useState({
    name: 'Smart Bank',
    swiftCode: 'SMARTBBDH',
    routingNumber: '123456789',
    address: 'Gulshan Avenue, Dhaka 1212, Bangladesh',
    phone: '+880 1-800-123-4567',
    email: 'contact@smartbank.com',
    website: 'https://smartbank.com',
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    currency: 'BDT',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Asia/Dhaka',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    largeTransactions: true,
    newRegistrations: true,
    loanApprovals: true,
    suspiciousActivity: true,
    systemAlerts: true,
  });

  const handleSaveBankInfo = () => {
    toast.showSuccess('Bank information saved successfully!');
  };

  const handleSavePreferences = () => {
    toast.showSuccess('Preferences saved successfully!');
  };

  const handleSaveNotifications = () => {
    toast.showSuccess('Notification preferences saved!');
  };

  return (
    <AdminLayout title="System Settings">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>System Settings</Typography>
            <Typography variant="body2" color="text.secondary">Configure bank information, preferences, and system options</Typography>
          </Box>
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab icon={<BankIcon fontSize="small" />} iconPosition="start" label="Bank Info" />
          <Tab icon={<PaletteIcon fontSize="small" />} iconPosition="start" label="Appearance" />
          <Tab icon={<LanguageIcon fontSize="small" />} iconPosition="start" label="Localization" />
          <Tab icon={<NotificationsIcon fontSize="small" />} iconPosition="start" label="Notifications" />
        </Tabs>

        {tab === 0 && (
          <Box>
            <SettingsPanel title="Bank Information" icon={<BankIcon />}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Bank Name"
                    value={bankInfo.name}
                    onChange={e => setBankInfo({ ...bankInfo, name: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="SWIFT Code"
                    value={bankInfo.swiftCode}
                    onChange={e => setBankInfo({ ...bankInfo, swiftCode: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Routing Number"
                    value={bankInfo.routingNumber}
                    onChange={e => setBankInfo({ ...bankInfo, routingNumber: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Contact Phone"
                    value={bankInfo.phone}
                    onChange={e => setBankInfo({ ...bankInfo, phone: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Contact Email"
                    value={bankInfo.email}
                    onChange={e => setBankInfo({ ...bankInfo, email: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={bankInfo.website}
                    onChange={e => setBankInfo({ ...bankInfo, website: e.target.value })}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    rows={2}
                    value={bankInfo.address}
                    onChange={e => setBankInfo({ ...bankInfo, address: e.target.value })}
                  />
                </Grid>
              </Grid>
              <Stack direction="row" justifyContent="flex-end" mt={3}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveBankInfo}>Save Changes</Button>
              </Stack>
            </SettingsPanel>
          </Box>
        )}

        {tab === 1 && (
          <SettingsPanel title="Appearance Settings" icon={<PaletteIcon />}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Theme Mode</Typography>
                <Stack direction="row" spacing={1.5}>
                  <Paper
                    sx={{
                      p: 2,
                      flex: 1,
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: mode === 'light' ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      '&:hover': { borderColor: 'primary.light' },
                    }}
                    onClick={() => setMode('light')}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <Box sx={{ width: 48, height: 32, bgcolor: 'grey.100', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }} />
                      <Typography variant="body2" fontWeight={600}>Light</Typography>
                    </Stack>
                  </Paper>
                  <Paper
                    sx={{
                      p: 2,
                      flex: 1,
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: mode === 'dark' ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      '&:hover': { borderColor: 'primary.light' },
                    }}
                    onClick={() => setMode('dark')}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <Box sx={{ width: 48, height: 32, bgcolor: 'grey.900', borderRadius: 1, border: '1px solid', borderColor: 'grey.700' }} />
                      <Typography variant="body2" fontWeight={600}>Dark</Typography>
                    </Stack>
                  </Paper>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Preview</Typography>
                <Paper sx={{ p: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h6" fontWeight={700}>Sample Heading</Typography>
                    <Typography variant="body2" color="text.secondary">This is how text will appear in the selected theme mode.</Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip label="Primary" color="primary" size="small" />
                      <Chip label="Success" color="success" size="small" />
                      <Chip label="Warning" color="warning" size="small" />
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </SettingsPanel>
        )}

        {tab === 2 && (
          <SettingsPanel title="Localization Settings" icon={<LanguageIcon />}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={preferences.language}
                    label="Language"
                    onChange={e => setPreferences({ ...preferences, language: e.target.value })}
                  >
                    <MenuItem value="en">English (US)</MenuItem>
                    <MenuItem value="bn">Bangla</MenuItem>
                    <MenuItem value="ar">Arabic</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={preferences.currency}
                    label="Currency"
                    onChange={e => setPreferences({ ...preferences, currency: e.target.value })}
                  >
                    <MenuItem value="BDT">BDT - Bangladeshi Taka</MenuItem>
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="EUR">EUR - Euro</MenuItem>
                    <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    <MenuItem value="INR">INR - Indian Rupee</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={preferences.dateFormat}
                    label="Date Format"
                    onChange={e => setPreferences({ ...preferences, dateFormat: e.target.value })}
                  >
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={preferences.timezone}
                    label="Timezone"
                    onChange={e => setPreferences({ ...preferences, timezone: e.target.value })}
                  >
                    <MenuItem value="Asia/Dhaka">Asia/Dhaka (GMT+6)</MenuItem>
                    <MenuItem value="UTC">UTC (GMT+0)</MenuItem>
                    <MenuItem value="America/New_York">America/New York (GMT-5)</MenuItem>
                    <MenuItem value="Europe/London">Europe/London (GMT+0/+1)</MenuItem>
                    <MenuItem value="Asia/Dubai">Asia/Dubai (GMT+4)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Stack direction="row" justifyContent="flex-end" mt={3}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSavePreferences}>Save Preferences</Button>
            </Stack>
          </SettingsPanel>
        )}

        {tab === 3 && (
          <SettingsPanel title="Notification Preferences" icon={<NotificationsIcon />}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Choose which events trigger email notifications to administrators.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {[
                { key: 'largeTransactions', label: 'Large Transactions', desc: 'Notify when transactions exceed threshold' },
                { key: 'newRegistrations', label: 'New Registrations', desc: 'Notify when new customers register' },
                { key: 'loanApprovals', label: 'Loan Requests', desc: 'Notify when loan applications are submitted' },
                { key: 'suspiciousActivity', label: 'Suspicious Activity', desc: 'Notify on potential fraud detection' },
                { key: 'systemAlerts', label: 'System Alerts', desc: 'Notify on system errors and maintenance' },
                { key: 'emailAlerts', label: 'Email Alerts', desc: 'Enable all email notifications' },
              ].map(item => (
                <Grid key={item.key} size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                    </Box>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Stack direction="row" justifyContent="flex-end" mt={3}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveNotifications}>Save Preferences</Button>
            </Stack>
          </SettingsPanel>
        )}
      </Box>
    </AdminLayout>
  );
}
