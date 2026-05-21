import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const BACK_ROUTES = ['/transactions', '/analytics', '/settings'];

const TITLES = {
  '/transactions': 'Transactions',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export default function PageHeader({ title, rightSlot }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const showBack = BACK_ROUTES.includes(pathname);
  const pageTitle = title || TITLES[pathname] || '';

  if (!showBack && !title) return null;

  return (
    <div className={cn(
      'sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/50',
      'px-4 pb-3 pt-safe',
    )}>
      <div className="flex items-center gap-2 h-12">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="select-none -ml-1 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" strokeWidth={2.5} />
          </button>
        )}
        <h1 className="text-xl font-extrabold text-foreground flex-1">{pageTitle}</h1>
        {rightSlot && <div>{rightSlot}</div>}
      </div>
    </div>
  );
}