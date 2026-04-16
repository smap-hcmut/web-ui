'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface CountdownTimerProps {
  seconds: number;
  onComplete?: () => void;
  className?: string;
}

export function CountdownTimer({ seconds: initial, onComplete, className }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initial);

  useEffect(() => {
    if (seconds <= 0) {
      onComplete?.();
      return;
    }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, onComplete]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = (seconds / initial) * 100;

  return (
    <div className={clsx('inline-flex items-center gap-2', className)}>
      <RefreshCw
        className={clsx('w-3 h-3', seconds > 0 && 'animate-spin')}
        style={{ color: 'var(--text-muted)', animationDuration: '3s' }}
      />
      <span className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%`, background: pct > 30 ? 'var(--accent)' : 'var(--warning)' }}
        />
      </div>
    </div>
  );
}
