import { useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Table, TableBody, TableCell, TableHead, TableRow, Chip,
} from '@mui/material';
import AdminLayout from '../components/AdminLayout';
import { getUsers, getTransactions } from '../utils/localStorageDB';

export default function AdminAudit() {
  const users = getUsers();
  const transactions = getTransactions();

  const auditLog = useMemo(() => {
    const logs: { date: string; action: string; user: string; details: string; severity: 'low' | 'medium' | 'high' }[] = [];

    users.forEach(u => {
      logs.push({
        date: u.createdAt,
        action: u.role === 'admin' ? 'Admin Created' : 'Account Created',
        user: u.email,
        details: `Account ${u.accountNumber} - ${u.isApproved ? 'Approved' : 'Pending'}`,
        severity: 'low',
      });
    });

    transactions.forEach(t => {
      if (t.pendingApproval) {
        logs.push({
          date: t.date,
          action: 'Pending Approval',
          user: t.accountNumber,
          details: `${t.type} of ৳${t.amount.toLocaleString()}`,
          severity: 'medium',
        });
      }
      if (t.status === 'failed') {
        logs.push({
          date: t.date,
          action: 'Failed Transaction',
          user: t.accountNumber,
          details: `${t.type} of ৳${t.amount.toLocaleString()}`,
          severity: 'high',
        });
      }
    });

    const suspicious = transactions.filter(t => t.amount > 500000);
    suspicious.forEach(t => {
      logs.push({
        date: t.date,
        action: 'High Value Transaction',
        user: t.accountNumber,
        details: `${t.type} of ৳${t.amount.toLocaleString()}`,
        severity: 'high',
      });
    });

    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [users, transactions]);

  return (
    <AdminLayout title="Audit Logs & Fraud Detection">
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>Audit Logs & Fraud Detection</Typography>

        <Stack direction="row" spacing={2} mb={3}>
          <Card sx={{ flex: 1 }}><CardContent>
            <Typography variant="caption" color="text.secondary">Total Events</Typography>
            <Typography variant="h5" fontWeight={700}>{auditLog.length}</Typography>
          </CardContent></Card>
          <Card sx={{ flex: 1 }}><CardContent>
            <Typography variant="caption" color="text.secondary">High Risk</Typography>
            <Typography variant="h5" fontWeight={700} color="error">{auditLog.filter(l => l.severity === 'high').length}</Typography>
          </CardContent></Card>
          <Card sx={{ flex: 1 }}><CardContent>
            <Typography variant="caption" color="text.secondary">Pending Approvals</Typography>
            <Typography variant="h5" fontWeight={700} color="warning.main">{auditLog.filter(l => l.action === 'Pending Approval').length}</Typography>
          </CardContent></Card>
        </Stack>

        <Card>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Severity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLog.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No audit events</Typography></TableCell></TableRow>
              )}
              {auditLog.map((log, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(log.date).toLocaleString()}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell><Chip size="small" label={log.severity} color={log.severity === 'high' ? 'error' : log.severity === 'medium' ? 'warning' : 'success'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Box>
    </AdminLayout>
  );
}
