import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { CATEGORY_LIST } from '@/lib/categoryConfig';
import { cn } from '@/lib/utils';

const createForm = (prefill) => ({
  amount: prefill?.amount || '',
  type: prefill?.type || 'expense',
  category: prefill?.category || 'other',
  merchant: prefill?.merchant || '',
  note: prefill?.note || '',
  location: prefill?.location || '',
  date: prefill?.date ? new Date(prefill.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
});

const TYPES = [
  { value: 'expense', label: '💸 Expense' },
  { value: 'income', label: '💰 Income' },
];

export default function AddExpenseSheet({ open, onOpenChange, onSave, prefill }) {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(() => createForm(prefill));

  useEffect(() => {
    if (open) {
      setForm(createForm(prefill));
    }
  }, [open, prefill]);

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return;

    try {
      setIsSaving(true);
      await onSave({
        ...form,
        amount: parseFloat(form.amount),
        date: new Date(form.date).toISOString(),
        source: prefill?.source || 'manual',
        raw_message: prefill?.raw_message || '',
        sms_id: prefill?.sms_id || '',
        sms_sender: prefill?.sms_sender || '',
        sms_date: prefill?.sms_date || null,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Could not save transaction',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto pb-8">
        <SheetHeader className="mb-5">
          <SheetTitle className="text-xl font-bold">
            {prefill?.source === 'auto_detected' ? '⚡ Confirm Transaction' : '+ Add Transaction'}
          </SheetTitle>
        </SheetHeader>

        {prefill?.raw_message && (
          <div className="mb-4 p-3 bg-primary/10 rounded-xl text-sm text-muted-foreground">
            <p className="font-medium text-primary mb-1">Detected from message:</p>
            <p className="line-clamp-2">{prefill.raw_message}</p>
          </div>
        )}

        {/* Type Toggle */}
        <div className="flex gap-2 mb-4">
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => handleChange('type', t.value)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
                form.type === t.value
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="mb-4">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Amount</Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">₹</span>
            <Input
              type="number"
              placeholder="0.00"
              value={form.amount}
              onChange={e => handleChange('amount', e.target.value)}
              className="pl-8 text-2xl font-bold h-14 rounded-xl"
            />
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Category</Label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORY_LIST.map(cat => (
              <button
                key={cat.value}
                onClick={() => handleChange('category', cat.value)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-xs font-medium',
                  form.category === cat.value
                    ? `border-${cat.color}-400 bg-${cat.color}-50 text-${cat.color}-700`
                    : 'border-border bg-card text-muted-foreground'
                )}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="line-clamp-1 text-center">{cat.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Merchant */}
        <div className="mb-4">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Merchant / Payee</Label>
          <Input
            placeholder="e.g. Swiggy, Amazon..."
            value={form.merchant}
            onChange={e => handleChange('merchant', e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Date & Time</Label>
          <Input
            type="datetime-local"
            value={form.date}
            onChange={e => handleChange('date', e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Location */}
        <div className="mb-4">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Location (optional)</Label>
          <Input
            placeholder="e.g. Mumbai, Delhi..."
            value={form.location}
            onChange={e => handleChange('location', e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Note */}
        <div className="mb-6">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Note (optional)</Label>
          <Textarea
            placeholder="Add a note..."
            value={form.note}
            onChange={e => handleChange('note', e.target.value)}
            className="rounded-xl resize-none"
            rows={2}
          />
        </div>

        <Button
          onClick={handleSave}
          className="w-full h-13 rounded-xl text-base font-bold"
          disabled={!form.amount || parseFloat(form.amount) <= 0}
        >
          {prefill?.source === 'auto_detected' ? '✓ Confirm & Save' : '+ Save Transaction'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
