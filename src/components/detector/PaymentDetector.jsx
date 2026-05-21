import { useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { parsePaymentMessage } from '@/lib/paymentParser';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function PaymentDetector({ onDetected }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleDetect = () => {
    if (!message.trim()) return;
    const result = parsePaymentMessage(message);
    if (result) {
      setError('');
      onDetected(result);
      setOpen(false);
      setMessage('');
    } else {
      setError('Could not detect a valid transaction. Please check the message or add manually.');
    }
  };

  const SAMPLE_MESSAGES = [
    'Your A/c XX1234 debited INR 450.00 at Swiggy on 18-04-2026.',
    'You have paid Rs.1299 to Amazon.in via UPI.',
    'INR 5000.00 credited to your account from salary.',
    'Rs 250 debited from your account at PVR Cinemas.',
  ];

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
        <SheetContent side="bottom" className="rounded-t-3xl pb-8 max-h-[80vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="w-5 h-5 text-primary" />
              Auto-Detect Payment
            </SheetTitle>
          </SheetHeader>

          <p className="text-muted-foreground text-sm mb-4">
            Paste your bank SMS or payment notification below. We'll extract the details automatically.
          </p>

          <Textarea
            placeholder="Paste your payment message here..."
            value={message}
            onChange={e => { setMessage(e.target.value); setError(''); }}
            className="rounded-xl resize-none mb-2"
            rows={4}
          />

          {error && (
            <p className="text-destructive text-sm mb-3">{error}</p>
          )}

          <Button onClick={handleDetect} className="w-full rounded-xl font-bold mb-4" disabled={!message.trim()}>
            <Sparkles className="w-4 h-4 mr-2" />
            Extract & Review
          </Button>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Try a sample</p>
            <div className="space-y-2">
              {SAMPLE_MESSAGES.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => setMessage(msg)}
                  className="w-full text-left flex items-center gap-2 p-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  <span className="text-xs text-muted-foreground flex-1 line-clamp-1">{msg}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
