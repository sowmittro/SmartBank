import {
  type BankCard, getCardById, updateCard, addCardTransaction,
  resetDailySpentIfNeeded, verifyCardPin,
} from './mockCardsData';
import {
  getUserByAccount, updateUser, addTransaction, addNotification,
} from './localStorageDB';

export type CardTxnType =
  | 'atm_withdrawal'
  | 'atm_deposit'
  | 'pos_purchase'
  | 'contactless_payment'
  | 'online_payment'
  | 'qr_payment'
  | 'merchant_payment'
  | 'bank_transfer'
  | 'card_to_card_transfer'
  | 'utility_bill'
  | 'mobile_recharge'
  | 'subscription'
  | 'international_payment';

export type CardTxnChannel = 'ATM' | 'POS' | 'Online' | 'QR' | 'NFC' | 'Bank' | 'Mobile';

export type CardTxnStatus = 'success' | 'failed' | 'cancelled';

export interface CardTransactionRequest {
  cardId: string;
  type: CardTxnType;
  amount: number;
  merchant: string;
  category: string;
  description?: string;
  channel?: CardTxnChannel;
  pin?: string;
  cvv?: string;
  recipientAccount?: string;
  recipientCardId?: string;
}

export interface CardTransactionResult {
  success: boolean;
  status: CardTxnStatus;
  transactionId: string;
  referenceId: string;
  message: string;
  failureReason?: string;
  deductedAmount?: number;
  fee?: number;
  remainingBalance?: number;
  card?: BankCard;
  previousBalance?: number;
}

export interface CardTransactionRecord {
  id: string;
  referenceId: string;
  customerId: string;
  customerName: string;
  accountId: string;
  cardId: string;
  cardType: string;
  cardLast4: string;
  txnType: CardTxnType;
  channel: CardTxnChannel;
  amount: number;
  fee: number;
  totalDeducted: number;
  previousBalance: number;
  currentBalance: number;
  status: CardTxnStatus;
  failureReason?: string;
  date: string;
  merchant: string;
  recipientDetails?: string;
  description?: string;
}

const CARD_TXN_RECORDS_KEY = 'smart_card_txn_records';

export const TXN_FEES: Record<CardTxnType, number> = {
  atm_withdrawal: 0,
  atm_deposit: 0,
  pos_purchase: 0,
  contactless_payment: 0,
  online_payment: 0,
  qr_payment: 0,
  merchant_payment: 0,
  bank_transfer: 10,
  card_to_card_transfer: 15,
  utility_bill: 5,
  mobile_recharge: 0,
  subscription: 0,
  international_payment: 50,
};

export const TXN_LABELS: Record<CardTxnType, string> = {
  atm_withdrawal: 'ATM Cash Withdrawal',
  atm_deposit: 'ATM Cash Deposit',
  pos_purchase: 'POS Purchase',
  contactless_payment: 'Contactless (NFC) Payment',
  online_payment: 'Online Payment',
  qr_payment: 'QR Code Payment',
  merchant_payment: 'Merchant Payment',
  bank_transfer: 'Bank Account Transfer',
  card_to_card_transfer: 'Card-to-Card Transfer',
  utility_bill: 'Utility Bill Payment',
  mobile_recharge: 'Mobile Recharge',
  subscription: 'Subscription / Auto-Debit',
  international_payment: 'International Payment',
};

export const TXN_CHANNELS: Record<CardTxnType, CardTxnChannel> = {
  atm_withdrawal: 'ATM',
  atm_deposit: 'ATM',
  pos_purchase: 'POS',
  contactless_payment: 'NFC',
  online_payment: 'Online',
  qr_payment: 'QR',
  merchant_payment: 'POS',
  bank_transfer: 'Bank',
  card_to_card_transfer: 'Bank',
  utility_bill: 'Online',
  mobile_recharge: 'Mobile',
  subscription: 'Online',
  international_payment: 'Online',
};

const PIN_REQUIRED_TYPES: CardTxnType[] = [
  'atm_withdrawal', 'atm_deposit', 'pos_purchase', 'bank_transfer', 'card_to_card_transfer',
];

const CVV_REQUIRED_TYPES: CardTxnType[] = [
  'online_payment', 'subscription', 'international_payment',
];

const INTERNATIONAL_TYPES: CardTxnType[] = ['international_payment'];

// Transaction types that ADD money to the linked account/card instead of spending from it
const DEPOSIT_TYPES: CardTxnType[] = ['atm_deposit'];

const FRAUD_THRESHOLD = 200000;
const FRAUD_FREQUENCY_LIMIT = 5;
const FRAUD_FREQUENCY_WINDOW_MS = 10 * 60 * 1000;

function generateReferenceId(): string {
  return 'R' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function generateTransactionId(): string {
  return 'CTX' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

function getCardTxnRecords(): CardTransactionRecord[] {
  const raw = localStorage.getItem(CARD_TXN_RECORDS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCardTxnRecords(records: CardTransactionRecord[]) {
  localStorage.setItem(CARD_TXN_RECORDS_KEY, JSON.stringify(records));
}

export function getCardTxnRecordsByCard(cardId: string): CardTransactionRecord[] {
  return getCardTxnRecords().filter(r => r.cardId === cardId);
}

export function getCardTxnRecordsByAccount(accountNumber: string): CardTransactionRecord[] {
  return getCardTxnRecords().filter(r => r.accountId === accountNumber);
}

export function getAllCardTxnRecords(): CardTransactionRecord[] {
  return getCardTxnRecords();
}

function isCardExpired(expiry: string): boolean {
  const [month, year] = expiry.split('/');
  const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1, 1);
  expiryDate.setMonth(expiryDate.getMonth() + 1);
  expiryDate.setDate(0);
  expiryDate.setHours(23, 59, 59);
  return new Date() > expiryDate;
}

function detectFraud(cardId: string, amount: number): { fraud: boolean; reason?: string } {
  if (amount >= FRAUD_THRESHOLD) {
    return { fraud: true, reason: `Transaction amount ৳${amount.toLocaleString()} exceeds fraud threshold of ৳${FRAUD_THRESHOLD.toLocaleString()}.` };
  }
  const recent = getCardTxnRecords()
    .filter(r => r.cardId === cardId && r.status === 'success')
    .filter(r => Date.now() - new Date(r.date).getTime() < FRAUD_FREQUENCY_WINDOW_MS);
  if (recent.length >= FRAUD_FREQUENCY_LIMIT) {
    return { fraud: true, reason: `Unusual transaction frequency detected: ${recent.length} transactions in 10 minutes.` };
  }
  return { fraud: false };
}

function createRecord(
  request: CardTransactionRequest,
  card: BankCard,
  account: { id: string; name: string; accountNumber: string; balance: number },
  status: CardTxnStatus,
  fee: number,
  totalDeducted: number,
  previousBalance: number,
  currentBalance: number,
  channel: CardTxnChannel,
  failureReason?: string,
): CardTransactionRecord {
  const record: CardTransactionRecord = {
    id: generateTransactionId(),
    referenceId: generateReferenceId(),
    customerId: account.id,
    customerName: account.name,
    accountId: account.accountNumber,
    cardId: card.id,
    cardType: card.type,
    cardLast4: card.number.slice(-4),
    txnType: request.type,
    channel,
    amount: request.amount,
    fee,
    totalDeducted,
    previousBalance,
    currentBalance,
    status,
    failureReason,
    date: new Date().toISOString(),
    merchant: request.merchant,
    recipientDetails: request.recipientAccount ?? request.recipientCardId,
    description: request.description ?? '',
  };
  const records = getCardTxnRecords();
  records.push(record);
  saveCardTxnRecords(records);
  return record;
}

export function validateCard(card: BankCard | undefined): { valid: boolean; reason?: string } {
  if (!card) return { valid: false, reason: 'Card not found' };

  if (card.status === 'frozen') return { valid: false, reason: 'This card is frozen. Please unfreeze it or contact your branch.' };
  if (card.status === 'blocked') return { valid: false, reason: 'This card is blocked. Please contact your branch immediately.' };
  if (card.status === 'pending') return { valid: false, reason: 'This card is pending approval and cannot be used yet.' };
  if (card.status === 'expired' || isCardExpired(card.expiry)) {
    if (card.status !== 'expired') updateCard(card.id, { status: 'expired' });
    return { valid: false, reason: 'This card has expired. Please request a replacement.' };
  }
  if (card.status !== 'active') return { valid: false, reason: `Card status is "${card.status}". Transaction cannot proceed.` };

  const account = getUserByAccount(card.accountNumber);
  if (!account) return { valid: false, reason: 'No customer account is linked to this card.' };
  if (!account.isActive) return { valid: false, reason: 'The linked account is inactive. Please contact your branch.' };

  return { valid: true };
}

function getAvailableBalance(card: BankCard, accountBalance: number): number {
  if (card.type === 'credit' && card.creditLimit !== undefined) {
    return card.creditLimit - (card.currentBalance ?? 0);
  }
  return accountBalance;
}

function applyToAccount(card: BankCard, account: { id: string; balance: number }, amount: number, isDeposit: boolean): number {
  if (card.type === 'credit') {
    // Deposits pay down the owed credit balance; spending increases it.
    const delta = isDeposit ? -amount : amount;
    const newCardBalance = Math.max(0, (card.currentBalance ?? 0) + delta);
    updateCard(card.id, { currentBalance: newCardBalance });
    return account.balance;
  }
  const newBalance = isDeposit ? account.balance + amount : account.balance - amount;
  updateUser(account.id, { balance: newBalance });
  return newBalance;
}

export function processCardTransaction(request: CardTransactionRequest): CardTransactionResult {
  const card = getCardById(request.cardId);
  const txnId = generateTransactionId();
  const refId = generateReferenceId();

  if (!card) {
    return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: 'Card not found.', failureReason: 'Card not found' };
  }

  const channel = request.channel ?? TXN_CHANNELS[request.type];
  const account = getUserByAccount(card.accountNumber);

  // Step 1: Card exists & status validation
  const validation = validateCard(card);
  if (!validation.valid) {
    if (account) {
      createRecord(request, card, { id: account.id, name: account.name, accountNumber: account.accountNumber, balance: account.balance }, 'failed', 0, 0, account.balance, account.balance, channel, validation.reason);
    }
    addCardTransaction({
      cardId: card.id, type: 'purchase', amount: request.amount, merchant: request.merchant, category: request.category,
      date: new Date().toISOString(), status: 'failed', description: `${TXN_LABELS[request.type]} failed — ${validation.reason}`, channel,
    });
    return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: validation.reason ?? 'Validation failed', failureReason: validation.reason, card };
  }

  // account is guaranteed to exist here
  const accountObj = account!;
  const previousBalance = accountObj.balance;

  // Step 2: PIN verification (where required)
  if (PIN_REQUIRED_TYPES.includes(request.type)) {
    if (!request.pin) {
      createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', 0, 0, previousBalance, previousBalance, channel, 'PIN not provided');
      return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: 'PIN is required for this transaction type.', failureReason: 'PIN not provided', card };
    }
    if (!verifyCardPin(card.id, request.pin)) {
      createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', 0, 0, previousBalance, previousBalance, channel, 'Invalid PIN');
      return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: 'Invalid PIN. Transaction declined.', failureReason: 'Invalid PIN', card };
    }
  }

  // Step 3: CVV verification (for online payments)
  if (CVV_REQUIRED_TYPES.includes(request.type)) {
    if (!request.cvv) {
      createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', 0, 0, previousBalance, previousBalance, channel, 'CVV not provided');
      return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: 'CVV is required for online payments.', failureReason: 'CVV not provided', card };
    }
    if (request.cvv !== card.cvv) {
      createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', 0, 0, previousBalance, previousBalance, channel, 'Invalid CVV');
      return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: 'Invalid CVV. Transaction declined.', failureReason: 'Invalid CVV', card };
    }
  }

  // Step 4: International payment check
  if (INTERNATIONAL_TYPES.includes(request.type) && !card.internationalEnabled) {
    createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', 0, 0, previousBalance, previousBalance, channel, 'International payments not enabled');
    return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: 'International payments are not enabled on this card.', failureReason: 'International payments not enabled', card };
  }

  // Step 5: Contactless check
  if (request.type === 'contactless_payment' && !card.contactlessEnabled) {
    createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', 0, 0, previousBalance, previousBalance, channel, 'Contactless payments not enabled');
    return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: 'Contactless payments are not enabled on this card.', failureReason: 'Contactless not enabled', card };
  }

  // Step 6: Per-transaction limit
  const fee = TXN_FEES[request.type];
  const totalDeducted = request.amount + fee;
  const isDeposit = DEPOSIT_TYPES.includes(request.type);
  if (!isDeposit && request.amount > card.perTxnLimit) {
    const reason = `Amount ৳${request.amount.toLocaleString()} exceeds per-transaction limit of ৳${card.perTxnLimit.toLocaleString()}.`;
    createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', fee, 0, previousBalance, previousBalance, channel, reason);
    return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: reason, failureReason: reason, card };
  }

  // Step 7: Daily limit
  const currentCard = resetDailySpentIfNeeded(card);
  if (!isDeposit && currentCard.dailySpent + totalDeducted > currentCard.dailyLimit) {
    const reason = `Daily transaction limit of ৳${currentCard.dailyLimit.toLocaleString()} exceeded. Spent today: ৳${currentCard.dailySpent.toLocaleString()}.`;
    createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', fee, 0, previousBalance, previousBalance, channel, reason);
    return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: reason, failureReason: reason, card };
  }

  // Step 8: Fraud detection
  const fraudCheck = detectFraud(card.id, request.amount);
  if (fraudCheck.fraud) {
    createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', fee, 0, previousBalance, previousBalance, channel, fraudCheck.reason);
    addNotification({ accountNumber: card.accountNumber, message: `Suspicious activity detected on your card ****${card.number.slice(-4)}. Transaction declined.`, type: 'error' });
    return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: fraudCheck.reason ?? 'Fraud detected', failureReason: fraudCheck.reason, card };
  }

  // Step 9: Sufficient balance
  const availableBalance = getAvailableBalance(currentCard, previousBalance);
  if (!isDeposit && availableBalance < totalDeducted) {
    const reason = card.type === 'credit'
      ? `Insufficient credit limit. Available: ৳${availableBalance.toLocaleString()}, needed: ৳${totalDeducted.toLocaleString()}.`
      : `Insufficient balance. Available: ৳${availableBalance.toLocaleString()}, needed: ৳${totalDeducted.toLocaleString()}.`;
    createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', fee, 0, previousBalance, previousBalance, channel, reason);
    addCardTransaction({
      cardId: card.id, type: 'purchase', amount: request.amount, merchant: request.merchant, category: request.category,
      date: new Date().toISOString(), status: 'failed', description: `${TXN_LABELS[request.type]} failed — ${reason}`, channel,
    });
    addTransaction({
      accountNumber: card.accountNumber, type: 'withdraw', amount: request.amount, status: 'failed',
      description: `${TXN_LABELS[request.type]} via card ****${card.number.slice(-4)} — Insufficient balance`,
    });
    return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: reason, failureReason: reason, card };
  }

  // Step 10: Process card-to-card transfer recipient
  if (request.type === 'card_to_card_transfer' && request.recipientCardId) {
    const recipientCard = getCardById(request.recipientCardId);
    if (!recipientCard || recipientCard.status !== 'active') {
      const reason = 'Recipient card is not valid or active.';
      createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', fee, 0, previousBalance, previousBalance, channel, reason);
      return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: reason, failureReason: reason, card };
    }
    const recipientAccount = getUserByAccount(recipientCard.accountNumber);
    if (!recipientAccount) {
      const reason = 'Recipient account not found.';
      createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', fee, 0, previousBalance, previousBalance, channel, reason);
      return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: reason, failureReason: reason, card };
    }
    // Credit recipient
    const recipientNewBalance = recipientAccount.balance + request.amount;
    updateUser(recipientAccount.id, { balance: recipientNewBalance });
    addTransaction({
      accountNumber: recipientCard.accountNumber, type: 'transfer-in', amount: request.amount, status: 'success',
      description: `Card-to-card transfer received from ****${card.number.slice(-4)}`,
      fromAccount: card.accountNumber,
    });
    addNotification({
      accountNumber: recipientCard.accountNumber,
      message: `You received ৳${request.amount.toLocaleString()} via card-to-card transfer from ${accountObj.name}.`,
      type: 'success',
    });
  }

  // Step 11: Process bank transfer recipient
  if (request.type === 'bank_transfer' && request.recipientAccount) {
    const recipientAccount = getUserByAccount(request.recipientAccount);
    if (!recipientAccount) {
      const reason = 'Recipient bank account not found.';
      createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: previousBalance }, 'failed', fee, 0, previousBalance, previousBalance, channel, reason);
      return { success: false, status: 'failed', transactionId: txnId, referenceId: refId, message: reason, failureReason: reason, card };
    }
    const recipientNewBalance = recipientAccount.balance + request.amount;
    updateUser(recipientAccount.id, { balance: recipientNewBalance });
    addTransaction({
      accountNumber: request.recipientAccount, type: 'transfer-in', amount: request.amount, status: 'success',
      description: `Transfer received from ${accountObj.name} (card ****${card.number.slice(-4)})`,
      fromAccount: card.accountNumber,
    });
    addNotification({
      accountNumber: request.recipientAccount,
      message: `You received ৳${request.amount.toLocaleString()} via card transfer from ${accountObj.name}.`,
      type: 'success',
    });
  }

  // Step 12: Apply to linked account (credit for deposits, debit for spending)
  const newBalance = applyToAccount(currentCard, { id: accountObj.id, balance: previousBalance }, totalDeducted, isDeposit);
  const finalBalance = card.type === 'credit' ? previousBalance : newBalance;

  // Update daily spent (deposits don't count against spending limits)
  const newDailySpent = isDeposit ? currentCard.dailySpent : currentCard.dailySpent + totalDeducted;
  updateCard(card.id, { dailySpent: newDailySpent });

  // Step 13: Create records
  const record = createRecord(request, card, { id: accountObj.id, name: accountObj.name, accountNumber: accountObj.accountNumber, balance: finalBalance }, 'success', fee, totalDeducted, previousBalance, finalBalance, channel);

  addCardTransaction({
    cardId: card.id, type: isDeposit ? 'refund' : 'purchase', amount: request.amount, merchant: request.merchant, category: request.category,
    date: new Date().toISOString(), status: 'completed', description: `${TXN_LABELS[request.type]} at ${request.merchant}`,
    channel, referenceId: record.referenceId, fee, previousBalance, currentBalance: finalBalance,
  });

  addTransaction({
    accountNumber: card.accountNumber, type: isDeposit ? 'deposit' : 'withdraw', amount: totalDeducted, status: 'success',
    description: `${TXN_LABELS[request.type]} — ${request.merchant} (Card ****${card.number.slice(-4)})`,
  });

  addNotification({
    accountNumber: card.accountNumber,
    message: `${TXN_LABELS[request.type]} of ৳${totalDeducted.toLocaleString()} at ${request.merchant} was successful. ${card.type === 'credit' ? 'Card balance' : (isDeposit ? 'New balance' : 'Remaining balance')}: ৳${finalBalance.toLocaleString()}`,
    type: 'success',
  });

  return {
    success: true,
    status: 'success',
    transactionId: record.id,
    referenceId: record.referenceId,
    message: `Transaction successful. ৳${totalDeducted.toLocaleString()} ${card.type === 'credit' ? (isDeposit ? 'paid towards card balance' : 'charged to card') : (isDeposit ? 'credited to account' : 'deducted from account')}.`,
    deductedAmount: request.amount,
    fee,
    remainingBalance: finalBalance,
    previousBalance,
    card: { ...currentCard, dailySpent: newDailySpent },
  };
}

export function cancelCardTransaction(request: CardTransactionRequest): CardTransactionResult {
  const card = getCardById(request.cardId);
  const transactionId = generateTransactionId();
  const referenceId = generateReferenceId();

  if (card) {
    const account = getUserByAccount(card.accountNumber);
    if (account) {
      createRecord(request, card, { id: account.id, name: account.name, accountNumber: account.accountNumber, balance: account.balance }, 'cancelled', 0, 0, account.balance, account.balance, request.channel ?? TXN_CHANNELS[request.type], 'Transaction cancelled by user');
    }
  }

  return {
    success: false,
    status: 'cancelled',
    transactionId,
    referenceId,
    message: 'Transaction was cancelled.',
    failureReason: 'Cancelled by user',
    card,
  };
}
