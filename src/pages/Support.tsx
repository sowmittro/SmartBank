import { useState } from 'react';
import {
  Box, Card, Typography, Button, TextField, Stack, Chip, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CustomerLayout from '../components/CustomerLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { type Ticket, getAllTickets, saveTicket } from '../utils/ticketService';

export default function Support() {
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const allTickets = getAllTickets();
  const myTickets = allTickets.filter(t => t.userId === user?.id);

  const handleSubmit = () => {
    if (!user) return;
    const ticket: Ticket = {
      id: 'TK' + Math.floor(100000 + Math.random() * 900000),
      userId: user.id,
      userName: user.name,
      userAccount: user.accountNumber,
      subject,
      message,
      status: 'open',
      date: new Date().toISOString(),
    };
    saveTicket(ticket);
    setOpen(false);
    setSubject('');
    setMessage('');
    toast.showSuccess('Support ticket submitted successfully. Our team will respond shortly.');
  };

  return (
    <CustomerLayout>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={700}>Customer Support</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            New Ticket
          </Button>
        </Stack>


        <Card>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ticket ID</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reply</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myTickets.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No tickets yet</Typography></TableCell></TableRow>
              )}
              {myTickets.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.id}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell><Chip size="small" label={t.status} color={t.status === 'open' ? 'warning' : t.status === 'resolved' ? 'success' : 'info'} /></TableCell>
                  <TableCell>{t.reply ? (
                    <Box>
                      <Typography variant="body2" color="success.main" fontWeight={600}>{t.reply}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.replyDate ? new Date(t.replyDate).toLocaleDateString() : ''}</Typography>
                    </Box>
                  ) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Support Ticket</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Subject" value={subject} onChange={e => setSubject(e.target.value)} fullWidth />
            <TextField label="Message" value={message} onChange={e => setMessage(e.target.value)} multiline rows={4} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!subject || !message}>Submit</Button>
        </DialogActions>
      </Dialog>
    </CustomerLayout>
  );
}
