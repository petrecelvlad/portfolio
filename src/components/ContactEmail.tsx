import { useEffect, useState } from 'react';
import { Check, Copy, Mail } from 'lucide-react';
import { Button, BUTTON_COLORS } from '@/src/components/atoms/Button';

const COPIED_MS = 1800;

// No mail link on purpose: visitors paste the address into their own mail app.
export function ContactEmail({ email }: { email: string }) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;
    const timer = setTimeout(() => setIsCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [isCopied]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <span className="flex items-center gap-2 font-mono text-sm tablet:text-base font-bold tracking-wide text-surface-base">
        <Mail className="w-5 h-5 flex-shrink-0" aria-hidden />
        <span className="select-text">{email}</span>
      </span>
      <Button
        onClick={() => navigator.clipboard.writeText(email).then(() => setIsCopied(true))}
        color={BUTTON_COLORS.periwinkle}
        shape="chip"
        size="sm"
        aria-label={isCopied ? 'Email address copied' : 'Copy email address'}
        className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink-base"
      >
        {isCopied ? <Check className="w-4 h-4" strokeWidth={3} /> : <Copy className="w-4 h-4" strokeWidth={2.5} />}
        {isCopied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}
