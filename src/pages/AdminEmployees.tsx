import { useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, Stack, Table, TableBody, TableContainer,
  TableHead, TableRow, TableCell, TextField, Tooltip, Typography,
  MenuItem, Select, FormControl, InputLabel, InputAdornment, Divider,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BadgeIcon from '@mui/icons-material/Badge';
import AdminLayout from '../components/AdminLayout';
import {
  getEmployees, getUsers, createUser, updateUser, deleteUser, generateEmployeeId,
  getUserById, getTransactions, addNotification,
} from '../utils/localStorageDB';
import { validateEmail, validatePassword, validateMobile, validateRequired } from '../utils/validators';
import { useToast } from '../context/ToastContext';

interface EmployeeForm {
  name: string; email: string; mobile: string; password: string;
  department: string; designation: string; branch: string; status: 'active' | 'inactive';
}

const EMPTY_FORM: EmployeeForm = {
  name: '', email: '', mobile: '', password: '',
  department: '', designation: '', branch: 'Main Branch', status: 'active',
};

export default function AdminEmployees() {
  const toast = useToast();
  const [, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [createdPin, setCreatedPin] = useState('');
  const [createdEmpId, setCreatedEmpId] = useState('');
  const [showCreated, setShowCreated] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [viewTarget, setViewTarget] = useState<string | null>(null);

  const refresh = () => setRefreshKey(k => k + 1);

  const employees = getEmployees();
  const filtered = employees.filter(e =>
    !search ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.employeeId ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const set = (field: keyof EmployeeForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleCreate = () => {
    const errs: Record<string, string> = {};
    const nameErr = validateRequired(form.name, 'Full name'); if (nameErr) errs.name = nameErr;
    const emailErr = validateEmail(form.email); if (emailErr) errs.email = emailErr;
    const mobileErr = validateMobile(form.mobile); if (mobileErr) errs.mobile = mobileErr;
    const pwErr = validatePassword(form.password); if (pwErr) errs.password = pwErr;
    const deptErr = validateRequired(form.department, 'Department'); if (deptErr) errs.department = deptErr;
    const desigErr = validateRequired(form.designation, 'Designation'); if (desigErr) errs.designation = desigErr;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (getUsers().some(u => u.email.toLowerCase() === form.email.toLowerCase())) {
      setGlobalError('Email already registered');
      return;
    }
    setGlobalError('');
    const empId = generateEmployeeId();
    const autoPin = String(Math.floor(100000 + Math.random() * 900000)).slice(0, 6);
    createUser({
      name: form.name, fatherName: '', motherName: '', nidNumber: '0000000000',
      dob: '1990-01-01', gender: 'Other', mobile: form.mobile, email: form.email,
      password: form.password, pin: autoPin, accountType: 'Employee', balance: 0,
      role: 'employee', employeeId: empId, department: form.department,
      designation: form.designation, branch: form.branch,
    });
    setCreatedPin(autoPin);
    setCreatedEmpId(empId);
    setShowCreated(true);
    refresh();
  };

  const handleEdit = () => {
    if (!editTarget) return;
    const errs: Record<string, string> = {};
    const nameErr = validateRequired(form.name, 'Full name'); if (nameErr) errs.name = nameErr;
    const emailErr = validateEmail(form.email); if (emailErr) errs.email = emailErr;
    const mobileErr = validateMobile(form.mobile); if (mobileErr) errs.mobile = mobileErr;
    const deptErr = validateRequired(form.department, 'Department'); if (deptErr) errs.department = deptErr;
    const desigErr = validateRequired(form.designation, 'Designation'); if (desigErr) errs.designation = desigErr;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (getUsers().some(u => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== editTarget)) {
      setGlobalError('Email already registered');
      return;
    }
    setGlobalError('');
    updateUser(editTarget, {
      name: form.name, email: form.email, mobile: form.mobile,
      department: form.department, designation: form.designation, branch: form.branch,
      isActive: form.status === 'active',
    });
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setGlobalError('');
    toast.showSuccess('Employee updated successfully.');
    refresh();
  };

  const handleToggleStatus = (id: string, current: boolean) => {
    updateUser(id, { isActive: !current });
    const u = getUserById(id);
    if (u) addNotification({
      accountNumber: u.accountNumber,
      message: current ? 'Your employee account has been deactivated by administrator.' : 'Your employee account has been reactivated.',
      type: current ? 'warning' : 'success',
    });
    toast.showSuccess(`Employee ${current ? 'deactivated' : 'activated'} successfully.`);
    refresh();
  };

  const handleResetPassword = () => {
    if (!resetTarget) return;
    if (newPassword.length < 6) { setResetError('Password must be at least 6 characters'); return; }
    updateUser(resetTarget, { password: newPassword });
    setResetTarget(null);
    setNewPassword('');
    setResetError('');
    toast.showSuccess('Employee password reset successfully.');
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteUser(deleteId);
    setDeleteId(null);
    toast.showSuccess('Employee account deleted.');
    refresh();
  };

  const openEdit = (id: string) => {
    const e = getUserById(id);
    if (!e) return;
    setEditTarget(id);
    setForm({
      name: e.name, email: e.email, mobile: e.mobile, password: '',
      department: e.department ?? '', designation: e.designation ?? '',
      branch: e.branch ?? 'Main Branch', status: e.isActive ? 'active' : 'inactive',
    });
    setErrors({});
    setGlobalError('');
  };

  const closeDialog = () => {
    setCreateOpen(false);
    setEditTarget(null);
    setShowCreated(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setGlobalError('');
    setCreatedPin('');
    setCreatedEmpId('');
  };

  const viewEmployee = viewTarget ? getUserById(viewTarget) : null;
  const viewTxns = viewEmployee
    ? getTransactions().filter(t => t.approvedBy === viewEmployee.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <AdminLayout title="Employee Management">
      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Employee Management</Typography>
            <Typography variant="body2" color="text.secondary">{employees.length} employee{employees.length !== 1 ? 's' : ''} · {employees.filter(e => e.isActive).length} active</Typography>
          </Box>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => { setForm(EMPTY_FORM); setErrors({}); setGlobalError(''); setShowCreated(false); setCreateOpen(true); }}>
            Create Employee
          </Button>
        </Stack>

        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ py: 2 }}>
            <TextField
              fullWidth size="small"
              placeholder="Search by name, email, employee ID, or department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
          </CardContent>
        </Card>

        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Designation</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Branch</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <PeopleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">{search ? 'No employees match your search' : 'No employees yet. Create one to get started.'}</Typography>
                  </TableCell></TableRow>
                ) : filtered.map(e => (
                  <TableRow key={e.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.9rem' }}>{e.name.charAt(0).toUpperCase()}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{e.name}</Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <BadgeIcon sx={{ fontSize: '0.7rem', color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{e.employeeId ?? 'N/A'}</Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell><Typography variant="body2">{e.department ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{e.designation ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{e.branch ?? '—'}</Typography></TableCell>
                    <TableCell>
                      <Chip label={e.isActive ? 'Active' : 'Inactive'} size="small" color={e.isActive ? 'success' : 'error'} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View Activity"><IconButton size="small" color="info" onClick={() => setViewTarget(e.id)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(e.id)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={e.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" color={e.isActive ? 'error' : 'success'} onClick={() => handleToggleStatus(e.id, e.isActive)}>
                            {e.isActive ? <BlockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset Password"><IconButton size="small" color="warning" onClick={() => { setResetTarget(e.id); setNewPassword(''); setResetError(''); }}><LockResetIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(e.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog open={createOpen || editTarget !== null} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Employee' : 'Create Employee Account'}</DialogTitle>
        <DialogContent>
          {showCreated ? (
            <Box textAlign="center" py={2}>
              <PeopleIcon sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} mb={1}>Employee Created!</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>The employee account has been created. Share these credentials securely.</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.main', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Employee ID</Typography>
                    <Typography variant="h6" fontWeight={800} color="primary.dark">{createdEmpId || '—'}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.main', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Auto-Generated PIN</Typography>
                    <Typography variant="h6" fontWeight={800} color="warning.dark" letterSpacing={4}>{createdPin}</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Alert severity="warning" sx={{ textAlign: 'left' }}>Share the Employee ID, PIN, and the temporary password with the employee. They can change the password after first login.</Alert>
            </Box>
          ) : (
            <>
              {globalError && <Alert severity="error" sx={{ mb: 2 }}>{globalError}</Alert>}
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={12}>
                  <TextField fullWidth label="Full Name" value={form.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} required autoFocus />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Email Address" type="email" value={form.email} onChange={set('email')} error={!!errors.email} helperText={errors.email} required disabled={!!editTarget} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Mobile Number" value={form.mobile} onChange={set('mobile')} error={!!errors.mobile} helperText={errors.mobile} required placeholder="01XXXXXXXXX" />
                </Grid>
                {!editTarget && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Temporary Password" type="password" value={form.password} onChange={set('password')} error={!!errors.password} helperText={errors.password ?? 'At least 6 characters'} required />
                  </Grid>
                )}
                {editTarget && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select value={form.status} label="Status" onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Department" value={form.department} onChange={set('department')} error={!!errors.department} helperText={errors.department} required placeholder="e.g. Operations" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Designation" value={form.designation} onChange={set('designation')} error={!!errors.designation} helperText={errors.designation} required placeholder="e.g. Bank Teller" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Branch" value={form.branch} onChange={set('branch')} placeholder="e.g. Main Branch" />
                </Grid>
                {!editTarget && (
                  <Grid size={12}>
                    <Alert severity="info" sx={{ mt: 1 }}>
                      An <strong>Employee ID</strong> will be auto-generated (format: EMP####) and a 6-digit <strong>PIN</strong> will be assigned for the employee.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          {showCreated ? (
            <Button variant="contained" onClick={closeDialog} fullWidth>Done</Button>
          ) : (
            <>
              <Button variant="outlined" onClick={closeDialog} fullWidth>Cancel</Button>
              <Button variant="contained" onClick={editTarget ? handleEdit : handleCreate} fullWidth>{editTarget ? 'Save Changes' : 'Create Employee'}</Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetTarget !== null} onClose={() => setResetTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Employee Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Set a new temporary password for <strong>{resetTarget ? getUserById(resetTarget)?.name : ''}</strong>. The employee should change it after logging in.
          </Typography>
          {resetError && <Alert severity="error" sx={{ mb: 2 }}>{resetError}</Alert>}
          <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setResetError(''); }} helperText="At least 6 characters" autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setResetTarget(null)} fullWidth>Cancel</Button>
          <Button variant="contained" color="warning" startIcon={<LockResetIcon />} onClick={handleResetPassword} fullWidth>Reset Password</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Delete Employee Account</DialogTitle>
        <DialogContent>
          {deleteId && (() => {
            const e = getUserById(deleteId);
            return e ? (
              <Box>
                <Typography variant="body1" mb={1}>Are you sure you want to permanently delete the employee account of <strong>{e.name}</strong>?</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>Employee ID: <strong>{e.employeeId}</strong> · {e.email}</Typography>
                <Typography variant="body2" color="error.main" fontWeight={600}>This action is irreversible. All employee data will be removed.</Typography>
              </Box>
            ) : null;
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteId(null)} fullWidth>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} fullWidth>Delete Account</Button>
        </DialogActions>
      </Dialog>

      {/* View Activity Dialog */}
      <Dialog open={viewTarget !== null} onClose={() => setViewTarget(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Employee Activity
          {viewEmployee && (
            <Typography variant="body2" color="text.secondary" fontWeight={400}>
              {viewEmployee.name} · {viewEmployee.employeeId} · {viewEmployee.department}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {viewEmployee && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Designation</Typography>
                    <Typography variant="body2" fontWeight={600}>{viewEmployee.designation ?? '—'}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Branch</Typography>
                    <Typography variant="body2" fontWeight={600}>{viewEmployee.branch ?? '—'}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Processed Txns</Typography>
                    <Typography variant="body2" fontWeight={600}>{viewTxns.length}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Joined</Typography>
                    <Typography variant="body2" fontWeight={600}>{new Date(viewEmployee.createdAt).toLocaleDateString()}</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Recent Processed Transactions</Typography>
              {viewTxns.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary">No processed transactions yet.</Typography>
                </Box>
              ) : (
                <Stack divider={<Divider />}>
                  {viewTxns.slice(0, 20).map(t => (
                    <Stack key={t.id} direction="row" justifyContent="space-between" alignItems="center" py={1.25}>
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{t.type.replace('-', ' ')}</Typography>
                        <Typography variant="caption" color="text.secondary">Account: {t.accountNumber} · {new Date(t.date).toLocaleString()}</Typography>
                        {t.description && <Typography variant="caption" color="text.secondary" display="block">{t.description}</Typography>}
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" fontWeight={700} color="primary.main">৳{t.amount.toLocaleString()}</Typography>
                        <Chip label={t.status} size="small" color={t.status === 'success' ? 'success' : t.status === 'pending' ? 'warning' : 'error'} sx={{ fontSize: '0.6rem', height: 18 }} />
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="contained" onClick={() => setViewTarget(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
