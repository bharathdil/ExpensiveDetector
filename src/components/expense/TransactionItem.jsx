import { getCategoryConfig } from '@/lib/categoryConfig';
import { format, parseISO } from 'date-fns';
import { MapPin, Zap } from 'lucide-react';

export default function TransactionItem({ expense, onClick }) {
  const config = getCategoryConfig(expense.category);
  const isIncome = expense.type === 'income';
  const date = typeof expense.date === 'string' ? parseISO(expense.date) : new Date(expense.date);

  return (
    <button
      onClick={() => onClick?.(expense)}
      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-colors text-left"
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 bg-${config.color}-100`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-foreground text-sm truncate">
            {expense.merchant || config.label}
          </p>
          {expense.source === 'auto_detected' && (
            <Zap className="w-3 h-3 text-primary flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs text-muted-foreground">
            {format(date, 'MMM d, h:mm a')}
          </p>
          {expense.location && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground truncate">{expense.location}</p>
            </>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className={`font-bold text-sm ${isIncome ? 'text-green-600' : 'text-foreground'}`}>
          {isIncome ? '+' : '-'}₹{expense.amount?.toLocaleString()}
        </p>
        <p className={`text-xs mt-0.5 text-${config.color}-600 font-medium`}>{config.label}</p>
      </div>
    </button>
  );
}