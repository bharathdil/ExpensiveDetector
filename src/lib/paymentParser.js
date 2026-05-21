import { detectCategory, INCOME_KEYWORDS } from './categoryConfig';

/**
 * Parse a payment message/notification to extract transaction details
 */
export function parsePaymentMessage(message) {
  if (!message || message.trim().length < 5) return null;

  const text = message.trim();
  const lower = text.toLowerCase();

  // Detect if income or expense
  const isIncome = INCOME_KEYWORDS.some(kw => lower.includes(kw));

  // Extract amount - supports INR, Rs, ₹, $, EUR, etc.
  const amountPatterns = [
    /(?:inr|rs\.?|₹|\$|usd|eur|€)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:inr|rs\.?|₹|\$|usd|eur|€)/i,
    /(?:amount|amt)[:\s]+(?:inr|rs\.?|₹|\$)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:debited|credited|paid|received)[^\d]*([\d,]+(?:\.\d{1,2})?)/i,
  ];

  let amount = null;
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  if (!amount || amount <= 0) return null;

  // Extract merchant name
  const merchantPatterns = [
    /(?:at|to|from|@)\s+([A-Za-z][A-Za-z0-9\s&'-]{1,40}?)(?:\s+on|\s+via|\s+using|\.|,|$)/i,
    /(?:paid to|payment to|transferred to)\s+([A-Za-z][A-Za-z0-9\s&'-]{1,40}?)(?:\s+on|\.|,|$)/i,
    /(?:debit|purchase) at\s+([A-Za-z][A-Za-z0-9\s&'-]{1,40}?)(?:\.|,|$)/i,
  ];

  let merchant = '';
  for (const pattern of merchantPatterns) {
    const match = text.match(pattern);
    if (match) {
      merchant = match[1].trim();
      break;
    }
  }

  // Extract date if present
  const datePatterns = [
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i,
  ];

  let date = new Date().toISOString();
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) {
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
    merchant: merchant || '',
    date,
    source: 'auto_detected',
    raw_message: text,
  };
}