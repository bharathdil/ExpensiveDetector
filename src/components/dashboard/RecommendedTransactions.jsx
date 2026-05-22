import { useState } from 'react';
import { Sparkles, Plus, X, RefreshCw } from 'lucide-react';
import { getCategoryConfig } from '@/lib/categoryConfig';
import { scanRecentPaymentMessages } from '@/lib/smsReader';
import AddExpenseSheet from '@/components/expense/AddExpenseSheet';

export default function RecommendedTransactions({ existingExpenses, onSave }) {
  const [recommendations, setRecommendations] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [confirmItem, setConfirmItem] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('Tap refresh to scan recent SMS messages.');
  const [showAll, setShowAll] = useState(false);

  const generateRecommendations = async () => {
    setScanning(true);
    setScanMessage('');

    try {
      const result = await scanRecentPaymentMessages({ existingExpenses, limit: 100 });
      setRecommendations(result.transactions);
      setShowAll(false);

      if (result.unavailableReason) {
        setScanMessage(result.unavailableReason);
      } else if (result.transactions.length === 0) {
        setScanMessage(
          result.totalMessages > 0
            ? 'No new credit or debit SMS messages found.'
            : 'No SMS messages found on this device.'
        );
      }
    } catch (error) {
      setScanMessage(error?.message || 'Could not scan SMS messages.');
    } finally {
      setScanning(false);
    }
  };

  const visible = recommendations.filter(r => !dismissed.has(r._id));
  const displayed = showAll ? visible : visible.slice(0, 4);

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
              <p className="text-xs text-muted-foreground">From device SMS</p>
            </div>
          </div>
          <button
            onClick={generateRecommendations}
            className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"
            disabled={scanning}
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${scanning ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {scanning ? (
          <div className="py-6 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Scanning recent SMS messages...</p>
          </div>
        ) : visible.length > 0 ? (
          <div className="space-y-2">
            {displayed.map(rec => {
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
                      {rec.merchant || rec.sms_sender || config.label}
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
              <button
                type="button"
                onClick={() => setShowAll(current => !current)}
                className="w-full py-1 text-xs text-center text-primary font-semibold"
              >
                {showAll ? 'Show less' : `+${visible.length - 4} more detected`}
              </button>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">{scanMessage}</p>
            <button
              onClick={generateRecommendations}
              className="mt-3 text-primary text-sm font-semibold"
            >
              Scan SMS
            </button>
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
