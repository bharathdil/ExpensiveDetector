import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { db } from '@/api/supabaseClient';
import { Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import TransactionItem from '@/components/expense/TransactionItem';
import FilterPanel from '@/components/transactions/FilterPanel';
import PageHeader from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DEFAULT_FILTERS = { category: 'all', type: 'all', location: '', dateFrom: '', dateTo: '' };

export default function Transactions() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => db.entities.Expense.list('-date', 500),
  });

  // All unique locations from expenses
  const locations = [...new Set(expenses.map(e => e.location).filter(Boolean))];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await db.entities.Expense.delete(deleteTarget.id);
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    setDeleteTarget(null);
  };

  const filtered = expenses.filter(e => {
    const matchSearch = !search ||
      (e.merchant || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.note || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.location || '').toLowerCase().includes(search.toLowerCase());

    const matchCat = filters.category === 'all' || e.category === filters.category;
    const matchType = filters.type === 'all' || e.type === filters.type;

    const matchLocation = !filters.location ||
      (e.location || '').toLowerCase().includes(filters.location.toLowerCase());

    const d = typeof e.date === 'string' ? parseISO(e.date) : new Date(e.date);
    const matchFrom = !filters.dateFrom || isAfter(d, startOfDay(new Date(filters.dateFrom)));
    const matchTo = !filters.dateTo || isBefore(d, endOfDay(new Date(filters.dateTo)));

    return matchSearch && matchCat && matchType && matchLocation && matchFrom && matchTo;
  });

  // Group by date
  const grouped = filtered.reduce((acc, exp) => {
    const d = typeof exp.date === 'string' ? parseISO(exp.date) : new Date(exp.date);
    const key = format(d, 'MMMM d, yyyy');
    if (!acc[key]) acc[key] = [];
    acc[key].push(exp);
    return acc;
  }, {});

  const totalFiltered = filtered.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader />
      {/* Filters */}
      <div className="sticky top-[64px] bg-background/95 backdrop-blur z-20 px-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <span />

          {filtered.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{filtered.length} results</p>
              <p className="text-sm font-bold text-foreground">₹{totalFiltered.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Search + Filter row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-muted border-0"
            />
          </div>
          <FilterPanel filters={filters} onChange={setFilters} locations={locations} />
        </div>

        {/* Active filter chips */}
        {(filters.dateFrom || filters.dateTo || filters.location) && (
          <div className="flex gap-2 flex-wrap">
            {filters.dateFrom && (
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-xl">
                From: {filters.dateFrom}
              </span>
            )}
            {filters.dateTo && (
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-xl">
                To: {filters.dateTo}
              </span>
            )}
            {filters.location && (
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-xl">
                📍 {filters.location}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-4 space-y-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-muted-foreground">No transactions found</p>
            <button
              onClick={() => { setFilters(DEFAULT_FILTERS); setSearch(''); }}
              className="mt-3 text-primary text-sm font-semibold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => {
            const dayTotal = items.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{date}</p>
                  {dayTotal > 0 && (
                    <p className="text-xs font-bold text-muted-foreground">₹{dayTotal.toLocaleString()}</p>
                  )}
                </div>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  {items.map((exp, idx) => (
                    <div
                      key={exp.id}
                      className={cn('group relative', idx > 0 && 'border-t border-border/50')}
                    >
                      <TransactionItem expense={exp} />
                      <button
                        onClick={() => setDeleteTarget(exp)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove ₹{deleteTarget?.amount} from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
