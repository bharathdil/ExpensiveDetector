import { Capacitor, registerPlugin } from '@capacitor/core';
import { parsePaymentMessage } from '@/lib/paymentParser';

export const SmsReader = registerPlugin('SmsReader');

export function isSmsReaderAvailable() {
  return Capacitor.getPlatform() === 'android';
}

export async function readRecentSmsMessages(limit = 80) {
  if (!isSmsReaderAvailable()) {
    return {
      messages: [],
      unavailableReason: 'SMS scanning is available only in the installed Android app.',
    };
  }

  const result = await SmsReader.readRecentMessages({ limit });
  return {
    messages: Array.isArray(result?.messages) ? result.messages : [],
    unavailableReason: '',
  };
}

export async function scanRecentPaymentMessages({ limit = 80, existingExpenses = [] } = {}) {
  const { messages, unavailableReason } = await readRecentSmsMessages(limit);

  const seen = new Set();
  const parsed = messages
    .map((message) => {
      const rawMessage = message.body || '';
      const parsedMessage = parsePaymentMessage(rawMessage);
      if (!parsedMessage) return null;

      const key = `${message.id || message.date}-${parsedMessage.amount}-${parsedMessage.type}`;
      if (seen.has(key)) return null;
      seen.add(key);

      return {
        ...parsedMessage,
        _id: key,
        sms_id: message.id,
        sms_sender: message.address || '',
        sms_date: message.date || null,
        date: message.date ? new Date(Number(message.date)).toISOString() : parsedMessage.date,
        raw_message: rawMessage,
      };
    })
    .filter(Boolean)
    .filter((transaction) => {
      return !existingExpenses.some((expense) => {
        const sameAmount = Math.abs((expense.amount || 0) - transaction.amount) < 1;
        const sameType = (expense.type || 'expense') === transaction.type;
        const sameRaw = expense.raw_message && expense.raw_message === transaction.raw_message;
        const sameSms = expense.sms_id && expense.sms_id === transaction.sms_id;
        return sameAmount && sameType && (sameRaw || sameSms);
      });
    });

  return {
    transactions: parsed,
    totalMessages: messages.length,
    unavailableReason,
  };
}

export async function setPaymentAlertsEnabled(enabled) {
  if (!isSmsReaderAvailable()) {
    return {
      enabled: false,
      unavailableReason: 'Payment alerts are available only in the installed Android app.',
    };
  }

  return SmsReader.setPaymentAlertsEnabled({ enabled });
}

export async function getPaymentAlertsStatus() {
  if (!isSmsReaderAvailable()) {
    return {
      enabled: false,
      unavailableReason: 'Payment alerts are available only in the installed Android app.',
    };
  }

  return SmsReader.getPaymentAlertsStatus();
}

export async function getPendingPaymentTransactions() {
  if (!isSmsReaderAvailable()) {
    return [];
  }

  const result = await SmsReader.getPendingPaymentMessages();
  const messages = Array.isArray(result?.messages) ? result.messages : [];
  const parsed = messages
    .map((message) => {
      const parsedMessage = parsePaymentMessage(message.body || '');
      if (!parsedMessage) return null;

      return {
        ...parsedMessage,
        _id: message.id || `pending-${message.date}`,
        sms_id: message.id || '',
        sms_sender: message.address || '',
        sms_date: message.date || null,
        date: message.date ? new Date(Number(message.date)).toISOString() : parsedMessage.date,
        raw_message: message.body || '',
      };
    })
    .filter(Boolean);

  if (messages.length > 0) {
    await SmsReader.clearPendingPaymentMessages();
  }

  return parsed;
}
