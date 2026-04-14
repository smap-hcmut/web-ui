'use client';

import { useState, useRef, useCallback } from 'react';
import clsx from 'clsx';

interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

const sideStyles: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function Tooltip({ content, side = 'top', delay = 200, children, className }: TooltipProps) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const enter = useCallback(() => {
    timer.current = setTimeout(() => setShow(true), delay);
  }, [delay]);

  const leave = useCallback(() => {
    clearTimeout(timer.current);
    setShow(false);
  }, []);

  return (
    <div className={clsx('relative inline-flex', className)} onMouseEnter={enter} onMouseLeave={leave}>
      {children}
      {show && (
        <div
          className={clsx(
            'absolute z-[100] px-2.5 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap pointer-events-none',
            'animate-[fadeIn_150ms_ease]',
            sideStyles[side],
          )}
          style={{
            background: 'var(--bg-surface-solid)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
