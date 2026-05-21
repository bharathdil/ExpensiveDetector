import { useState, useEffect } from 'react';
import { Sparkles, Plus, X, RefreshCw } from 'lucide-react';
import { parsePaymentMessage } from '@/lib/paymentParser';
import { getCategoryConfig } from '@/lib/categoryConfig';
import AddExpenseSheet from '@/components/expense/AddExpenseSheet';

// Simulated recent payment messages (like what would come from SMS/notification reader)
const SIMULATED_MESSAGES = [
  'Your A/c XX9102 debited INR 349.00 at Zomato on 18-04-2026. UPI Ref: 1234567890',
  'You have paid Rs.799 to Spotify via UPI on 18-04-2026.',
  'INR 120.00 debited from your account at Rapido Cab on 17-04-2026.',
  'Rs 2499 debited at Myntra on 17-04-2026 via Credit Card.',
  'Your account debited by INR 85.00 at Café Coffee Day on 16-04-2026.',
  'INR 1500.00 credited to your account. Ref: Freelance Payment.',
  'Rs 450 paid to Big Bazaar via UPI on 16-04-2026.',
  'Debited INR 299.00 at BookMyShow for Movie Tickets on 15-04-2026.',
];

export default function RecommendedTransactions({ existingExpenses, onSave }) {
  const [recommendations, setRecommendations] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [confirmItem, setConfirmItem] = useState(null);
  const [scanning, setScanning] = useState(false);

  const generateRecommendations = () => {
    setScanning(true);
    setTimeout(() => {
      // Parse all sample messages
      const parsed = SIMULATED_MESSAGES
        .map((msg, idx) => {
          const result = parsePaymentMessage(msg);
          if (!result) return null;
          return { ...result, _id: idx, raw_message: msg };
        })
        .filter(Boolean);

      // Filter out ones that look like they're already in existing expenses
      // (simple heuristic: match by amount + merchant similarity)
      const filtered = parsed.filter(rec => {
        return !existingExpenses.some(e =>
          Math.abs((e.amount || 0) - rec.amount) < 1 &&
          (e.merchant || '').toLowerCase().includes((rec.merchant || '').toLowerCase().split(' ')[0])
        );
      });

      setRecommendations(filtered);
      setScanning(false);
    }, 1200);
  };

  useEffect(() => {
    generateRecommendations();
  }, []);

  const visible = recommendations.filter(r => !dismissed.has(r._id));

  if (visible.length === 0 && !scanning) return null;

  return (
    <>
      <div className="bg-card rounded-3xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Detected Payments</h3>
              <p className="text-xs text-muted-foreground">From recent messages</p>
            </div>
          </div>
          <button
            onClick={generateRecommendations}
            className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${scanning ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {scanning ? (
          <div className="py-6 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Scanning recent messages...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.slice(0, 4).map(rec => {
              const config = getCategoryConfig(rec.category);
              return (
                <div
                  key={rec._id}
                  className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-2xl"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 bg-${config.color}-100`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {rec.merchant || config.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rec.type === 'income' ? '+' : '-'}₹{rec.amount?.toLocaleString()} · {config.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setDismissed(prev => new Set([...prev, rec._id]))}
                      className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setConfirmItem(rec)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-primary rounded-xl text-primary-foreground text-xs font-bold"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
            {visible.length > 4 && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                +{visible.length - 4} more detected
              </p>
            )}
          </div>
        )}
      </div>

      {confirmItem && (
        <AddExpenseSheet
          open={!!confirmItem}
          onOpenChange={(v) => { if (!v) setConfirmItem(null); }}
          onSave={(data) => {
            onSave(data);
            setDismissed(prev => new Set([...prev, confirmItem._id]));
            setConfirmItem(null);
          }}
          prefill={confirmItem}
        />
      )}
    </>
  );
}
