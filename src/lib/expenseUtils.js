import { startOfDay, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns';

export function filterByPeriod(expenses, period) {
  const now = new Date();
  let start;
  if (period === 'daily') start = startOfDay(now);
  else if (period === 'weekly') start = startOfWeek(now, { weekStartsOn: 1 });
  else if (period === 'monthly') start = startOfMonth(now);
  else return expenses;

  return expenses.filter(e => {
    const d = typeof e.date === 'string' ? parseISO(e.date) : new Date(e.date);
    return isAfter(d, start) || d.getTime() === start.getTime();
  });
}

export function sumByType(expenses, type) {
  return expenses
    .filter(e => e.type === type)
    .reduce((acc, e) => acc + (e.amount || 0), 0);
}

export function groupByCategory(expenses) {
  const groups = {};
  expenses.filter(e => e.type === 'expense').forEach(e => {
    const cat = e.category || 'other';
    if (!groups[cat]) groups[cat] = 0;
    groups[cat] += e.amount || 0;
  });
  return Object.entries(groups)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function formatCurrency(amount, currency = '₹') {
  if (amount >= 100000) return `${currency}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(1)}K`;
  return `${currency}${amount.toFixed(2)}`;
}

export function groupByDay(expenses, days = 7) {
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' });
    const total = expenses
      .filter(e => {
        const d = typeof e.date === 'string' ? parseISO(e.date) : new Date(e.date);
        return d.toDateString() === day.toDateString() && e.type === 'expense';
      })
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    result.push({ day: dayStr, amount: total });
  }
  return result;
}