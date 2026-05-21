import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';
import AddExpenseSheet from '@/components/expense/AddExpenseSheet';
import AnimatedRoutes from '@/components/layout/AnimatedRoutes';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { db } from '@/api/localStorageClient';

export default function AppShell() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => db.entities.Expense.create(data),
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      const previous = queryClient.getQueryData(['expenses']);
      // Optimistic: prepend a fake record immediately
      queryClient.setQueryData(['expenses'], (old = []) => [
        { ...newExpense, id: `temp-${Date.now()}`, created_date: new Date().toISOString() },
        ...old,
      ]);
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['expenses'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const handleSave = (data) => mutation.mutate(data);

  return (
    <div className="mobile-shell">
      <AnimatedRoutes>
        <Outlet />
      </AnimatedRoutes>
      <BottomNav onAdd={() => setAddOpen(true)} />
      <AddExpenseSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleSave}
        prefill={null}
      />
    </div>
  );
}
