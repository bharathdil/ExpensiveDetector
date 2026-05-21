import { useState } from 'react';
import { Filter, X, MapPin, Calendar } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CATEGORY_LIST } from '@/lib/categoryConfig';
import { cn } from '@/lib/utils';

export default function FilterPanel({ filters, onChange, locations }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(filters);

  const activeCount = [
    filters.category !== 'all',
    filters.type !== 'all',
    !!filters.location,
    !!filters.dateFrom,
    !!filters.dateTo,
  ].filter(Boolean).length;

  const apply = () => { onChange(local); setOpen(false); };
  const reset = () => {
    const cleared = { category: 'all', type: 'all', location: '', dateFrom: '', dateTo: '' };
    setLocal(cleared);
    onChange(cleared);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => { setLocal(filters); setOpen(true); }}
        className={cn(
          'relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
          activeCount > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" /> Advanced Filters
            </SheetTitle>
          </SheetHeader>

          {/* Type */}
          <div className="mb-5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Type</Label>
            <div className="flex gap-2">
              {[['all', 'All'], ['expense', '💸 Expense'], ['income', '💰 Income']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setLocal(l => ({ ...l, type: val }))}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-sm font-semibold transition-all',
                    local.type === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="mb-5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Category</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setLocal(l => ({ ...l, category: 'all' }))}
                className={cn(
                  'py-2 rounded-xl text-sm font-semibold transition-all',
                  local.category === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                All
              </button>
              {CATEGORY_LIST.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setLocal(l => ({ ...l, category: cat.value }))}
                  className={cn(
                    'py-2 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-0.5',
                    local.category === cat.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <span>{cat.icon}</span>
                  <span className="text-[10px]">{cat.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Date Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">From</p>
                <Input
                  type="date"
                  value={local.dateFrom}
                  onChange={e => setLocal(l => ({ ...l, dateFrom: e.target.value }))}
                  className="rounded-xl text-sm"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">To</p>
                <Input
                  type="date"
                  value={local.dateTo}
                  onChange={e => setLocal(l => ({ ...l, dateTo: e.target.value }))}
                  className="rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Location
            </Label>
            {locations.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-2">
                {['', ...locations].map(loc => (
                  <button
                    key={loc || 'all'}
                    onClick={() => setLocal(l => ({ ...l, location: loc }))}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-sm font-semibold transition-all',
                      local.location === loc ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {loc || 'All Locations'}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                placeholder="Filter by location..."
                value={local.location}
                onChange={e => setLocal(l => ({ ...l, location: e.target.value }))}
                className="rounded-xl"
              />
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} className="flex-1 rounded-xl">
              <X className="w-4 h-4 mr-1" /> Reset
            </Button>
            <Button onClick={apply} className="flex-1 rounded-xl font-bold">
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}