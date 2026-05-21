import { TrendingDown, TrendingUp, Wallet, Calendar } from 'lucide-react';
import { formatCurrency, sumByType, filterByPeriod } from '@/lib/expenseUtils';

export default function SummaryCards({ expenses, period }) {
  const filtered = filterByPeriod(expenses, period);
  const totalExpense = sumByType(filtered, 'expense');
  const totalIncome = sumByType(filtered, 'income');
  const net = totalIncome - totalExpense;

  const periodLabel = period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'This Month';

  return (
    <div className="space-y-3">
      {/* Main Balance Card */}
      <div className="gradient-card rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm font-medium">{periodLabel} · Total Spent</p>
            <p className="text-4xl font-extrabold mt-1 tracking-tight">
              {formatCurrency(totalExpense)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 bg-white/15 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 text-green-300" />
              <span className="text-white/70 text-xs font-medium">Income</span>
            </div>
            <p className="text-white font-bold">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-4 h-4 text-red-300" />
              <span className="text-white/70 text-xs font-medium">Expenses</span>
            </div>
            <p className="text-white font-bold">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-4 h-4 text-blue-300" />
              <span className="text-white/70 text-xs font-medium">Net</span>
            </div>
            <p className={`font-bold ${net >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {net >= 0 ? '+' : ''}{formatCurrency(Math.abs(net))}
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Daily', period: 'daily', expenses },
          { label: 'Weekly', period: 'weekly', expenses },
          { label: 'Monthly', period: 'monthly', expenses },
        ].map(item => {
          const total = sumByType(filterByPeriod(item.expenses, item.period), 'expense');
          return (
            <div key={item.period} className="bg-card rounded-2xl p-3 border border-border">
              <p className="text-muted-foreground text-xs font-medium">{item.label}</p>
              <p className="text-foreground font-bold text-sm mt-1">{formatCurrency(total)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}