import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  fatherName: string;
  motherName: string;
  nidNumber: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  password: string;
  pin: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  role: 'user' | 'admin' | 'employee';
  isActive: boolean;
  isApproved: boolean; // admin must approve new accounts
  createdAt: string;
  address?: string;
  // Loan fields
  loanAmount?: number;
  loanInterestRate?: number;
  loanStartDate?: string;
  loanDueDate?: string;
  loanStatus?: 'active' | 'paid' | null;
  lastInterestPaidDate?: string;
  interestPaid?: number;
  pendingInterest?: number; // interest owed but not yet paid
  // KYC fields
  kycStatus?: 'pending' | 'verified' | 'rejected';
  kycVerifiedBy?: string;
  kycVerifiedAt?: string;
  kycData?: {
    nidPassport: string;
    presentAddress: string;
    permanentAddress: string;
    occupation: string;
    sourceOfIncome: string;
    monthlyIncome: number;
    submittedAt: string;
  };
  // Nominee
  nominee?: {
    name: string;
    relationship: string;
    mobile: string;
    address: string;
    addedAt: string;
  };
  // Profile photo (base64 data URL)
  profilePhoto?: string;
  // Employee fields
  employeeId?: string;
  designation?: string;
  branch?: string;
  department?: string;
}

export interface Transaction {
  id: string;
  accountNumber: string;
  type: 'deposit' | 'withdraw' | 'transfer-out' | 'transfer-in' | 'loan' | 'interest';
  amount: number;
  toAccount?: string;
  fromAccount?: string;
  date: string;
  status: 'success' | 'failed' | 'pending';
  description?: string;
  approvedBy?: string;
  pendingApproval?: boolean;
}

export interface Notification {
  id: string;
  accountNumber: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  date: string;
}

const USERS_KEY = 'sb_users';
const TRANSACTIONS_KEY = 'sb_transactions';
const NOTIFICATIONS_KEY = 'sb_notifications';
const SESSION_KEY = 'sb_session';

export function getUsers(): User[] {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserByAccount(accountNumber: string): User | undefined {
  return getUsers().find(u => u.accountNumber === accountNumber);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

export function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000)).slice(0, 6);
}

export function createUser(data: Omit<User, 'id' | 'accountNumber' | 'createdAt' | 'isActive' | 'isApproved'> & Partial<Pick<User, 'isApproved'>>): User {
  const users = getUsers();
  const accountNumber = generateAccountNumber();
  const user: User = {
    ...data,
    id: uuidv4(),
    accountNumber,
    createdAt: new Date().toISOString(),
    isActive: true,
    isApproved: data.isApproved ?? (data.role === 'admin' ? true : false),
  };
  users.push(user);
  saveUsers(users);
  return user;
}

export function updateUser(id: string, updates: Partial<User>) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
    return users[idx];
  }
  return null;
}

export function deleteUser(id: string) {
  saveUsers(getUsers().filter(u => u.id !== id));
}

export function generateAccountNumber(): string {
  const users = getUsers();
  let acc: string;
  do {
    acc = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  } while (users.some(u => u.accountNumber === acc));
  return acc;
}

export function getInterestRateForAmount(amount: number): number {
  if (amount <= 10000) return 12;
  if (amount <= 50000) return 10;
  if (amount <= 200000) return 8;
  if (amount <= 500000) return 6;
  return 5;
}

export function getTransactions(): Transaction[] {
  const raw = localStorage.getItem(TRANSACTIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveTransactions(txns: Transaction[]) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txns));
}

export function getTransactionsByAccount(accountNumber: string): Transaction[] {
  return getTransactions().filter(t => t.accountNumber === accountNumber);
}

export function addTransaction(txn: Omit<Transaction, 'id' | 'date'>): Transaction {
  const txns = getTransactions();
  const newTxn: Transaction = {
    ...txn,
    id: uuidv4(),
    date: new Date().toISOString(),
  };
  txns.push(newTxn);
  saveTransactions(txns);
  return newTxn;
}

export function updateTransaction(id: string, updates: Partial<Transaction>) {
  const txns = getTransactions();
  const idx = txns.findIndex(t => t.id === id);
  if (idx >= 0) {
    txns[idx] = { ...txns[idx], ...updates };
    saveTransactions(txns);
    return txns[idx];
  }
  return null;
}

export function getNotifications(): Notification[] {
  const raw = localStorage.getItem(NOTIFICATIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getNotificationsByAccount(accountNumber: string): Notification[] {
  return getNotifications().filter(n => n.accountNumber === accountNumber);
}

export function addNotification(notif: Omit<Notification, 'id' | 'date' | 'read'>) {
  const notifs = getNotifications();
  const newNotif: Notification = {
    ...notif,
    id: uuidv4(),
    date: new Date().toISOString(),
    read: false,
  };
  notifs.push(newNotif);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  return newNotif;
}

export function markNotificationRead(id: string) {
  const notifs = getNotifications();
  const idx = notifs.findIndex(n => n.id === id);
  if (idx >= 0) {
    notifs[idx].read = true;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  }
}

export function markAllNotificationsRead(accountNumber: string) {
  const notifs = getNotifications();
  notifs.forEach(n => { if (n.accountNumber === accountNumber) n.read = true; });
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
}

export function getSession(): User | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const { userId } = JSON.parse(raw);
  return getUserById(userId) ?? null;
}

export function setSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getPendingTransactions(): Transaction[] {
  return getTransactions().filter(t => t.pendingApproval === true && t.status === 'pending');
}

export function getPendingAccountApprovals(): User[] {
  return getUsers().filter(u => u.role === 'user' && !u.isApproved);
}

export function getEmployees(): User[] {
  return getUsers().filter(u => u.role === 'employee');
}

export function getPendingKyc(): User[] {
  return getUsers().filter(u => u.role === 'user' && u.isApproved && u.kycStatus === 'pending' && u.kycData);
}

export function getEmployeeById(id: string): User | undefined {
  const u = getUserById(id);
  return u && u.role === 'employee' ? u : undefined;
}

export interface AdminAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  path: string;
}

export function getAdminAlerts(): AdminAlert[] {
  const alerts: AdminAlert[] = [];

  const pendingApprovals = getPendingAccountApprovals().length;
  if (pendingApprovals > 0) {
    alerts.push({
      id: 'pending-approvals',
      type: 'warning',
      message: `${pendingApprovals} account approval${pendingApprovals !== 1 ? 's' : ''} pending`,
      path: '/admin/approvals',
    });
  }

  const pendingKyc = getPendingKyc().length;
  if (pendingKyc > 0) {
    alerts.push({
      id: 'pending-kyc',
      type: 'warning',
      message: `${pendingKyc} KYC verification${pendingKyc !== 1 ? 's' : ''} pending`,
      path: '/admin?tab=customers',
    });
  }

  const pendingTxns = getPendingTransactions().length;
  if (pendingTxns > 0) {
    alerts.push({
      id: 'pending-transactions',
      type: 'warning',
      message: `${pendingTxns} deposit/withdrawal request${pendingTxns !== 1 ? 's' : ''} awaiting approval`,
      path: '/admin/deposits',
    });
  }

  let pendingCards = 0;
  try {
    pendingCards = (JSON.parse(localStorage.getItem('smart_cards_all') || '[]') as { status: string }[]).filter(c => c.status === 'pending').length;
  } catch { /* ignore */ }
  if (pendingCards > 0) {
    alerts.push({
      id: 'pending-cards',
      type: 'info',
      message: `${pendingCards} card application${pendingCards !== 1 ? 's' : ''} pending`,
      path: '/admin/cards',
    });
  }

  let openTickets = 0;
  try {
    const tickets = JSON.parse(localStorage.getItem('smart_tickets_all') || '[]') as { status: string }[];
    openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
  } catch { /* ignore */ }
  if (openTickets > 0) {
    alerts.push({
      id: 'open-tickets',
      type: 'info',
      message: `${openTickets} open support ticket${openTickets !== 1 ? 's' : ''}`,
      path: '/admin/support',
    });
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentFailed = getTransactions().filter(t => t.status === 'failed' && new Date(t.date).getTime() >= sevenDaysAgo).length;
  if (recentFailed > 0) {
    alerts.push({
      id: 'failed-transactions',
      type: 'error',
      message: `${recentFailed} failed transaction${recentFailed !== 1 ? 's' : ''} in the last 7 days`,
      path: '/admin/transactions',
    });
  }

  return alerts;
}

export function generateEmployeeId(): string {
  const employees = getEmployees();
  let id: string;
  do {
    id = 'EMP' + Math.floor(1000 + Math.random() * 9000).toString();
  } while (employees.some(e => e.employeeId === id));
  return id;
}

export function initAdminIfNeeded() {
  const users = getUsers();
  let changed = false;
  if (!users.some(u => u.role === 'admin')) {
    const admin: User = {
      id: uuidv4(),
      name: 'System Admin',
      fatherName: '',
      motherName: '',
      nidNumber: '0000000000',
      dob: '1980-01-01',
      gender: 'Other',
      mobile: '01000000000',
      email: 'admin@smartbank.com',
      password: 'admin123',
      pin: '0000',
      accountNumber: '0000000000',
      accountType: 'Admin',
      balance: 0,
      role: 'admin',
      isActive: true,
      isApproved: true,
      createdAt: new Date().toISOString(),
    };
    users.push(admin);
    changed = true;
  }
  if (!users.some(u => u.role === 'employee')) {
    const employee: User = {
      id: uuidv4(),
      name: 'Teller Officer',
      fatherName: '',
      motherName: '',
      nidNumber: '0000000001',
      dob: '1990-01-01',
      gender: 'Other',
      mobile: '01000000001',
      email: 'employee@smartbank.com',
      password: 'employee123',
      pin: '0000',
      accountNumber: 'EMP0000001',
      accountType: 'Employee',
      balance: 0,
      role: 'employee',
      isActive: true,
      isApproved: true,
      createdAt: new Date().toISOString(),
      employeeId: 'EMP1001',
      designation: 'Bank Teller',
      branch: 'Main Branch',
    };
    users.push(employee);
    changed = true;
  }
  if (changed) saveUsers(users);
}

export function checkAndProcessInterest() {
  const users = getUsers();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  users.forEach(user => {
    if (user.loanStatus !== 'active' || !user.loanDueDate) return;
    const dueDate = new Date(user.loanDueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (today >= dueDate) {
      const interestAmount = Math.round(((user.loanAmount ?? 0) * (user.loanInterestRate ?? 0)) / 100);
      const lastPaid = user.lastInterestPaidDate ? new Date(user.lastInterestPaidDate) : null;
      if (lastPaid && lastPaid >= dueDate) return;

      const hasUnreadDueNotif = getNotificationsByAccount(user.accountNumber)
        .some(n => n.message.includes('interest due') && !n.read);

      if (!hasUnreadDueNotif) {
        addNotification({
          accountNumber: user.accountNumber,
          message: `Loan interest of ৳${interestAmount.toLocaleString()} is due today (${dueDate.toLocaleDateString()}). Please pay to avoid penalties.`,
          type: 'warning',
        });
      }

      if (user.balance >= interestAmount) {
        updateUser(user.id, {
          balance: user.balance - interestAmount,
          lastInterestPaidDate: today.toISOString(),
          interestPaid: (user.interestPaid ?? 0) + interestAmount,
          pendingInterest: 0,
        });
        addTransaction({
          accountNumber: user.accountNumber,
          type: 'interest',
          amount: interestAmount,
          status: 'success',
          description: `Monthly loan interest auto-deducted (${user.loanInterestRate}% p.m. on ৳${user.loanAmount?.toLocaleString()})`,
        });
        const nextDue = new Date(dueDate);
        nextDue.setMonth(nextDue.getMonth() + 1);
        updateUser(user.id, { loanDueDate: nextDue.toISOString() });
        addNotification({
          accountNumber: user.accountNumber,
          message: `৳${interestAmount.toLocaleString()} interest auto-deducted. Next due: ${nextDue.toLocaleDateString()}.`,
          type: 'info',
        });
      } else {
        // Insufficient funds — add to pending and notify
        updateUser(user.id, {
          pendingInterest: (user.pendingInterest ?? 0) + interestAmount,
        });
        addNotification({
          accountNumber: user.accountNumber,
          message: `Insufficient balance to auto-deduct loan interest of ৳${interestAmount.toLocaleString()}. Please deposit funds immediately to avoid loan default.`,
          type: 'error',
        });
        // Mark as failed transaction
        addTransaction({
          accountNumber: user.accountNumber,
          type: 'interest',
          amount: interestAmount,
          status: 'failed',
          description: `Auto-deduction failed — insufficient balance (interest ৳${interestAmount.toLocaleString()} overdue)`,
        });
      }
    }
  });
}
