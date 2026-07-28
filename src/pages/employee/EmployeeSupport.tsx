import { useState } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import EmployeeLayout from '../../components/EmployeeLayout';
import { getAllTickets, updateTicketReply, type Ticket } from '../../utils/ticketService';
import { useToast } from '../../context/ToastContext';

export default function EmployeeSupport() {
  const toast = useToast();
  const [, setRefreshKey] = useState(0);
  const tickets: Ticket[] = [...getAllTickets()].reverse();
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
    setRefreshKey(k => k + 1);
    setReplyOpen(false);
    toast.showSuccess(`Reply sent to ${selectedTicket.userName}`);
  };

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;

  return (
    <EmployeeLayout title="Support Tickets">
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Customer Support Tickets</Typography>
            <Typography variant="body2" color="text.secondary">
              {openCount > 0 ? `${openCount} open ticket${openCount !== 1 ? 's' : ''} need attention` : 'All tickets resolved'}
            </Typography>
          </Box>
          {openCount > 0 && <Chip label={`${openCount} Open`} color="warning" />}
        </Stack>

        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Ticket ID</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Account</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Reply</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No tickets yet</Typography>
                  </TableCell>
                </TableRow>
              )}
              {tickets.map(t => (
                <TableRow key={t.id} hover>
                  <TableCell><Typography variant="caption" fontFamily="monospace">{t.id}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{t.userName}</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontFamily="monospace">{t.userAccount}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{t.subject}</Typography></TableCell>
                  <TableCell><Typography variant="caption">{new Date(t.date).toLocaleDateString()}</Typography></TableCell>
                  <TableCell>
                    <Chip size="small" label={t.status} color={t.status === 'open' ? 'warning' : t.status === 'resolved' ? 'success' : 'info'} />
                  </TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{t.reply || '—'}</Typography></TableCell>
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
    </EmployeeLayout>
  );
}
