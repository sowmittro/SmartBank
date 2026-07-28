import { useState } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import AdminLayout from '../components/AdminLayout';
import { getAllTickets, updateTicketReply, type Ticket } from '../utils/ticketService';
import { useToast } from '../context/ToastContext';

export default function AdminSupport() {
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>(getAllTickets().reverse());
  const [replyOpen, setReplyOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleReply = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setReplyText('');
    setReplyOpen(true);
  };

  const submitReply = () => {
    if (!selectedTicket || !replyText.trim()) return;
    updateTicketReply(selectedTicket.id, replyText.trim());
    setTickets(getAllTickets().reverse());
    setReplyOpen(false);
    toast.showSuccess(`Reply sent to ${selectedTicket.userName}`);
  };

  return (
    <AdminLayout title="Support Tickets">
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>Customer Support Tickets</Typography>

        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ticket ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reply</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.length === 0 && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No tickets yet</Typography></TableCell></TableRow>
              )}
              {tickets.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.id}</TableCell>
                  <TableCell>{t.userName}</TableCell>
                  <TableCell>{t.userAccount}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell><Chip size="small" label={t.status} color={t.status === 'open' ? 'warning' : t.status === 'resolved' ? 'success' : 'info'} /></TableCell>
                  <TableCell>{t.reply || '-'}</TableCell>
                  <TableCell>
                    {!t.reply && (
                      <Button size="small" variant="outlined" startIcon={<ReplyIcon />} onClick={() => handleReply(t)}>
                        Reply
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Box>

      <Dialog open={replyOpen} onClose={() => setReplyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reply to Ticket</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">Original Message</Typography>
              <Typography variant="body2">{selectedTicket?.message}</Typography>
            </Box>
            <TextField
              label="Your Reply"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              multiline rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitReply} disabled={!replyText.trim()}>Send Reply</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
