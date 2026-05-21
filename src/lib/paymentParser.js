import { detectCategory, INCOME_KEYWORDS } from './categoryConfig';

const TRANSACTION_KEYWORDS = [
  'debited', 'debit', 'credited', 'credit', 'paid', 'spent', 'purchase',
  'withdrawn', 'transferred', 'received', 'deposited', 'upi', 'imps',
  'neft', 'rtgs', 'atm', 'pos', 'txn', 'transaction', 'a/c', 'account',
];

const EXPENSE_KEYWORDS = [
  'debited', 'debit', 'paid', 'spent', 'purchase', 'withdrawn',
  'sent to', 'transferred to',
];

const AMOUNT_PATTERNS = [
  /(?:inr|rs\.?|₹|\u20b9|\$|usd|eur|€)\s*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)\s*(?:inr|rs\.?|₹|\u20b9|\$|usd|eur|€)/i,
  /(?:amount|amt)[:\s]+(?:inr|rs\.?|₹|\u20b9|\$)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /(?:debited|credited|paid|received|spent|withdrawn)[^\d]*([\d,]+(?:\.\d{1,2})?)/i,
];

const MERCHANT_PATTERNS = [
  /(?:\sat\s|\sto\s|\sfrom\s|\s@\s)([A-Za-z][A-Za-z0-9\s&'.-]{1,48}?)(?:\s+on|\s+via|\s+using|\s+upi|\s+ref|\.|,|$)/i,
  /(?:paid to|payment to|transferred to|sent to)\s+([A-Za-z][A-Za-z0-9\s&'.-]{1,48}?)(?:\s+on|\s+via|\s+upi|\.|,|$)/i,
  /(?:debit|purchase|spent) at\s+([A-Za-z][A-Za-z0-9\s&'.-]{1,48}?)(?:\s+on|\s+via|\.|,|$)/i,
  /(?:credited from|received from)\s+([A-Za-z][A-Za-z0-9\s&'.-]{1,48}?)(?:\s+on|\s+via|\.|,|$)/i,
];

const DATE_PATTERNS = [
  /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i,
];

/**
 * Parse a bank/payment SMS or notification to extract transaction details.
 */
export function parsePaymentMessage(message) {
  if (!message || message.trim().length < 5) return null;

  const text = message.trim();
  const lower = text.toLowerCase();

  if (!TRANSACTION_KEYWORDS.some(kw => lower.includes(kw))) {
    return null;
  }

  const isExpense = EXPENSE_KEYWORDS.some(kw => lower.includes(kw));
  const isIncome = !isExpense && INCOME_KEYWORDS.some(kw => lower.includes(kw));

  let amount = null;
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  if (!amount || amount <= 0) return null;

  let merchant = '';
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      merchant = match[1].replace(/\s+/g, ' ').trim();
      break;
    }
  }

  let date = new Date().toISOString();
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed.toISOString();
        break;
      }
    }
  }

  const category = detectCategory(merchant || text);

  return {
    amount,
    type: isIncome ? 'income' : 'expense',
    category,
    merchant,
    date,
    source: 'auto_detected',
    raw_message: text,
  };
}
