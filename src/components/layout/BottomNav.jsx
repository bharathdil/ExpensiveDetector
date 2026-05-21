import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, PlusCircle, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/transactions', icon: ListOrdered, label: 'History' },
  null, // placeholder for center Add button
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav({ onAdd }) {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50">
      <div className="w-full max-w-md mx-auto flex items-center justify-around px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        {NAV_ITEMS.map((item, i) => {
          if (item === null) {
            return (
              <button
                key="add"
                onClick={onAdd}
                className="select-none w-14 h-14 shrink-0 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform"
              >
                <PlusCircle className="w-7 h-7 text-primary-foreground" />
              </button>
            );
          }
          const isActive = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'select-none flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-1.5 rounded-xl transition-colors active:bg-muted/60',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon
                className={cn('w-5 h-5', isActive && 'fill-primary/20')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
