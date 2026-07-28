import { getUserByAccount, updateUser, addTransaction } from './localStorageDB';

export interface BankCard {
  id: string;
  userId: string;
  accountNumber: string;
  network: 'visa' | 'mastercard';
  type: 'debit' | 'credit';
  number: string;
  expiry: string;
  cvv: string;
  holderName: string;
  status: 'pending' | 'active' | 'frozen' | 'expired' | 'blocked';
  creditLimit?: number;
  currentBalance?: number;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  // Annual fee fields
  annualFee: number;
  lastFeeChargedAt?: string;
  feeStatus: 'paid' | 'pending' | 'waived';
  // Card security & limits
  pin: string;
  dailyLimit: number;
  perTxnLimit: number;
  dailySpent: number;
  dailySpentDate: string;
  internationalEnabled: boolean;
  contactlessEnabled: boolean;
}

export interface CardApplication {
  id: string;
  userId: string;
  accountNumber: string;
  cardType: 'debit' | 'credit';
  network: 'visa' | 'mastercard';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
  creditLimit?: number;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  type: 'purchase' | 'refund' | 'cash_advance' | 'payment' | 'fee' | 'annual_fee';
  amount: number;
  merchant: string;
  category: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  description?: string;
  channel?: string;
  referenceId?: string;
  fee?: number;
  previousBalance?: number;
  currentBalance?: number;
}

export interface CardReplacement {
  id: string;
  cardId: string;
  reason: 'lost' | 'stolen' | 'damaged' | 'expired';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  processedAt?: string;
  newCardId?: string;
}

const CARDS_KEY = 'smart_cards_all';
const APPLICATIONS_KEY = 'smart_card_applications';
const CARD_TXNS_KEY = 'smart_card_transactions';
const REPLACEMENTS_KEY = 'smart_card_replacements';

// Initialize storage keys with empty stores if not already present
function initSampleData() {
  if (!localStorage.getItem(CARDS_KEY)) {
    localStorage.setItem(CARDS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(APPLICATIONS_KEY)) {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(CARD_TXNS_KEY)) {
    localStorage.setItem(CARD_TXNS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(REPLACEMENTS_KEY)) {
    localStorage.setItem(REPLACEMENTS_KEY, JSON.stringify([]));
  }
}

// Call init on module load
initSampleData();

// Migrate existing cards to include new fields
function migrateCards() {
  const cards = getAllCards();
  let changed = false;
  const today = new Date().toDateString();
  const migrated = cards.map(c => {
    if (c.pin === undefined || c.dailyLimit === undefined) {
      changed = true;
      return {
        ...c,
        pin: c.pin ?? String(Math.floor(1000 + Math.random() * 9000)),
        dailyLimit: c.dailyLimit ?? (c.type === 'credit' ? 100000 : 50000),
        perTxnLimit: c.perTxnLimit ?? (c.type === 'credit' ? 50000 : 25000),
        dailySpent: c.dailySpent ?? 0,
        dailySpentDate: c.dailySpentDate ?? today,
        internationalEnabled: c.internationalEnabled ?? false,
        contactlessEnabled: c.contactlessEnabled ?? true,
      };
    }
    return c;
  });
  if (changed) saveAllCards(migrated);
}
migrateCards();

// Card functions
export function getAllCards(): BankCard[] {
  return JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
}

export function saveAllCards(cards: BankCard[]) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function getCardsByUser(userId: string): BankCard[] {
  return getAllCards().filter(c => c.userId === userId);
}

export function getCardById(id: string): BankCard | undefined {
  return getAllCards().find(c => c.id === id);
}

export function getCardByNumber(number: string): BankCard | undefined {
  return getAllCards().find(c => c.number === number);
}

export function updateCard(cardId: string, updates: Partial<BankCard>) {
  const all = getAllCards();
  const idx = all.findIndex(c => c.id === cardId);
  if (idx >= 0) { all[idx] = { ...all[idx], ...updates }; saveAllCards(all); }
}

export function deleteCard(cardId: string) {
  saveAllCards(getAllCards().filter(c => c.id !== cardId));
}

export function createCard(data: {
  userId: string;
  accountNumber: string;
  network: 'visa' | 'mastercard';
  type: 'debit' | 'credit';
  holderName: string;
  creditLimit?: number;
  approvedBy: string;
}): BankCard {
  const card: BankCard = {
    id: 'CD' + Date.now() + Math.floor(Math.random() * 1000),
    userId: data.userId,
    accountNumber: data.accountNumber,
    network: data.network,
    type: data.type,
    number: generateCardNumber(data.network),
    expiry: generateExpiry(),
    cvv: generateCVV(),
    holderName: data.holderName,
    status: 'active',
    creditLimit: data.creditLimit,
    currentBalance: data.type === 'credit' ? 0 : undefined,
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    approvedBy: data.approvedBy,
    annualFee: data.type === 'debit' ? 300 : 0,
    lastFeeChargedAt: data.type === 'debit' ? new Date().toISOString() : undefined,
    feeStatus: data.type === 'debit' ? 'paid' : 'waived',
    pin: String(Math.floor(1000 + Math.random() * 9000)),
    dailyLimit: data.type === 'credit' ? 100000 : 50000,
    perTxnLimit: data.type === 'credit' ? 50000 : 25000,
    dailySpent: 0,
    dailySpentDate: new Date().toDateString(),
    internationalEnabled: false,
    contactlessEnabled: true,
  };
  const cards = getAllCards();
  saveAllCards([...cards, card]);
  return card;
}

export function freezeCard(cardId: string): boolean {
  const card = getCardById(cardId);
  if (!card || card.status !== 'active') return false;
  updateCard(cardId, { status: 'frozen' });
  return true;
}

export function unfreezeCard(cardId: string): boolean {
  const card = getCardById(cardId);
  if (!card || card.status !== 'frozen') return false;
  updateCard(cardId, { status: 'active' });
  return true;
}

export function resetDailySpentIfNeeded(card: BankCard): BankCard {
  const today = new Date().toDateString();
  if (card.dailySpentDate !== today) {
    const updated = { ...card, dailySpent: 0, dailySpentDate: today };
    updateCard(card.id, { dailySpent: 0, dailySpentDate: today });
    return updated;
  }
  return card;
}

export function verifyCardPin(cardId: string, pin: string): boolean {
  const card = getCardById(cardId);
  if (!card) return false;
  return card.pin === pin;
}

export function updateCardPin(cardId: string, newPin: string): boolean {
  if (!/^\d{4}$/.test(newPin)) return false;
  updateCard(cardId, { pin: newPin });
  return true;
}

// Application functions
export function getAllApplications(): CardApplication[] {
  return JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
}

export function saveAllApplications(apps: CardApplication[]) {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
}

export function getApplicationsByUser(userId: string): CardApplication[] {
  return getAllApplications().filter(a => a.userId === userId);
}

export function getApplicationById(id: string): CardApplication | undefined {
  return getAllApplications().find(a => a.id === id);
}

export function updateApplication(id: string, updates: Partial<CardApplication>) {
  const all = getAllApplications();
  const idx = all.findIndex(a => a.id === id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...updates }; saveAllApplications(all); }
}

export function deleteApplication(id: string) {
  saveAllApplications(getAllApplications().filter(a => a.id !== id));
}

// Card transaction functions
export function getAllCardTransactions(): CardTransaction[] {
  return JSON.parse(localStorage.getItem(CARD_TXNS_KEY) || '[]');
}

export function saveAllCardTransactions(txns: CardTransaction[]) {
  localStorage.setItem(CARD_TXNS_KEY, JSON.stringify(txns));
}

export function getCardTransactions(cardId: string): CardTransaction[] {
  return getAllCardTransactions().filter(t => t.cardId === cardId);
}

export function addCardTransaction(txn: Omit<CardTransaction, 'id'>) {
  const all = getAllCardTransactions();
  const newTxn: CardTransaction = { ...txn, id: 'CTXN' + Date.now() };
  saveAllCardTransactions([newTxn, ...all]);
  return newTxn;
}

// Replacement functions
export function getAllReplacements(): CardReplacement[] {
  return JSON.parse(localStorage.getItem(REPLACEMENTS_KEY) || '[]');
}

export function saveAllReplacements(reps: CardReplacement[]) {
  localStorage.setItem(REPLACEMENTS_KEY, JSON.stringify(reps));
}

export function getReplacementsByCard(cardId: string): CardReplacement[] {
  return getAllReplacements().filter(r => r.cardId === cardId);
}

// Generators
export function generateCardNumber(network: 'visa' | 'mastercard'): string {
  const prefix = network === 'visa' ? '4' : '5';
  let num = prefix;
  for (let i = 1; i < 16; i++) num += Math.floor(Math.random() * 10).toString();
  return num;
}

export function generateExpiry(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 3);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
}

export function generateCVV(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

export function formatMaskedNumber(num: string): string {
  return `**** **** **** ${num.slice(12)}`;
}

export function formatFullNumber(num: string): string {
  return `${num.slice(0, 4)} ${num.slice(4, 8)} ${num.slice(8, 12)} ${num.slice(12)}`;
}

export function getCardStatusColor(status: BankCard['status']): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'frozen': case 'blocked': case 'expired': return 'error';
    default: return 'default';
  }
}

// Annual fee functions

export function isAnnualFeeDue(card: BankCard): boolean {
  if (card.annualFee <= 0 || card.feeStatus === 'waived') return false;
  if (!card.lastFeeChargedAt) return true; // Never charged, fee is due
  const lastCharged = new Date(card.lastFeeChargedAt);
  const now = new Date();
  const oneYearLater = new Date(lastCharged);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  return now >= oneYearLater;
}

export function getDaysUntilFeeDue(card: BankCard): number {
  if (card.annualFee <= 0 || card.feeStatus === 'waived') return -1;
  if (!card.lastFeeChargedAt) return 0; // Due now
  const lastCharged = new Date(card.lastFeeChargedAt);
  const now = new Date();
  const oneYearLater = new Date(lastCharged);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const diffMs = oneYearLater.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function chargeAnnualFee(cardId: string): { success: boolean; message: string } {
  const card = getCardById(cardId);
  if (!card) return { success: false, message: 'Card not found' };
  if (!isAnnualFeeDue(card)) return { success: false, message: 'Annual fee not due yet' };
  if (card.status !== 'active') return { success: false, message: 'Card is not active' };

  const fee = card.annualFee;

  // Deduct from main account balance
  const accountUser = getUserByAccount(card.accountNumber);
  if (accountUser) {
    if (accountUser.balance < fee) {
      return { success: false, message: `Insufficient balance for annual fee of ৳${fee}` };
    }
    updateUser(accountUser.id, { balance: accountUser.balance - fee });
    addTransaction({
      accountNumber: card.accountNumber,
      type: 'withdraw',
      amount: fee,
      status: 'success',
      description: `Annual card fee - ${card.type} card (****${card.number.slice(12)})`,
    });
  }

  // Record the card fee transaction
  addCardTransaction({
    cardId: card.id,
    type: 'annual_fee',
    amount: fee,
    merchant: 'Smart Bank',
    category: 'Annual Fee',
    date: new Date().toISOString(),
    status: 'completed',
    description: `Annual card maintenance fee for ${card.type} card (****${card.number.slice(12)})`
  });

  // Update card fee status
  updateCard(card.id, {
    lastFeeChargedAt: new Date().toISOString(),
    feeStatus: 'paid'
  });

  return { success: true, message: `Annual fee of ৳${fee} charged successfully` };
}

export function processAnnualFeesForUser(userId: string): { charged: number; total: number; cards: string[] } {
  const cards = getCardsByUser(userId).filter(c => c.status === 'active');
  let charged = 0;
  const chargedCards: string[] = [];

  cards.forEach(card => {
    if (isAnnualFeeDue(card) && card.annualFee > 0) {
      const result = chargeAnnualFee(card.id);
      if (result.success) {
        charged += card.annualFee;
        chargedCards.push(card.number.slice(12));
      }
    }
  });

  return { charged, total: charged, cards: chargedCards };
}

// Auto-charge annual fees on app load (simulating a cron job)
export function autoChargeAnnualFees(): void {
  const allCards = getAllCards();
  allCards.forEach(card => {
    if (card.status === 'active' && isAnnualFeeDue(card)) {
      const today = new Date().toDateString();
      const lastCharge = card.lastFeeChargedAt ? new Date(card.lastFeeChargedAt).toDateString() : null;
      if (lastCharge !== today) {
        chargeAnnualFee(card.id);
      }
    }
  });
}

// Get cards with pending annual fees
export function getCardsWithPendingFees(): BankCard[] {
  return getAllCards().filter(card => isAnnualFeeDue(card));
}

// Get fee history for a card
export function getFeeHistoryForCard(cardId: string): CardTransaction[] {
  return getCardTransactions(cardId).filter(txn => txn.type === 'annual_fee');
}
