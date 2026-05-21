import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { db } from '@/api/supabaseClient';
import RecommendedTransactions from '@/components/dashboard/RecommendedTransactions';
import PullToRefresh from '@/components/layout/PullToRefresh';
import SummaryCards from '@/components/dashboard/SummaryCards';
import SpendingChart from '@/components/dashboard/SpendingChart';
import CategoryBreakdown from '@/components/dashboard/CategoryBreakdown';
import TransactionItem from '@/components/expense/TransactionItem';
import AddExpenseSheet from '@/components/expense/AddExpenseSheet';
import PaymentDetector from '@/components/detector/PaymentDetector';
import { cn } from '@/lib/utils';

const PERIODS = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'Week' },
  { value: 'monthly', label: 'Month' },
];

export default function Dashboard({ onAddExpense, confirmPrefill, setConfirmPrefill }) {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('monthly');
  const [addOpen, setAddOpen] = useState(false);

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => db.entities.Expense.list('-date', 200),
  });

  const handleDetected = (parsed) => {
    setConfirmPrefill(parsed);
    setAddOpen(true);
  };

  const handleSave = async (data) => {
    await db.entities.Expense.create(data);
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  };

  const recentExpenses = [...expenses].slice(0, 5);
  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ['expenses'] });

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur z-30 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Good day 👋</p>
            <h1 className="text-2xl font-extrabold text-foreground">SmartSpend</h1>
          </div>
          <div className="flex items-center gap-2">
            <PaymentDetector onDetected={handleDetected} />
          </div>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-1 bg-muted rounded-2xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-semibold transition-all',
                period === p.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
      <div className="px-4 space-y-4">
        <SummaryCards expenses={expenses} period={period} />
        <RecommendedTransactions existingExpenses={expenses} onSave={handleSave} />
        <SpendingChart expenses={expenses} />
        <CategoryBreakdown expenses={expenses} />

        {/* Recent Transactions */}
        <div className="bg-card rounded-3xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base text-foreground">Recent</h3>
            <a href="/transactions" className="text-primary text-sm font-semibold">See all</a>
          </div>
          {recentExpenses.length > 0 ? (
            <div className="divide-y divide-border/50">
              {recentExpenses.map(exp => (
                <TransactionItem key={exp.id} expense={exp} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-4xl mb-2">💳</p>
              <p className="text-muted-foreground text-sm">No transactions yet.<br />Tap + to add your first one!</p>
            </div>
          )}
        </div>
      </div>

      </PullToRefresh>

      <AddExpenseSheet
        open={addOpen}
        onOpenChange={(v) => { setAddOpen(v); if (!v) setConfirmPrefill(null); }}
        onSave={handleSave}
        prefill={confirmPrefill}
      />
    </div>
  );
}
