import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import AddExpenseSheet from '@/components/expense/AddExpenseSheet';
import { db } from '@/api/localStorageClient';
import { getPendingPaymentTransactions } from '@/lib/smsReader';

export default function PaymentAlertHandler() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState([]);
  const [current, setCurrent] = useState(null);

  const loadPending = useCallback(async () => {
    const transactions = await getPendingPaymentTransactions();
    if (transactions.length === 0) return;

    setPending(prev => {
      const known = new Set(prev.map(item => item._id));
      return [...prev, ...transactions.filter(item => !known.has(item._id))];
    });
  }, []);

  useEffect(() => {
    loadPending();

    const handleFocus = () => loadPending();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadPending();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadPending]);

  useEffect(() => {
    if (!current && pending.length > 0) {
      const [next, ...rest] = pending;
      setCurrent(next);
      setPending(rest);
    }
  }, [current, pending]);

  const closeCurrent = () => {
    setCurrent(null);
  };

  const saveCurrent = async (data) => {
    await db.entities.Expense.create(data);
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    setCurrent(null);
  };

  return (
    <AddExpenseSheet
      key={current?._id || 'payment-alert'}
      open={Boolean(current)}
      onOpenChange={(open) => {
        if (!open) closeCurrent();
      }}
      onSave={saveCurrent}
      prefill={current}
    />
  );
}
