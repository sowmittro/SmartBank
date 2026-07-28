export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userAccount: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  date: string;
  reply?: string;
  replyDate?: string;
}

const TICKETS_KEY = 'smart_tickets_all';

export function getAllTickets(): Ticket[] {
  return JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
}

export function saveTicket(ticket: Ticket) {
  const all = getAllTickets();
  all.push(ticket);
  localStorage.setItem(TICKETS_KEY, JSON.stringify(all));
}

export function updateTicketReply(ticketId: string, reply: string) {
  const all = getAllTickets();
  const idx = all.findIndex(t => t.id === ticketId);
  if (idx >= 0) {
    all[idx].reply = reply;
    all[idx].replyDate = new Date().toISOString();
    all[idx].status = 'resolved';
    localStorage.setItem(TICKETS_KEY, JSON.stringify(all));
  }
}
