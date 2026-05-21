import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { parsePaymentMessage } from '@/lib/paymentParser';
import { scanRecentPaymentMessages } from '@/lib/smsReader';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getCategoryConfig } from '@/lib/categoryConfig';

export default function PaymentDetector({ onDetected }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState([]);

  const handleDetect = () => {
    if (!message.trim()) return;
    const result = parsePaymentMessage(message);
    if (result) {
      setError('');
      onDetected(result);
      setOpen(false);
      setMessage('');
    } else {
      setError('Could not detect a valid credit or debit transaction.');
    }
  };

  const handleScanSms = async () => {
    setScanning(true);
    setError('');

    try {
      const result = await scanRecentPaymentMessages({ limit: 100 });
      setDetected(result.transactions);

      if (result.unavailableReason) {
        setError(result.unavailableReason);
      } else if (result.transactions.length === 0) {
        setError('No recent credit or debit SMS messages found.');
      }
    } catch (scanError) {
      setError(scanError?.message || 'Could not scan SMS messages.');
    } finally {
      setScanning(false);
    }
  };

  const reviewDetected = (transaction) => {
    onDetected(transaction);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-accent rounded-2xl text-primary font-semibold text-sm hover:bg-accent/80 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Detect Payment
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8 max-h-[86vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="w-5 h-5 text-primary" />
              Detect Payment
            </SheetTitle>
          </SheetHeader>

          <Button onClick={handleScanSms} className="w-full rounded-xl font-bold mb-4" disabled={scanning}>
            <RefreshCw className={`w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning SMS...' : 'Scan Recent SMS'}
          </Button>

          {detected.length > 0 && (
            <div className="mb-5 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Found in SMS
              </p>
              {detected.slice(0, 6).map((item) => {
                const config = getCategoryConfig(item.category);
                return (
                  <button
                    key={item._id}
                    onClick={() => reviewDetected(item)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/70 text-left"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${config.color}-100`}>
                      {config.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.merchant || item.sms_sender || config.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.type === 'income' ? '+' : '-'}₹{item.amount?.toLocaleString()} · {config.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-t border-border pt-4">
            <p className="text-muted-foreground text-sm mb-3">
              You can also paste a bank SMS or payment notification manually.
            </p>

            <Textarea
              placeholder="Paste payment message here..."
              value={message}
              onChange={e => { setMessage(e.target.value); setError(''); }}
              className="rounded-xl resize-none mb-2"
              rows={4}
            />

            {error && (
              <p className="text-destructive text-sm mb-3">{error}</p>
            )}

            <Button onClick={handleDetect} className="w-full rounded-xl font-bold" disabled={!message.trim()}>
              <Sparkles className="w-4 h-4 mr-2" />
              Extract & Review
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
