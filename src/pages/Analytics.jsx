import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import PageHeader from '@/components/layout/PageHeader';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { groupByCategory, filterByPeriod, sumByType, formatCurrency } from '@/lib/expenseUtils';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { groupByDay } from '@/lib/expenseUtils';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

const PERIODS = [
  { value: 'weekly', label: 'Week' },
  { value: 'monthly', label: 'Month' },
  { value: 'all', label: 'All Time' },
];

export default function Analytics() {
  const [period, setPeriod] = useState('monthly');

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => db.entities.Expense.list('-date', 500),
  });

  const filtered = filterByPeriod(expenses, period);
  const categoryData = groupByCategory(filtered);
  const totalExpense = sumByType(filtered, 'expense');
  const totalIncome = sumByType(filtered, 'income');

  const chartData = groupByDay(filtered.filter(e => e.type === 'expense'), 30);
  const weekData = groupByDay(filtered.filter(e => e.type === 'expense'), 7);

  // Locations
  const locationData = filtered
    .filter(e => e.location && e.type === 'expense')
    .reduce((acc, e) => {
      acc[e.location] = (acc[e.location] || 0) + e.amount;
      return acc;
    }, {});
  const locations = Object.entries(locationData).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader />
      <div className="sticky top-[64px] bg-background/95 backdrop-blur z-20 px-4 pb-3">
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-semibold transition-all',
                period === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Insight Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Total Spent</p>
            <p className="text-2xl font-extrabold text-foreground">{formatCurrency(totalExpense)}</p>
            <p className="text-xs text-muted-foreground mt-1">{filtered.filter(e => e.type === 'expense').length} transactions</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Total Income</p>
            <p className="text-2xl font-extrabold text-green-600">{formatCurrency(totalIncome)}</p>
            <p className="text-xs text-muted-foreground mt-1">Savings rate: {savingsRate}%</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Avg/Day</p>
            <p className="text-2xl font-extrabold text-foreground">
              {formatCurrency(totalExpense / Math.max(period === 'weekly' ? 7 : period === 'monthly' ? 30 : 30, 1))}
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Top Category</p>
            {categoryData[0] ? (
              <>
                <p className="text-xl">
                  {getCategoryConfig(categoryData[0].category).icon}
                </p>
                <p className="text-sm font-bold text-foreground mt-1">
                  {getCategoryConfig(categoryData[0].category).label}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-card rounded-3xl p-4 border border-border">
          <h3 className="font-bold text-base mb-4 text-foreground">Spending Trend (30 days)</h3>
          {chartData.some(d => d.amount > 0) ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis hide />
                <Tooltip
                  formatter={v => [`₹${v.toLocaleString()}`, 'Spent']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Not enough data</p>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <div className="bg-card rounded-3xl border border-border p-4">
            <h3 className="font-bold text-base mb-4 text-foreground">Category Breakdown</h3>
            <div className="space-y-3">
              {categoryData.map((item) => {
                const config = getCategoryConfig(item.category);
                const pct = totalExpense > 0 ? (item.total / totalExpense) * 100 : 0;
                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-foreground">
                        {config.icon} {config.label}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground">₹{item.total.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-2">{Math.round(pct)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-${config.color}-500 transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Spending Locations */}
        {locations.length > 0 && (
          <div className="bg-card rounded-3xl border border-border p-4">
            <h3 className="font-bold text-base mb-4 text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Spending Locations
            </h3>
            <div className="space-y-3">
              {locations.map(([loc, amt]) => (
                <div key={loc} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{loc}</span>
                  </div>
                  <span className="text-sm font-bold">₹{amt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
